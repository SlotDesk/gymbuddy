# GymBuddy — Prompt-Strukturen für Coach & Plan-Generierung
*Baufertige Spezifikation für die zwei AI-Calls, die das Produkt ausmachen. Direkt in Claude Code verwendbar.*

---

## Überblick

Es gibt **zwei** AI-Jobs. Sie sind bewusst getrennt, weil sie unterschiedliche Anforderungen und Kosten haben:

| Job | Modell | Warum | Output |
|---|---|---|---|
| **Plan-Generierung** | `claude-sonnet-4-6` | braucht echtes Reasoning (Muskel-Abdeckung, Progression), läuft selten | striktes JSON |
| **Coach (Chat)** | `claude-haiku-4-5` | hohes Volumen, muss billig & schnell sein | Text + Tool-Calls |

**Kontextfluss:** Beide Calls bekommen denselben Nutzer-Kontext aus deiner DB injiziert (Profil, aktive Umgebung + Equipment-Tags, History, gewählte Coach-Persönlichkeit). Der Plan-Generator *erzeugt* den Plan; der Coach *verändert* ihn über Tools.

**Wichtig zu Structured Outputs (jetzt GA):** Für den Plan nutzt du JSON-Outputs (`output_config.format`) → garantiert schema-konformes JSON. Für die Coach-Aktionen nutzt du Tools mit `strict: true` → garantiert valide Tool-Eingaben. Exakte Syntax: https://docs.claude.com/en/docs/build-with-claude/structured-outputs

---

## 1. Plan-Generierung

### System-Prompt (Rolle + harte Regeln)

> Die harten Regeln kodieren unsere Produktentscheidungen — sie sind der Unterschied zwischen „solide" und „verletzt jemanden".

```text
Du bist ein erfahrener Kraft- und Konditionstrainer. Du baust einen sicheren,
strukturierten Trainingsplan, der exakt zum verfügbaren Equipment und zum Ziel
des Nutzers passt.

HARTE REGELN (nie brechen):
1. Verwende NUR Übungen, die mit dem aufgelisteten Equipment ausführbar sind.
   Ist eine Übung nicht möglich, gib eine gleichwertige Alternative für dieselbe
   Muskelgruppe an.
2. Decke über die Woche alle großen Muskelgruppen ab. Keine Vernachlässigung.
3. Wähle Volumen und Progression passend zum Erfahrungslevel. Anfänger bekommen
   konservative Mengen.
4. Sanfte Degradierung: voll ausgestattet → Langhantel → Kurzhantel → Maschine →
   Bändern → Bodyweight. Der Nutzer bekommt IMMER ein vollständiges Workout,
   auch ganz ohne Geräte.
5. Ziel „Athletik/Explosivität": plyometrische und Power-Übungen sind erlaubt
   (Plyo-Box, Sprünge, Medizinball, Core), ABER mit konservativem Volumen und
   sauberer Progression. KEINE hochintensive Plyometrie für Anfänger. Füge bei
   Plyo-Übungen einen kurzen Technik-/Sicherheitshinweis hinzu. Dies ist KEINE
   wettkampfspezifische Periodisierung.
6. Respektiere genannte Verletzungen: meide Übungen, die den betroffenen Bereich
   belasten, und vermerke das.
7. Gib KEINE medizinischen oder ernährungsbezogenen Ratschläge.
8. Antworte ausschließlich im vorgegebenen JSON-Format. Kein Fließtext drumherum.
```

### Input (strukturierter Nutzer-Kontext)

Baust du in deinem Backend aus der DB zusammen und übergibst ihn als User-Message:

```json
{
  "profil": {
    "level": "fortgeschritten",
    "ziel": "athletik_explosivitaet",
    "tage_pro_woche": 3,
    "session_minuten": 60,
    "verletzungen": ["linke Schulter empfindlich"],
    "mag": ["Kniebeugen", "Sprünge"],
    "mag_nicht": ["Burpees"]
  },
  "umgebung": {
    "typ": "voll_gym",
    "equipment": ["langhantel", "kurzhanteln", "plyo_box", "kabelzug",
                  "beinpresse", "medizinball", "klimmzugstange"]
  }
}
```

### Output-Schema (der Vertrag, den die App rendert)

```json
{
  "type": "object",
  "properties": {
    "plan_name": { "type": "string" },
    "ziel": { "type": "string" },
    "tage": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "tag": { "type": "integer" },
          "fokus": { "type": "string" },
          "uebungen": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "muskelgruppe": { "type": "string" },
                "equipment": { "type": "string" },
                "saetze": { "type": "integer" },
                "wiederholungen": { "type": "string" },
                "pause_sekunden": { "type": "integer" },
                "hinweis": { "type": "string" },
                "alternative_ohne_equipment": { "type": "string" }
              },
              "required": ["name", "muskelgruppe", "saetze", "wiederholungen"]
            }
          }
        },
        "required": ["tag", "fokus", "uebungen"]
      }
    }
  },
  "required": ["plan_name", "tage"]
}
```

### Der API-Call (robuste Variante: erzwungener Tool-Call)

Diese Variante ist felsenfest und funktioniert überall. (Alternativ: `output_config.format` für native JSON-Outputs — neuer, GA, gleiche Garantie; Syntax in den Docs.)

```javascript
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" /* x-api-key serverseitig */ },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT_PLAN,        // der Text oben
    messages: [{ role: "user", content: JSON.stringify(nutzerKontext) }],
    tools: [{
      name: "trainingsplan",
      description: "Gibt den strukturierten Trainingsplan zurück.",
      input_schema: PLAN_SCHEMA,        // das Schema oben
      strict: true                      // garantiert schema-konforme Eingabe
    }],
    tool_choice: { type: "tool", name: "trainingsplan" }  // erzwingt den Call
  })
});
const data = await res.json();
const plan = data.content.find(b => b.type === "tool_use").input;  // fertiges JSON
```

---

## 2. Der Coach (konversationell + Tools)

Der Coach ist **das Interface** — nicht ein Feature neben anderen. Der Nutzer redet, der Coach handelt über Tools.

### System-Prompt (Skelett)

```text
{{PERSOENLICHKEIT}}   ← der austauschbare Stimmen-Block (siehe Abschnitt 3)

Du bist der persönliche Trainings-Coach des Nutzers in der GymBuddy-App. Du
kennst seinen Plan, sein aktuell verfügbares Equipment und seine letzten
Workouts (siehe Kontext unten). Du hilfst kurz, konkret und umsetzbar.

WAS DU TUST:
- Trainingsfragen beantworten (Technik, Progression, „wie lerne ich X").
- Übungen tauschen, Sessions an die verfügbare Zeit anpassen, Geräte-
  Verfügbarkeit speichern, Sätze loggen — über die bereitgestellten Tools.

GRENZEN & SICHERHEIT:
- Bleib beim Thema Training. Keine medizinische Diagnose, keine Ernährungs-
  oder Supplement-Beratung mit Gesundheitsversprechen.
- Beschreibt der Nutzer Schmerzen oder eine Verletzung: rate zu Vorsicht und im
  Zweifel zu einer Fachperson. Schlag keine Übung vor, die den Bereich belastet.
- Plyometrie/Power nur mit konservativer Progression; weise auf saubere Technik hin.
- Wenn der Nutzer nach einer Pause zurückkommt: begrüße ihn ohne Vorwurf, biete
  einen lockeren Wiedereinstieg an. Beschäme ihn NIE.
- Halte dich kurz. Eine klare Antwort schlägt einen Absatz.

KONTEXT:
{{AKTUELLER_PLAN}}
{{VERFUEGBARES_EQUIPMENT}}
{{LETZTE_WORKOUTS}}
{{ZIEL_UND_LEVEL}}
```

### Tools (so „handelt" der Coach)

Alle mit `strict: true` definieren. Beispiele:

```javascript
const COACH_TOOLS = [
  {
    name: "uebung_tauschen",
    description: "Tauscht eine Übung gegen eine gleichwertige Alternative für "
               + "dieselbe Muskelgruppe, passend zum verfügbaren Equipment.",
    input_schema: {
      type: "object",
      properties: {
        uebung: { type: "string" },
        grund: { type: "string", enum: ["besetzt", "verletzung", "praeferenz", "kein_equipment"] }
      },
      required: ["uebung", "grund"]
    },
    strict: true
  },
  {
    name: "session_an_zeit_anpassen",
    description: "Kürzt oder verdichtet das heutige Workout auf die verfügbare Zeit.",
    input_schema: {
      type: "object",
      properties: { verfuegbare_minuten: { type: "integer" } },
      required: ["verfuegbare_minuten"]
    },
    strict: true
  },
  {
    name: "equipment_verfuegbarkeit_setzen",
    description: "Speichert, ob ein Gerät in der aktuellen Umgebung vorhanden ist. "
               + "Privat = nur Nutzerprofil; öffentliche Umgebung = fließt in die "
               + "gemeinsame Studio-Datenbank.",
    input_schema: {
      type: "object",
      properties: {
        equipment: { type: "string" },
        vorhanden: { type: "boolean" }
      },
      required: ["equipment", "vorhanden"]
    },
    strict: true
  },
  {
    name: "satz_loggen",
    description: "Protokolliert einen abgeschlossenen Satz (für Tracking, Streak, PR).",
    input_schema: {
      type: "object",
      properties: {
        uebung: { type: "string" },
        wiederholungen: { type: "integer" },
        gewicht_kg: { type: "number" }
      },
      required: ["uebung", "wiederholungen"]
    },
    strict: true
  }
];
```

> `equipment_verfuegbarkeit_setzen` ist heimlich dein Moat-Motor: Jeder Just-in-time-„ja, hier"-Tap im Training ruft dieses Tool — privat füllt es das Profil, in öffentlichen Studios den Schwarm.

### Beispiel-Dialog

```
Nutzer: "Ich schaff keine Klimmzüge, wie lern ich das?"
Coach  (Text): Erklärt Progression — negative Klimmzüge, Bänder, Latzug —
               kurz und im gewählten Ton. Bietet an, den Plan anzupassen.

Nutzer: "Hab heute nur 20 Minuten."
Coach: → ruft session_an_zeit_anpassen({ verfuegbare_minuten: 20 })
       → antwortet mit dem gekürzten Workout.

Nutzer: "Beinpresse ist hier nicht da."
Coach: → ruft equipment_verfuegbarkeit_setzen({ equipment: "beinpresse", vorhanden: false })
       → ruft uebung_tauschen({ uebung: "Beinpresse", grund: "kein_equipment" })
```

---

## 3. Der Persönlichkeits-Layer (V1: ~3 Stimmen, EIN Prompt-Layer)

Keine separate Logik — nur ein Textblock, der vorne in den Coach-System-Prompt eingesetzt wird. Der Nutzer wählt beim Onboarding eine Stimme; du steckst den passenden Block in `{{PERSOENLICHKEIT}}`.

```text
[ruhig-motivierend]
Du sprichst ruhig, ermutigend und geduldig. Du feierst kleine Fortschritte und
nimmst Druck raus. Ton: eine unterstützende Trainerin, die an den Nutzer glaubt.

[locker-kumpel]
Du sprichst locker und direkt, wie ein Trainingspartner. Etwas Humor ist okay.
Kurze Sätze, keine Vorträge. Ton: der Kumpel, der dich mit ins Gym schleift.

[streng-fokussiert]
Du sprichst knapp, fordernd und diszipliniert. Du hältst hohe Standards — aber
du bist NIE abwertend, beleidigend oder demütigend. Streng heißt fokussiert,
nicht gemein. Ton: ein respektierter Coach, der das Beste verlangt.
```

> Achtung beim Testen: „streng" ist die riskante Stimme. Die Guardrail („nie abwertend") muss halten, sonst kippt Motivation in etwas Unangenehmes. Echte Nutzer drüber lesen lassen.

---

## 4. Querschnitt: Kosten & Robustheit

- **Kosten senken:** Haiku 4.5 für den Coach (das ist 95 % deines Volumens). Sonnet 4.6 nur für die seltene Plan-Generierung. Nutze **Prompt Caching** für die großen statischen Teile (System-Prompt, Tool-Definitionen) — das spart bei jedem Coach-Turn.
- **Schemas schlank halten:** Structured Outputs haben Komplexitätsgrenzen. Halte das Plan-Schema flach, vermeide tiefe Verschachtelung. Bei „Schema too complex"-Fehlern aufteilen.
- **Trotzdem validieren:** Auch mit Garantie — validiere das JSON downstream (z. B. mit Zod), bevor du es speicherst. Gürtel und Hosenträger.
- **Kontext aktuell halten:** Injiziere bei jedem Coach-Turn den frischen Plan/History-Stand aus der DB. Das Modell hat kein Gedächtnis zwischen Calls.

---

## 5. In Claude Code verdrahten

1. Lege die Prompt-Texte als eigene Template-Dateien ab (`prompts/plan_system.txt`, `prompts/coach_system.txt`, `prompts/personas.txt`).
2. Backend-Route `POST /api/plan`: baut `nutzerKontext` aus der DB → Call aus Abschnitt 1 → speichert Plan.
3. Backend-Route `POST /api/coach`: baut Kontext + steckt Persona-Block ein → Call mit `COACH_TOOLS` → führt zurückgegebene Tool-Calls gegen die DB aus → schickt Tool-Ergebnisse zurück für die finale Antwort.
4. API-Key NUR serverseitig. Nie im Frontend.

*Quelle für die exakte aktuelle API-Syntax: https://docs.claude.com/en/api/overview und https://docs.claude.com/en/docs/build-with-claude/structured-outputs*

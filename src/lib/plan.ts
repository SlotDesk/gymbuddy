// Der Vertrag für die Plan-Generierung an einer Stelle:
// System-Prompt + JSON-Schema (wörtlich aus docs/prompt-strukturen.md),
// die TS-Typen, die App und Route teilen, und die Auswahllisten fürs Formular.

// ── System-Prompt (Rolle + harte Regeln) ────────────────────────────────────
export const SYSTEM_PROMPT_PLAN = `Du bist ein erfahrener Kraft- und Konditionstrainer. Du baust einen sicheren,
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
8. Antworte ausschließlich im vorgegebenen JSON-Format. Kein Fließtext drumherum.`;

// ── Output-Schema (der Vertrag, den die App rendert) ─────────────────────────
export const PLAN_SCHEMA = {
  type: "object",
  properties: {
    plan_name: { type: "string" },
    ziel: { type: "string" },
    tage: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tag: { type: "integer" },
          fokus: { type: "string" },
          uebungen: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                muskelgruppe: { type: "string" },
                equipment: { type: "string" },
                saetze: { type: "integer" },
                wiederholungen: { type: "string" },
                pause_sekunden: { type: "integer" },
                hinweis: { type: "string" },
                alternative_ohne_equipment: { type: "string" },
              },
              required: ["name", "muskelgruppe", "saetze", "wiederholungen"],
            },
          },
        },
        required: ["tag", "fokus", "uebungen"],
      },
    },
  },
  required: ["plan_name", "tage"],
} as const;

// ── Typen ────────────────────────────────────────────────────────────────────
export interface Uebung {
  name: string;
  muskelgruppe: string;
  equipment?: string;
  saetze: number;
  wiederholungen: string;
  pause_sekunden?: number;
  hinweis?: string;
  alternative_ohne_equipment?: string;
}

export interface Tag {
  tag: number;
  fokus: string;
  uebungen: Uebung[];
}

export interface Plan {
  plan_name: string;
  ziel?: string;
  tage: Tag[];
}

export interface FormInput {
  level: string;
  ziel: string;
  tage_pro_woche: number;
  session_minuten: number;
  verletzungen: string; // Freitext aus dem Formular
  equipment: string[]; // ausgewählte Equipment-IDs
}

// Nutzer-Kontext, wie er als User-Message an das Modell geht.
export interface NutzerKontext {
  profil: {
    level: string;
    ziel: string;
    tage_pro_woche: number;
    session_minuten: number;
    verletzungen: string[];
  };
  umgebung: {
    typ: string;
    equipment: string[];
  };
}

// ── Auswahllisten fürs Formular ──────────────────────────────────────────────
export const LEVEL_OPTIONS = [
  { id: "anfaenger", label: "Anfänger" },
  { id: "fortgeschritten", label: "Fortgeschritten" },
  { id: "profi", label: "Profi" },
] as const;

export const ZIEL_OPTIONS = [
  { id: "muskelaufbau", label: "Muskelaufbau" },
  { id: "kraft", label: "Maximalkraft" },
  { id: "athletik_explosivitaet", label: "Athletik / Explosivität" },
  { id: "ausdauer", label: "Ausdauer" },
  { id: "abnehmen", label: "Abnehmen / Definition" },
] as const;

export const EQUIPMENT_OPTIONS = [
  { id: "langhantel", label: "Langhantel" },
  { id: "kurzhanteln", label: "Kurzhanteln" },
  { id: "plyo_box", label: "Plyo-Box" },
  { id: "kabelzug", label: "Kabelzug" },
  { id: "beinpresse", label: "Beinpresse" },
  { id: "klimmzugstange", label: "Klimmzugstange" },
  { id: "medizinball", label: "Medizinball" },
  { id: "baender", label: "Widerstandsbänder" },
  { id: "kein_equipment", label: "Kein Equipment (Bodyweight)" },
] as const;

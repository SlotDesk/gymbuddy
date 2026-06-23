import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  PLAN_SCHEMA,
  SYSTEM_PROMPT_PLAN,
  type FormInput,
  type NutzerKontext,
  type Plan,
} from "@/lib/plan";

// Plan-Generierung läuft selten → Sonnet 4.6 (echtes Reasoning), nicht der Coach.
const MODEL = "claude-sonnet-4-6";

// Wandelt den Verletzungs-Freitext in das vom Schema erwartete String-Array um.
function parseVerletzungen(freitext: string): string[] {
  return freitext
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Baut aus dem Formular den strukturierten Nutzer-Kontext (sonst aus der DB).
function baueNutzerKontext(input: FormInput): NutzerKontext {
  const equipment = input.equipment ?? [];
  const nurBodyweight =
    equipment.length === 0 ||
    (equipment.length === 1 && equipment[0] === "kein_equipment");

  return {
    profil: {
      level: input.level,
      ziel: input.ziel,
      tage_pro_woche: input.tage_pro_woche,
      session_minuten: input.session_minuten,
      verletzungen: parseVerletzungen(input.verletzungen ?? ""),
    },
    umgebung: {
      typ: nurBodyweight ? "bodyweight" : "individuell",
      equipment,
    },
  };
}

// Leichtgewichtige Validierung downstream (Gürtel und Hosenträger), bevor der
// Plan an die App geht — auch wenn der erzwungene Tool-Call schon Form garantiert.
function istPlan(value: unknown): value is Plan {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.plan_name !== "string") return false;
  if (!Array.isArray(v.tage) || v.tage.length === 0) return false;
  return v.tage.every((tag) => {
    if (typeof tag !== "object" || tag === null) return false;
    const t = tag as Record<string, unknown>;
    return (
      typeof t.tag === "number" &&
      typeof t.fokus === "string" &&
      Array.isArray(t.uebungen)
    );
  });
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY ist nicht gesetzt (.env.local)." },
      { status: 500 },
    );
  }

  let input: FormInput;
  try {
    input = (await request.json()) as FormInput;
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Request-Body." },
      { status: 400 },
    );
  }

  const nutzerKontext = baueNutzerKontext(input);

  // API-Key wird vom SDK serverseitig aus process.env.ANTHROPIC_API_KEY gelesen.
  const client = new Anthropic();

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT_PLAN,
      messages: [{ role: "user", content: JSON.stringify(nutzerKontext) }],
      tools: [
        {
          name: "trainingsplan",
          description: "Gibt den strukturierten Trainingsplan zurück.",
          // PLAN_SCHEMA wörtlich aus den Prompt-Strukturen.
          input_schema: PLAN_SCHEMA as Anthropic.Tool.InputSchema,
        },
      ],
      // Erzwingt den Tool-Call → garantiert schema-geformtes JSON.
      tool_choice: { type: "tool", name: "trainingsplan" },
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Modell hat keinen Trainingsplan zurückgegeben." },
        { status: 502 },
      );
    }

    const plan = toolUse.input;
    if (!istPlan(plan)) {
      return NextResponse.json(
        { error: "Zurückgegebener Plan ist unvollständig." },
        { status: 502 },
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    const detail =
      error instanceof Anthropic.APIError
        ? `${error.status ?? ""} ${error.message}`.trim()
        : "Unerwarteter Fehler bei der Plan-Generierung.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

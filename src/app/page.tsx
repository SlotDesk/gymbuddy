"use client";

import { useState } from "react";
import {
  EQUIPMENT_OPTIONS,
  LEVEL_OPTIONS,
  ZIEL_OPTIONS,
  type FormInput,
  type Plan,
} from "@/lib/plan";

const initialForm: FormInput = {
  level: "fortgeschritten",
  ziel: "athletik_explosivitaet",
  tage_pro_woche: 3,
  session_minuten: 60,
  verletzungen: "",
  equipment: ["langhantel", "kurzhanteln", "klimmzugstange"],
};

export default function Home() {
  const [form, setForm] = useState<FormInput>(initialForm);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEquipment(id: string) {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(id)
        ? f.equipment.filter((e) => e !== id)
        : [...f.equipment, id],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Plan konnte nicht erstellt werden.");
        return;
      }
      setPlan(data.plan as Plan);
    } catch {
      setError("Netzwerkfehler — bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight">GymBuddy</h1>
        <p className="mt-2 text-gray-600">
          Ein sicherer Trainingsplan, exakt zu deinem Equipment und Ziel.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-black/10 bg-card p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Level">
            <select
              className="input"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ziel">
            <select
              className="input"
              value={form.ziel}
              onChange={(e) => setForm({ ...form, ziel: e.target.value })}
            >
              {ZIEL_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tage pro Woche">
            <input
              type="number"
              min={1}
              max={7}
              className="input"
              value={form.tage_pro_woche}
              onChange={(e) =>
                setForm({ ...form, tage_pro_woche: Number(e.target.value) })
              }
            />
          </Field>

          <Field label="Minuten pro Session">
            <input
              type="number"
              min={15}
              max={180}
              step={5}
              className="input"
              value={form.session_minuten}
              onChange={(e) =>
                setForm({ ...form, session_minuten: Number(e.target.value) })
              }
            />
          </Field>
        </div>

        <Field label="Verletzungen / Einschränkungen (Freitext)">
          <textarea
            className="input min-h-[72px]"
            placeholder="z. B. linke Schulter empfindlich, Knie vorsichtig"
            value={form.verletzungen}
            onChange={(e) => setForm({ ...form, verletzungen: e.target.value })}
          />
        </Field>

        <Field label="Verfügbares Equipment">
          <div className="grid gap-2 sm:grid-cols-2">
            {EQUIPMENT_OPTIONS.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-accent"
                  checked={form.equipment.includes(o.id)}
                  onChange={() => toggleEquipment(o.id)}
                />
                <span className="text-sm">{o.label}</span>
              </label>
            ))}
          </div>
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-6 py-3 font-medium text-white transition disabled:opacity-50"
        >
          {loading ? "Erstelle Plan…" : "Plan generieren"}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {plan && <PlanView plan={plan} />}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.95rem;
          outline: none;
        }
        .input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function PlanView({ plan }: { plan: Plan }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold tracking-tight">
        {plan.plan_name}
      </h2>
      {plan.ziel && <p className="mt-1 text-gray-600">Ziel: {plan.ziel}</p>}

      <div className="mt-6 space-y-6">
        {plan.tage.map((tag) => (
          <div
            key={tag.tag}
            className="rounded-xl border border-black/10 bg-card p-6"
          >
            <div className="mb-4 flex items-baseline gap-3">
              <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-green-700">
                Tag {tag.tag}
              </span>
              <h3 className="text-lg font-semibold">{tag.fokus}</h3>
            </div>

            <ul className="space-y-4">
              {tag.uebungen.map((u, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-black/10 bg-white p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{u.name}</span>
                    <span className="font-mono text-sm text-gray-700">
                      {u.saetze} × {u.wiederholungen}
                      {u.pause_sekunden ? ` · Pause ${u.pause_sekunden}s` : ""}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{u.muskelgruppe}</span>
                    {u.equipment && <span>· {u.equipment}</span>}
                  </div>

                  {u.hinweis && (
                    <p className="mt-2 border-l-2 border-coral pl-3 text-sm text-gray-700">
                      {u.hinweis}
                    </p>
                  )}
                  {u.alternative_ohne_equipment && (
                    <p className="mt-2 text-sm text-gray-500">
                      Ohne Equipment: {u.alternative_ohne_equipment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

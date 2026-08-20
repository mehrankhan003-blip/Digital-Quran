"use client";

import { useEffect, useState } from "react";
import { RECITERS } from "@/lib/audio";
import { getPref, setPref } from "@/lib/prefs";
import type { TranslationMode } from "./Reader";

const TRANSLATIONS: { id: TranslationMode; label: string; note: string }[] = [
  { id: "arabic", label: "Arabic only", note: "Show the Arabic text without translations" },
  { id: "urdu", label: "Urdu", note: "Arabic with Urdu translation (Jalandhry)" },
  { id: "roman", label: "Roman Urdu", note: "Arabic with Roman Urdu translation" },
  { id: "english", label: "English", note: "Arabic with English translation (Saheeh International)" },
  { id: "all", label: "Show All", note: "Arabic, Urdu, Roman Urdu and English together" },
];

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function SettingsView() {
  const [translation, setTranslation] = useState<TranslationMode>(() => getPref("translation", "urdu"));
  const [reciter, setReciter] = useState<string>(() => getPref("reciter", RECITERS[0].id));
  const [speed, setSpeed] = useState(() => getPref("speed", 1));
  const [autoscroll, setAutoscroll] = useState(() => getPref("autoscroll", true));

  useEffect(() => setPref("translation", translation), [translation]);
  useEffect(() => setPref("reciter", reciter), [reciter]);
  useEffect(() => setPref("speed", speed), [speed]);
  useEffect(() => setPref("autoscroll", autoscroll), [autoscroll]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:px-8">
      <p className="text-sm uppercase tracking-[.2em] text-gold">Preferences</p>
      <h1 className="mt-2 text-4xl font-semibold">Reading settings</h1>
      <p className="mt-3 text-ink/55">
        Saved on this device and applied automatically when you open the Quran.
      </p>

      <section className="mt-8 divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-surface">
        <div className="p-5">
          <div className="text-sm font-semibold">Translation</div>
          <p className="mt-1 text-xs text-ink/45">Default layers shown under each ayah.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTranslation(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  translation === t.id ? "bg-forest text-white" : "bg-ivory text-ink/60 hover:bg-mist"
                }`}
                title={t.note}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <div className="text-sm font-semibold">Default reciter</div>
          <p className="mt-1 text-xs text-ink/45">Recitation plays ayah by ayah from the chosen reciter.</p>
          <select
            value={reciter}
            onChange={(e) => setReciter(e.target.value)}
            className="mt-3 w-full rounded-xl border border-ink/10 bg-surface px-3 py-2 text-sm"
          >
            {RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-5">
          <div className="text-sm font-semibold">Playback speed</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  speed === s ? "bg-forest text-white" : "bg-ivory text-ink/60 hover:bg-mist"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="text-sm font-semibold">Auto-scroll</span>
              <p className="mt-1 text-xs text-ink/45">Follow recitation and keep the current ayah centred.</p>
            </span>
            <button
              onClick={() => setAutoscroll(!autoscroll)}
              role="switch"
              aria-checked={autoscroll}
              className={`relative h-6 w-11 rounded-full transition ${autoscroll ? "bg-forest" : "bg-ink/20"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${autoscroll ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </label>
        </div>
      </section>
    </main>
  );
}
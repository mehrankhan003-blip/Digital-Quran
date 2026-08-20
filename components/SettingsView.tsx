"use client";

import { useEffect, useRef, useState } from "react";
import { CloudUpload, Database, Download, Upload } from "lucide-react";
import { RECITERS } from "@/lib/audio";
import { getPref, setPref, exportPrefs, importPrefs } from "@/lib/prefs";
import { exportBackup, importBackup, type Backup } from "@/lib/notes";
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
  const [syncMsg, setSyncMsg] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setPref("translation", translation), [translation]);
  useEffect(() => setPref("reciter", reciter), [reciter]);
  useEffect(() => setPref("speed", speed), [speed]);
  useEffect(() => setPref("autoscroll", autoscroll), [autoscroll]);

  const onExport = () => {
    const backup: Backup = { ...exportBackup(), prefs: exportPrefs() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSyncMsg("Backup downloaded. Keep it somewhere safe.");
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (importBackup(data)) {
          importPrefs(data.prefs ?? {});
          setTranslation(getPref("translation", "urdu"));
          setReciter(getPref("reciter", RECITERS[0].id));
          setSpeed(getPref("speed", 1));
          setAutoscroll(getPref("autoscroll", true));
          setSyncMsg("Backup restored successfully.");
        } else {
          setSyncMsg("That file is not a valid Noor backup.");
        }
      } catch {
        setSyncMsg("Could not read that file. Choose the backup you exported from Noor.");
      }
    };
    reader.readAsText(file);
  };

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

      <section className="mt-6 divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-surface">
        <div className="flex items-center gap-3 p-5">
          <Database size={18} className="shrink-0 text-gold" />
          <div>
            <div className="text-sm font-semibold">Data & sync</div>
            <p className="mt-1 text-xs text-ink/45">
              Bookmarks, notes, history and reading preferences live on this device.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 p-5">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Download size={16} /> Export backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ivory px-4 py-2 text-sm font-medium transition hover:bg-mist"
          >
            <Upload size={16} /> Restore backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
          {syncMsg && <span className="text-xs text-forest">{syncMsg}</span>}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <CloudUpload size={18} className="shrink-0 text-ink/40" />
            <div>
              <div className="text-sm font-semibold">Cloud sync & AI discovery</div>
              <p className="mt-1 text-xs leading-5 text-ink/45">
                Cross-device sync and bounded semantic search are ready in the code but need a
                provider to light up. Add a Supabase project for sync and an OpenAI-compatible key
                for discovery — details in <code className="rounded bg-ivory px-1">docs/DATA_SOURCES.md</code>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
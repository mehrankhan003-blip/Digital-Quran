<div align="center">

# قرآن · Digital Quran

### Read with presence. Listen with peace.

The most thoughtful, accessible way to read, listen to and understand the Quran —
an installable, mobile-first Progressive Web App with all **114 Surahs · 6,236 Ayahs**,
authentic Uthmani Arabic, Urdu, Roman Urdu and English translations, and ayah-by-ayah
recitation — on every screen.

![Next.js](https://img.shields.io/badge/Next.js%2015-black?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## ✨ Highlights

- **Canonical data, guaranteed** — Arabic text is never typed by hand or generated. It comes
  from the Uthmani edition (Tanzil distribution) and every file is validated at build time.
- **Truly bilingual + Roman Urdu** — Urdu (Jalandhry), English (Saheeh International) and the
  complete **Abul Ala Maududi Roman Urdu** translation, switchable or shown all together.
- **Word-by-word** — every word of every ayah with its English meaning and transliteration.
- **Ayah-synchronised recitation** — 7 reciters, auto-scroll highlighting, repeat, speed.
- **Built for learning & memorisation** — Hifz mode, Khatmah planner, bookmarks, notes, history.
- **Private by design** — everything is stored on-device; optional manual backup/restore.
- **Fast & installable** — fully static Quran (153 pre-rendered pages), ~110 kB first load, PWA.

## 📖 Features

### Reading
- Complete canonical Uthmani Arabic text with **sajdah markers** on every prostration ayah
- Surah, **Juz (30), Hizb (60) and Manzil (7)** navigation with full-section reading views
- Translation layers: Arabic · Urdu · Roman Urdu · English · Show All
- **Word-by-word** meanings (83,665 words: Arabic + English + transliteration)
- **Focus / Mushaf mode** — distraction-free, single-column, larger Arabic, chrome hidden

### Listening
- 7 reciters from the public `everyayah.com` CDN, ayah-by-ayah
- Play / pause, next / previous, **repeat ayah**, **repeat section**, playback speed
- Current-ayah highlight + smooth auto-scroll while recitation plays

### Learning & personal journey
- **Hifz (memorisation)** — tap to reveal one hidden word at a time, or reveal the whole ayah
- **Khatmah planner** — daily page goal or target completion date, with today's pages one tap away
- **Bookmarks, per-ayah notes and reading history** — your position is always remembered
- **Smart search** — Arabic (diacritic-insensitive), Urdu and English, plus a Roman→Arabic
  dictionary so `sabr`, `patience` and `صبر` all find the right ayahs
- Deep links — `/quran/2#ayah-2-183` opens Al-Baqarah exactly at ayah 183

## 🚀 Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## ☁️ Deploy on Vercel

**Zero-config (recommended):** push to GitHub, then import the repository in the
[Vercel dashboard](https://vercel.com/new). Vercel auto-detects Next.js and runs the
production build — no configuration needed.

**Or via the CLI:**

```bash
npm i -g vercel
vercel login
vercel          # preview deployment
vercel --prod   # production deployment
```

The app is fully static except the optional `/api/discover` endpoint. Nothing else needs
environment variables — features simply stay disabled until you add them (see `docs/DATA_SOURCES.md`).

## 🛠 Scripts & data pipeline

| Script | Purpose |
| --- | --- |
| `scripts/build-data.mjs` | Rebuilds `data/quran/*.json` (surahs, ayahs, juz/hizb/manzil, pages) from AlQuran.cloud + validates counts |
| `scripts/build-words-qurancom.mjs` | Word-by-word dataset (fast, resumable, Quran.com API) |
| `scripts/build-words.mjs` | Alternative word-by-word builder (HuggingFace Quran-MD) |
| `scripts/fetch-roman-urdu.mjs` | Abul Ala Maududi Roman Urdu (free CDN, public domain) |

Every script refuses to write incomplete or invalid data — the dataset can never silently
shrink or corrupt.

## 🗂 Project structure

```
app/            App Router pages (home, quran, juz, search, settings, khatmah, api)
components/     Reader, SurahReader, QuranIndex, SearchView, SettingsView, KhatmahView…
lib/            Canonical data access + localStorage persistence
data/quran/     Validated datasets (ayahs, words, roman urdu, juz/hizb/manzil/pages)
scripts/        Data builders & fetchers
docs/           DATA_SOURCES.md — provenance & licenses
```

## 📜 Data integrity & attribution

- Arabic: Uthmani script, **Tanzil** distribution via AlQuran.cloud
- Urdu: **Fateh Muhammad Jalandhry** (Tanzil) · English: **Saheeh International**
- Roman Urdu: **Abul Ala Maududi** (public domain, fawazahmed0/quran-api — Unlicense)
- Word-by-word: **Quran.com** corpus (83,665 words)
- Recitation: **everyayah.com** public CDN
- Full provenance and licensing: [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)

## 🧭 Roadmap

1. ~~Canonical Quran data layer~~
2. ~~Complete 114-surah navigation + Juz/Hizb/Manzil~~
3. ~~Bookmarks / notes / reading history / continue reading~~
4. ~~Khatmah planner + daily goals~~
5. ~~Hifz (memorisation) mode~~
6. ~~Focus / Mushaf mode~~
7. ~~Word-by-word meanings~~
8. ~~Roman Urdu translation (public domain)~~
9. Auth + cross-device sync (Supabase — manual backup/restore shipped)
10. Semantic discovery (`/api/discover` shipped; add your AI key)
11. Accessibility, SEO & production QA

---

<p align="center">Made with ❤️ for anyone who wants to read the Quran anywhere.</p>
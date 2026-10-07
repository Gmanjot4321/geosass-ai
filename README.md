# GeoSass — Photo Geolocator AI 🌍🎯

[![Live Demo](https://img.shields.io/badge/Live_Demo-geosass--ai.onrender.com-success?style=for-the-badge&logo=render)](https://geosass-ai.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Gmanjot4321/geosass-ai)

> 🔗 **Live Demo:** [https://geosass-ai.onrender.com](https://geosass-ai.onrender.com)

**GeoSass** is a full-stack, multimodal Open Source Intelligence (OSINT) web application designed to identify the exact real-world geographical coordinates of any photo—ranging from dense urban alleys and interior cafes to obscure dirt paths and foliage. 

Pairing computer vision deduction with dynamic satellite mapping and sarcastic voice dubbing, GeoSass models the visual investigative techniques of top human OSINT detectives.

---

## ⚡ Key Highlights & Architecture

* **Multimodal Visual Forensic Analysis:** Ingests raw imagery and prompts Google Gemini's multimodal vision models to run structured hierarchical deductions across architectural styles, road markings, civil infrastructure, solar azimuth/shadow angles, and botanical biomes.
* **Guaranteed Structured JSON Schemas:** Forces model outputs into strictly typed geographic schemas including decimal coordinates, confidence ratings, and bounding coordinate zooms.
* **Sub-Second Neural Audio Synthesis:** Implements a custom multi-tier voice pipeline powered by edge-synthesized neural models and xAI Grok TTS, routed through the Web Audio API with a custom dynamics compressor and EQ chain.
* **Synchronized Clue Zoom & Interactive Loupe:** Custom 3.5x digital microscopic loupe and interactive coordinate crosshairs mapped over forensic targets.
* **Satellite Radar Lock:** Renders high-resolution satellite imagery using Leaflet and Esri ArcGIS tiles with animated radar sweep vectors and 400m radial accuracy rings.
* **Privacy-First EXIF Scrubber:** Automatically parses and visualizes embedded camera metadata and GPS tags using `ExifReader`, featuring a client-side HTML5 canvas sanitizer that purges EXIF headers to evaluate pure AI visual reasoning.
* **Voice & Text Debate Interrogator:** Enables real-time microphone and text challenges against the AI host's deduced location using browser speech recognition.

---

## 🛠️ Tech Stack & Technologies Used

### Frontend & UI
* **Core Framework:** React 19, TypeScript
* **Build Tooling:** Vite, ESBuild
* **Styling & Design System:** Tailwind CSS v4, Custom Glassmorphism & Cyber-Grid CSS Layer
* **Icons & Visuals:** Lucide React
* **Motion & Animation:** Motion (Framer Motion engine)
* **Mapping Engine:** Leaflet, Esri World Imagery ArcGIS TileServer

### Backend & AI Infrastructure
* **Runtime & Server:** Node.js, Express.js, `tsx`
* **Multimodal AI Engine:** Google GenAI SDK (`@google/genai`) with a fallback chain of `gemini-3.5-flash` → `gemini-3-flash-preview` → `gemini-3.5-flash-lite` → `gemini-3.1-flash-lite` vision models
* **Speech Synthesis (TTS):** Edge Neural TTS (`msedge-tts`), Web Audio API Biquad Filters & Dynamics Compressor
* **Metadata Parsing:** `ExifReader` (EXIF/GPS metadata inspection)
* **Deployment:** Render (Node Web Service)

---

## 📁 System Architecture Overview

```text
geosass-ai/
├── server.ts                  # Express server: Gemini API orchestration & Neural TTS caching
├── src/
│   ├── App.tsx                # Main dashboard & application layout
│   ├── components/
│   │   ├── InteractiveGeoMap.tsx   # Leaflet + Esri satellite radar view
│   │   ├── ImageInspector.tsx      # Target canvas with interactive loupe & clue crosshairs
│   │   ├── AgentDubberBox.tsx      # Voice persona controls & waveform equalizer
│   │   ├── PhotoUploader.tsx       # Drag-and-drop file ingestion & live camera modal
│   │   ├── ExifScrubber.tsx        # EXIF reader & metadata purge engine
│   │   ├── InterrogationBox.tsx    # Live debate & voice recognition interrogator
│   │   └── VoiceSyncedText.tsx     # Word-level teleprompter synchronization
│   ├── lib/
│   │   ├── audioDubber.ts     # Web Audio API audio graph & speech fallback engines
│   │   ├── exifUtils.ts       # HTML5 canvas EXIF stripper & metadata parser
│   │   └── geoPresets.ts      # Offline geographic fallback presets
│   ├── main.tsx               # Client entrypoint
│   └── index.css              # Glassmorphic utilities & animations
├── vite.config.ts             # Vite configuration with Tailwind integration
└── package.json               # Full dependency specification
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+ (or [Bun](https://bun.sh))
* A Google Gemini API key — get one free at [Google AI Studio](https://aistudio.google.com/apikey)
* (Optional) An xAI API key for the top-tier Grok voice in the TTS pipeline

### 1. Install dependencies

```bash
npm install        # or: bun install
```

### 2. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Powers the multimodal geolocation analysis and fallback TTS |
| `XAI_API_KEY` | No | Enables the top-tier xAI Grok voice; without it the pipeline falls back to Edge neural TTS |

### 3. Run it

```bash
npm run dev     # dev server at http://localhost:3000 (tsx + Vite)
npm run build   # production bundle -> dist/
npm start       # serve the production build (node dist/server.cjs)
```

A single Express process serves the Vite frontend and the Gemini/TTS API backend on port `3000`.

**Live demo:** [https://geosass-ai.onrender.com](https://geosass-ai.onrender.com)

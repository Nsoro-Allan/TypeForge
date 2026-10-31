# TypeForge.

**A clean, distraction-free desktop typing test** — built with Tauri, React, TypeScript, and Vite.

TypeForge aims to deliver the focused feel of Monkeytype in a native desktop app. No browser tabs, no accounts required, just you and the keyboard.

![TypeForge](https://raw.githubusercontent.com/Nsoro-Allan/TypeForge./main/public/og.png) <!-- replace when you have one -->

## Features

### Current
- **Time mode** — 15 / 30 / 60 / 120 seconds
- **Words mode** — 10 / 25 / 50 / 100 words
- Real-time WPM & accuracy
- Character-level feedback (correct / incorrect / extra)
- Smooth yellow caret
- Tab to restart
- Dark, minimal UI
- Common English word list

### Coming / Planned (high priority)
- Punctuation & Numbers modes
- Quote mode + Custom text
- Local history & personal bests (already scaffolded)
- Themes
- Sound effects (keyclicks)
- Detailed results screen (consistency, raw WPM, chart)
- Zen / Focus mode
- Settings panel
- Multiple languages
- Keyboard heatmap / weak keys practice

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Frontend    | React 18 + TypeScript   |
| Styling     | Tailwind CSS v4         |
| Build       | Vite                    |
| Desktop     | Tauri 2                 |
| Language    | TypeScript + Rust (Tauri) |

## Getting Started

### Prerequisites
- Node.js 18+
- Rust (for Tauri) — https://rustup.rs
- Platform dependencies for Tauri: https://v2.tauri.app/start/prerequisites/

### Install & Run

```bash
# Clone
git clone https://github.com/Nsoro-Allan/TypeForge..git
cd TypeForge.

# Install frontend deps
npm install

# Run in development (opens native window)
npm run tauri dev

# Or just the web preview
npm run dev
```

### Build

```bash
npm run tauri build
```

This produces a native installer for your platform in `src-tauri/target/release/bundle/`.

## Project Structure

```
src/
├── components/
│   ├── TypingTest.tsx      # Main typing UI + results
│   ├── Results.tsx         # Detailed results (planned)
│   ├── StatsBar.tsx        # Live stats (planned)
│   └── ModeSelector.tsx    # Mode / duration controls (planned)
├── hooks/
│   └── useTypingEngine.ts  # Core typing logic, timer, stats
├── lib/
│   ├── words.ts            # Word lists + generators
│   ├── calculateStats.ts   # Stats helpers (planned)
│   └── storage.ts          # Local history persistence (planned)
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

## Keyboard Shortcuts

| Key          | Action              |
|--------------|---------------------|
| `Tab`        | Restart test        |
| `Esc`        | (planned) Focus mode / settings |
| Typing       | Starts the timer    |

Developed by [Nsoro Allan](https://github.com/Nsoro-Allan)

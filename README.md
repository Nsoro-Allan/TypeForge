<img src="./public/favicon-512.png" width="80" height="80">

# TypeForge.

**A fast, minimal desktop typing test with a built-in arcade typing shooter** — built with Tauri, React, TypeScript, and Vite.

The test is modelled on [Monkeytype](https://monkeytype.com): you just start typing, the interface gets out of your way, and the numbers (WPM, raw, accuracy, consistency) are calculated the same way. The **Arcade** adds *Void Defender*, a [ZType](https://zty.pe)-style game where alien ships descend carrying words and you type them out of the sky.

## Features

### Typing test
- **Modes** — time (15/30/60/120 s), words (10/25/50/100), quote (short/medium/long), zen (free typing, `Shift+Enter` to finish) and **custom text** (paste your own)
- **Options** — punctuation, numbers, and an English or *code* word list
- **Endless word stream** in time mode — it never runs out, however fast you are
- **Three-line scrolling text** with a smooth caret (line / block / underline / outline)
- **Monkeytype-style results** — WPM, raw WPM, keystroke accuracy, consistency, character breakdown (correct/incorrect/extra/missed) and an interactive per-second chart with hover tooltips
- **Personal bests** per mode, flagged on the results screen, plus a full **stats page** (history, progress graph, PB table)
- **Command palette** (`Esc` or `Ctrl/⌘ + K`) — change anything without touching the mouse
- **10 themes**, font size, live stats toggle, **stop on error**, **confidence mode**
- **Key sounds** (click / thock / pop), synthesised with WebAudio so there are no audio files to ship
- Focus mode: the interface fades away while you type and returns when you move the mouse
- Everything is saved locally, nothing leaves your device

### Arcade — Void Defender
- Ships fly down the screen, each labelled with a word. **Type the first letter to lock on**, finish the word to destroy it
- **Waves** that speed up and bring longer words; a **boss** every 5th wave that you destroy by typing a whole phrase
- Three ship types (drones, fast zig-zagging darts, slow armoured tanks), **combo multiplier** up to ×8, and a chargeable **shockwave** (`Enter`) that wipes the screen
- Easy / normal / hard, high scores per difficulty, pause on `Esc` (auto-pauses if the window loses focus)
- Arcade colours follow your chosen theme

## Keyboard

| Key | Action |
|---|---|
| `Tab` | Restart test (new words) |
| `Enter` | Next test (from results) · shockwave (arcade) · launch (arcade menu) |
| `Esc` | Command palette · pause (arcade) |
| `Ctrl/⌘ + K` | Command palette from anywhere |
| `Shift + Enter` | Finish a zen test |
| `Backspace` / `Ctrl + Backspace` | Delete letter / whole word |
| `1` `2` `3` | Pick difficulty on the arcade menu |

Like Monkeytype, `Backspace` only lets you step back into a previous word if you got it wrong.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (theme colours are CSS variables) |
| Game | HTML canvas, no game library |
| Build | Vite |
| Desktop | Tauri 2 |

## Getting Started

### Prerequisites
- Node.js 18+
- Rust (for Tauri) — https://rustup.rs
- Platform dependencies for Tauri: https://v2.tauri.app/start/prerequisites/

### Install & Run

```bash
git clone https://github.com/Nsoro-Allan/TypeForge..git
cd TypeForge.

npm install

# Development (opens the native window)
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
├── App.tsx                    # shell: views, command palette, global shortcuts
├── App.css                    # Tailwind + theme tokens + typing/caret styles
├── components/
│   ├── TypingTest.tsx         # test screen (live stats + words, or results)
│   ├── WordsView.tsx          # 3-line scrolling words, smooth caret
│   ├── LiveStats.tsx          # countdown / progress while typing
│   ├── Results.tsx            # results screen
│   ├── ResultChart.tsx        # SVG wpm/raw/error chart
│   ├── ModeSelector.tsx       # mode / duration / options bar
│   ├── StatsPage.tsx          # history, PBs, progress
│   ├── SettingsModal.tsx  CommandPalette.tsx  CustomTextModal.tsx
│   └── Header.tsx  ui.tsx  icons.tsx
├── hooks/
│   ├── useTypingEngine.ts     # timer, keyboard, word stream, result saving
│   └── useSettings.tsx        # settings context (persisted)
├── lib/
│   ├── engine.ts              # pure typing-test reducer (no timers/DOM)
│   ├── calculateStats.ts      # wpm / raw / accuracy / consistency
│   ├── words.ts  quotes.ts    # word lists, generator, quotes
│   ├── themes.ts  sound.ts  storage.ts
├── game/
│   ├── engine.ts              # Void Defender rules + rendering (no React)
│   └── GameView.tsx           # canvas loop, input, menu/pause/game-over
└── types/index.ts
```

### How the stats work

Net WPM follows Monkeytype's rules: only **fully correct words** (plus the in-progress last word in time mode, if it is correct so far) and their spaces count, so wrong letters can never inflate your score. Raw WPM counts every typed character. Accuracy is **keystroke-based** (correct keypresses ÷ all keypresses, backspace excluded). Consistency is derived from the variation of your raw speed across seconds. Tests shorter than one second are not saved.

Developed by [Nsoro Allan](https://github.com/Nsoro-Allan)

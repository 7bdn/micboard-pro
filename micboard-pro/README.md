# MicBoard Pro 🎤

> Professional Soundboard & Microphone Controller for Windows

A powerful, low-latency soundboard app with full microphone control — built with Electron + React + Web Audio API.

---

## ✨ Features

### 🎵 Soundboard
- **Unlimited sounds** — MP3, WAV, OGG, FLAC, M4A, AAC
- **Drag & drop** audio files directly onto the app
- **Folder import** — bulk import entire folders at once
- **Emoji icons** — click to cycle through fun icons per sound
- **Favorites & Recent** — quick access to your most-used sounds
- **Play multiple sounds simultaneously**
- **Per-sound volume** control
- **Loop mode** for continuous playback

### ⌨️ Hotkeys
- **Global hotkeys** — work even while gaming or in other apps
- **F1–F12** quick-assign or any key combination
- **Ctrl / Alt / Shift** modifier support
- **Stop All** emergency hotkey (default: F8)

### 🎙️ Microphone Control
- **Mic Volume**: 0–200% amplification
- **Mic Boost**: 0–30 dB hardware-style boost
- **Mute/Unmute** with one click
- **Live input meter** with dB display
- **Device switching** — select any connected microphone
- **Noise Gate** — cuts out background noise when not speaking
- **Compressor** — levels out loud/quiet variations
- **Echo Cancellation**
- **Auto Ducking** — automatically lowers sounds when you speak

### 🎛️ Voice Changer
- **Real-time pitch shift** — –12 to +12 semitones
- Presets: **Chipmunk**, **Normal**, **Deep Voice**

### 🎚️ Mixer (EQ)
- 4-band equalizer: Low Cut, 300Hz, 3kHz, High Shelf
- Per-band gain control

### 💾 Profiles
- **Gaming**, **Streaming**, **Discord** presets
- Each profile saves: mic volume, master volume, FX settings

### 📤 Virtual Mic Output
- Routes mixed audio (mic + sounds) to a **virtual microphone**
- Compatible with: **Discord**, **OBS**, **TeamSpeak**, **Zoom**, all games

### 🎙️ Recording
- Record your mic session directly from the app
- Auto-downloads as WebM audio file

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ → https://nodejs.org
- **Windows** 10/11 (64-bit)
- **Git** (optional) → https://git-scm.com

### Install & Run (Development)
```bash
# Clone or download the project
cd micboard-pro

# Install dependencies
npm install

# Start in development mode
npm start
```

### Build the EXE Installer
```bash
# Full build pipeline
node scripts/build.js

# Or manually:
npm run build
```

The installer will be in the `dist/` folder:
- `MicBoard Pro Setup 1.0.0.exe` — full installer
- Install it, then launch from Desktop shortcut

---

## 📁 Project Structure

```
micboard-pro/
├── src/
│   ├── main/
│   │   ├── main.js          ← Electron main process
│   │   └── preload.js       ← Secure IPC bridge
│   ├── audio/
│   │   └── AudioEngine.js   ← Web Audio API engine
│   ├── database/
│   │   └── db.js            ← Data persistence
│   ├── components/
│   │   ├── TitleBar.js
│   │   ├── Sidebar.js
│   │   ├── Soundboard.js    ← Main sound grid
│   │   ├── MicPanel.js      ← Mic + FX controls
│   │   ├── RightPanel.js    ← Quick controls
│   │   ├── StatusBar.js
│   │   ├── HotkeyModal.js
│   │   ├── AddSoundModal.js
│   │   └── SettingsModal.js
│   ├── styles/
│   │   └── global.css       ← Gold/Black theme
│   ├── App.js               ← Root component
│   └── index.js             ← Entry point
├── assets/
│   └── icon.ico             ← App icon
├── scripts/
│   ├── build.js             ← Build pipeline
│   └── create-icon.js       ← Icon generator
└── package.json
```

---

## 🎙️ Virtual Microphone Setup

For MicBoard Pro to route audio to Discord/OBS, you need a **virtual audio cable**:

1. Download **VB-Cable** (free): https://vb-audio.com/Cable/
2. Install it (requires restart)
3. In MicBoard Pro → select your real mic as input
4. In Discord/OBS → select **CABLE Input (VB-Audio)** as microphone
5. MicBoard will route everything through it ✅

---

## ⌨️ Default Hotkeys

| Key | Action |
|-----|--------|
| F8 | Stop all sounds |
| F1–F7 | First 7 sounds (if assigned) |

Customize all hotkeys in the app → click the keyboard icon on any sound card.

---

## 🔧 Troubleshooting

**Mic not detected?**
- Check browser permissions for microphone access
- Click "↻ Refresh" in the device list
- Try running as Administrator

**Sounds not playing?**
- Click the sound card — it loads the audio file on first press
- Check the file still exists at its original path

**Hotkeys not working in games?**
- Run MicBoard Pro as Administrator
- Global hotkeys require elevated permissions in some games

---

## 📝 Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 + Functional Components |
| Desktop Shell | Electron 29 |
| Audio Engine | Web Audio API (WASAPI-backed) |
| Data Storage | electron-store (JSON) |
| Hotkeys | Electron globalShortcut |
| Styling | Custom CSS (Gold/Black theme) |
| Build | electron-builder → NSIS installer |

---

## 🗺️ Roadmap

- [ ] AI Noise Removal (RNNoise integration)
- [ ] Stream Deck integration
- [ ] Web Dashboard (remote control from phone/browser)
- [ ] Sound Packs marketplace
- [ ] Macro system (trigger multiple sounds with one key)
- [ ] Waveform visualizer per sound card
- [ ] Discord Rich Presence

---

Made with ❤️ — MicBoard Pro v1.0.0

# Work Pomodoro 🍅⚡

> A lightweight, cross-platform desktop Pomodoro timer engineered specifically to **break hyperfocus** through persistent looping audio alarms, multi-desktop awareness, automated plain-text session logging, and curated visual analytics. I came up with concept, I would like to give credit to "Pomotroid" for UI, and "Antigravity" (google) for doing the coding... yup vibe coded project hope it helps!

---

<img width="370" height="547" alt="Screenshot 2026-10-21 124300" src="https://github.com/user-attachments/assets/b8fb766a-9cc2-4987-a58d-42c692cc1b6e" />
<img width="367" height="550" alt="Screenshot 2026-10-21 124209" src="https://github.com/user-attachments/assets/7ffc6197-878e-4105-a4ea-545fb0118aba" />
<img width="369" height="548" alt="Screenshot 2026-10-21 124355" src="https://github.com/user-attachments/assets/e316ebc1-1ba6-4216-8d11-2e1c558e3d2f" />
<img width="369" height="551" alt="Screenshot 2026-10-21 124330" src="https://github.com/user-attachments/assets/45a45184-157e-41a8-a89b-5ae7db58fd57" />


## 🚀 Key Features

### 🚨 1. Anti-Hyperfocus Interrupter
- **Universal Multi-Desktop Takeover**: When your focus session concludes, the window unminimizes and demands attention on your active virtual desktop without dragging your workspace across screens.
- **Persistent Audio Loop**: Alarm audio chime loops continuously until you physically acknowledge the break. Single 1-second dings you easily tune out are eliminated.
- **9-Second Shifting Motivation & Wellness Box**: Rectangular tip box with an animated progress bar that automatically shifts every 9 seconds between posture reminders, deep-breathing exercises, hydration prompts, and focus quotes.
- **Auto-Minimize on Start**: Seamlessly auto-minimizes to the background whenever a focus timer is started.
- **Smart Double-Click Reset**: Click the Reset button once to reset the current phase timer; click twice within 2.5 seconds to reset the entire session (back to Cycle 1 of Focus).
- **Strict Snooze Controls**: Strictly limited to 1–2 snoozes (configurable) to prevent runaway procrastination.

---

### 📊 2. Session Tracking, `.txt` Logging & Analytics
- **Predefined & Custom Session Categories**:
  - Predefined tags: `Coding`, `Studying`, `Reading`, `Research`.
  - Add user-defined custom categories (e.g. *Thesis*, *Bugfix*, *Design*, *Writing*) with 1-click tagging.
- **Session Satisfaction Rating**:
  - Rate each session upon completion: 😞 **Bad** *(Distracted)*, 😐 **OK** *(Moderate)*, or 🔥 **Good** *(Super focused flow)*.
- **Human-Readable Plain-Text Log (`.txt`)**:
  - Automatically maintains `work_pomodoro_sessions.txt` in your local app data directory:
    ```text
    ======================================================================
    WORK POMODORO - DAILY FOCUS SESSION LOG
    ======================================================================
    [2026-10-02 20:15:30] Category: Coding | Duration: 25 min | Satisfaction: Good
    [2026-10-02 21:00:12] Category: Research | Duration: 25 min | Satisfaction: OK
    [2026-10-02 21:45:00] Category: Studying | Duration: 25 min | Satisfaction: Good
    ```
  - **1-Click Notepad / Editor Launch**: Click **`.txt Log`** in the dashboard to open the raw file directly in Notepad or your default OS text editor.
  - **In-App Raw Viewer**: View and copy raw log entries directly within the app.
- **Curated Visual Analytics Dashboard**:
  - **Per-Day (Daily)**: 24-hour activity trend chart, focus duration, session count, satisfaction ratios, and category breakdowns with `< Previous / Next >` date navigation.
  - **Per-Week (Weekly)**: 7-day bar chart (Monday to Sunday), total weekly hours, and daily average.
  - **Per-Month (Monthly)**: Monthly focus trend, period totals, and top category distribution.
  - **Per-Year (Yearly)**: 12-month bar chart (Jan–Dec) and annual focus totals.
  - **All-Time (Lifetime)**: Lifetime stats and full searchable history with individual session removal.

---

### 🎨 3. Aesthetics, Dynamic Scaling & Audio Engine
- **📐 Dynamic Scalable Layout with Fixed 2:3 Aspect Ratio**:
  - Drag and stretch any corner or border of the window to enlarge or shrink the app smoothly.
  - Automatically maintains the optimal **2:3 fixed aspect ratio** (360×540 base) on both Windows (via native `WM_SIZING` / `WM_NCHITTEST` hooks) and macOS (via `NSWindow` aspect ratio constraints).
  - All UI elements, SVG timer rings, digital fonts, modal cards, and analytics charts scale proportionally and remain razor-sharp.
- **8 Built-in Color Themes**:
  - Tomato (Classic Dark), Gruvbox, Nord Frost, Synthwave '84, Monokai Pro, Forest Mint, High-Contrast Black & White (Monochrome), and Cyberpunk Gold.
- **Sound Presets & Custom Uploads**:
  - Built-in sound presets (Tubular Bell, Digital Alarm, Singing Bowl, 8-Bit Chime) + support for custom audio file uploads (`.mp3`, `.wav`, `.ogg`).
- **Ultra-Lightweight Footprint**:
  - Native Rust + Tauri v2 architecture consuming only **~35 MB RAM** (vs. ~180–250 MB in Electron apps).

---

## 🖥️ Multi-Virtual Desktop Setup Guide

Work Pomodoro is designed to be accessible across all virtual desktops and spaces so you never miss an alarm, regardless of which workspace you are actively using.

### 🪟 Windows: "Show this window on all desktops" Procedure

Work Pomodoro automatically requests universal virtual desktop pinning on startup via the Windows COM API (`IVirtualDesktopPinnedApplication`). If you wish to manually configure or verify pinning in Windows 10 or Windows 11:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Press  [ Win ] + [ Tab ]  to open Windows Task View     │
│ 2. Right-click the Work Pomodoro window thumbnail           │
│ 3. Select "Show this window on all desktops"               │
└─────────────────────────────────────────────────────────────┘
```

#### Step-by-Step Instructions:
1. **Open Task View**: Press <kbd>Windows Key</kbd> + <kbd>Tab</kbd> on your keyboard (or click the Task View icon next to the Start button on your Taskbar).
2. **Locate Work Pomodoro**: Find the open **Work Pomodoro** window card among your running applications.
3. **Open the Context Menu**: Right-click the window's preview thumbnail or title bar.
4. **Enable Desktop Mirroring**: Click **"Show this window on all desktops"** (or choose *"Show windows from this app on all desktops"*).
5. **Pin to Taskbar (Optional)**: Right-click the Work Pomodoro icon on the Taskbar and select **"Pin to Taskbar"** so you can summon it quickly from any virtual desktop session.

---

### 🍏 macOS: "Assign to All Desktops" Procedure

On macOS, Work Pomodoro sets native `NSWindowCollectionBehaviorCanJoinAllSpaces` and `NSWindowCollectionBehaviorFullScreenAuxiliary` flags. To manually assign the app across all Spaces via the macOS Dock:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Right-click (or Control+click) Work Pomodoro in the Dock │
│ 2. Hover over "Options"                                     │
│ 3. Under "Assign To", select "All Desktops"                 │
└─────────────────────────────────────────────────────────────┘
```

#### Step-by-Step Instructions:
1. **Locate App in Dock**: Find the **Work Pomodoro** icon in your macOS Dock.
2. **Open Options**: Right-click (or hold <kbd>Control</kbd> and click) the icon.
3. **Assign to All Spaces**: Navigate to **Options** → **Assign To** → **All Desktops**.
4. **Third-Party Utilities (Optional)**:
   - **Floaty**: If you use [Floaty](https://www.floatytool.com/posts/pin-any-app-window-always-on-top-macos/), select Work Pomodoro and enable *Apply Pinning*.
   - **Rectangle Pro**: If you use Rectangle Pro, trigger the *Pin Mode* shortcut to ensure floating window parity across custom arrangements.

---

## 📦 Installers & Downloads

### 🪟 Windows Setup & Portable Binary
* **NSIS Installer**: `src-tauri/target/release/bundle/nsis/Work Pomodoro_1.0.0_x64-setup.exe` (1.48 MB)
* **Portable Executable**: `src-tauri/target/release/work-pomodoro.exe`

### 🍏 macOS DMG (.dmg)
Automated cross-compilation is configured via GitHub Actions:
* **Workflow File**: `.github/workflows/release.yml`
* Trigger a release build by pushing a version tag (e.g. `git tag v1.0.0 && git push origin v1.0.0`) or clicking **Run workflow** in GitHub Actions.

---

## 🛠️ Development & Building

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Rust](https://www.rust-lang.org/) stable toolchain (`rustup`)

### Development Server
```bash
# Install dependencies
npm install

# Run frontend + Rust desktop wrapper in dev mode
npm run tauri dev
```

### Build Production Releases Locally
```bash
# Windows NSIS Installer (.exe)
npx tauri build --bundles nsis

# macOS Disk Image (.dmg) (on macOS)
npx tauri build --bundles dmg
```

---

## 📁 Log File Locations

The daily plain-text session log `work_pomodoro_sessions.txt` is stored in the operating system's standard application data directory:

| OS | Default Location |
| :--- | :--- |
| **Windows** | `%APPDATA%\com.workpomodoro.app\work_pomodoro_sessions.txt` |
| **macOS** | `~/Library/Application Support/com.workpomodoro.app/work_pomodoro_sessions.txt` |
| **Linux** | `~/.config/work-pomodoro/work_pomodoro_sessions.txt` |

---

## ⚙️ Tech Stack & Architecture

- **Backend**: [Tauri v2](https://tauri.app/) (Rust) — native tray icon, low-level Win32 / Cocoa window management, file I/O, COM integration.
- **Frontend**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/).
- **Icons**: [Lucide Icons](https://lucide.dev/).
- **Sound Synthesizer**: Web Audio API oscillator synthesis + HTML5 looping audio engine.
- **State Storage**: Reactive stores backed by `localStorage` and Rust file system hooks.

---

## 📄 License
MIT License. Built for high-efficiency deep work.

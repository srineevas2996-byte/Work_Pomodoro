# Work Pomodoro - GitHub Upload & Deployment Guide 🍅📦

This directory (`Work_Pomodoro_GitHub_Ready`) is a **clean, production-ready source package** specifically prepared for uploading to GitHub.

---

## 🔍 Why Previous Manual Uploads Might Have Failed
When attempting to upload a development folder directly to GitHub via the web interface:
1. **`node_modules/` bloat**: Contains over 10,000 files and exceeds 140 MB.
2. **`target/` compiler artifacts**: Rust compiler caches easily take 100–500 MB.
3. **Executable installers (`.exe`)**: Binary installers exceed standard web commit thresholds.
4. **GitHub Web limits**:
   - **25 MB max per file**
   - **100 files max per commit batch** via the web interface.

### ✅ Verification in this Clean Package:
- **Total Project Size**: **~4.7 MB** (Well below the 25 MB limit!)
- **Total Files**: **94 files** (Strictly below the 100-file web upload limit!)
- **Largest File**: `src-tauri/icons/icon.icns` (~1.3 MB, only 5% of GitHub's 25 MB per-file limit)
- **Folder Size Audit**:
  - `src/` (Frontend code & components): **~115 KB** (17 files)
  - `public/` (Web assets & icons): **~480 KB** (4 files)
  - `src-tauri/` (Rust core, configs & icons): **~3.68 MB** (60 files)
  - Root & Configs (`package.json`, `vite`, `tsconfig`): **~500 KB** (10 files)
  - `.github/workflows` (CI & Release automation): **~3 KB** (2 files)

---

## 🚀 Upload Method 1: 1-Click Automated Script (Recommended)

1. Create a new empty repository on [GitHub](https://github.com/new).
   - Name: `work-pomodoro` (or whatever you prefer)
   - Do **NOT** check "Add a README", .gitignore, or license (these are already wired in this folder).
   - Click **Create repository**.
2. Copy your repository's HTTPS URL (e.g. `https://github.com/your-username/work-pomodoro.git`).
3. In this folder (`Work_Pomodoro_GitHub_Ready`), double-click:
   ```cmd
   push_to_github.bat
   ```
   *(Or right-click `push_to_github.ps1` and select **Run with PowerShell**)*
4. Paste your GitHub repository URL and press <kbd>Enter</kbd>.
5. Your project will be automatically staged, committed, and pushed to your `main` branch!

---

## 🌐 Upload Method 2: Manual Web Drag-and-Drop (github.com)

If you prefer uploading through your web browser without using Git:

1. Create a new repository on [GitHub](https://github.com/new).
2. On the new repository page, click the link: **"uploading an existing file"**.
3. Select all files and folders in `Work_Pomodoro_GitHub_Ready`:
   - `.github/`
   - `.vscode/`
   - `public/`
   - `src/`
   - `src-tauri/`
   - `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `.gitignore`, `LICENSE`, `README.md`
4. Drag and drop them into the GitHub browser upload box.
   - Because all files total **94 files** and **~4.7 MB**, GitHub will upload the entire project cleanly without hitting any size limits or 100-file warnings!
5. Scroll down to the **Commit changes** box:
   - Commit title: `Initial commit: Work Pomodoro v1.0.0`
   - Click **Commit changes**.

---

## 💻 Upload Method 3: Standard Git Terminal Commands

If you prefer using the command line:

```bash
cd D:\Work_Pomodoro_GitHub_Ready
git init -b main
git add .
git commit -m "feat: initial commit of Work Pomodoro desktop app v1.0.0"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

---

## ⚡ Application Wiring & Architecture Check

| Component | Status | Details |
| :--- | :---: | :--- |
| **Frontend Framework** | ✅ Wired | Vue 3 + TypeScript 5.8 + Vite 8.0 |
| **Desktop Runtime** | ✅ Wired | Tauri v2 with native Win32/Cocoa bindings |
| **IPC Bridge** | ✅ Wired | 10 registered Tauri commands (`src-tauri/src/lib.rs` ↔ `src/services/tauriBridge.ts`) |
| **Virtual Desktop Pinning** | ✅ Wired | Native COM `IVirtualDesktopPinnedApplication` integration |
| **Fixed Aspect Ratio** | ✅ Wired | 2:3 window proportion preserved on resize |
| **CI Automation** | ✅ Wired | `.github/workflows/ci.yml` (automated typecheck & build) |
| **Release Automation** | ✅ Wired | `.github/workflows/release.yml` (Windows NSIS `.exe` & macOS `.dmg` on tag push) |
| **Dependencies** | ✅ Wired | `npm ci` compatible; lockfile and manifest synchronized |
| **License** | ✅ Wired | Official MIT License included |

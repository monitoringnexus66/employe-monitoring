# Agent Handover Document

**To the next AI Agent or Developer taking over this project:**

Welcome to the **NexusTrack** (Employee Monitoring) project! This document outlines exactly where I left off and what your immediate priorities should be. Please read `PROJECT_STATE.md` for a full breakdown of the tech stack and architecture.

## Where I Left Off
1. **Identified the macOS Tab Tracking Bug:** I diagnosed why the web dashboard is showing "Google Chrome" instead of the exact website/tab name. macOS prevents the Tauri Rust backend (`x-win` crate) from reading window titles unless the app is granted "Accessibility" permissions in System Settings. 
2. **Drafted an Implementation Plan:** I created an implementation plan in the artifacts directory to build a "Permissions Wizard" for the desktop agent. The user wants the app to automatically detect missing permissions and show a UI wizard to guide them on the first launch.
3. **Drafted a Settings Plan:** The user requested a new `/dashboard/settings` page to allow tenant-wide screenshot intervals and a Light Mode / Dark Mode toggle. This implementation plan is also currently pending execution.

## Your Immediate Tasks
Depending on what the user asks you to execute next, here are your priorities:

### Task 1: Build the Desktop Permissions Wizard
The user wants a wizard on startup. You need to:
* Add `macos-accessibility-client` to `agent/src-tauri/Cargo.toml`.
* Write Rust commands in `agent/src-tauri/src/lib.rs` to check and request macOS Accessibility and Screen Recording permissions.
* Build `agent/src/PermissionsWizard.tsx` (a React modal that blocks the main app flow until permissions are green).
* Update `agent/src/App.tsx` to mount the wizard if permissions are missing.

### Task 2: Build the Settings Page & Light Mode
If the user asks you to proceed with the Web Dashboard settings:
* Add `defaultScreenshotInterval` to the `Tenant` model in `web/prisma/schema.prisma` and run `npx prisma db push`.
* Create `web/src/app/dashboard/settings/page.tsx` and the corresponding backend API.
* Implement the Light/Dark mode toggle by migrating hardcoded Tailwind classes (`text-white`, `bg-[#1c1f26]`) to CSS variables in `web/src/app/globals.css`.

## Important Rules & Context
* **Github Actions:** The project uses GitHub Actions (`.github/workflows/tauri-build.yml`) to automatically compile the Windows `.exe` and macOS `.dmg` whenever code is pushed to `main`. 
* **Vercel:** The web dashboard (`web` directory) is linked to Vercel and auto-deploys on push.
* **Mac App Builds:** If you need to test the Mac app locally without waiting for GitHub Actions, run `npm run tauri build` inside the `agent` directory.
* **Aesthetics:** The user is VERY particular about UI design. Always use glassmorphism (`glass-card`), smooth transitions, and premium aesthetics. Do not output plain or boring UIs.

Good luck!

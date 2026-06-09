# Project State: Employee Monitoring App (NexusTrack)

## Overview
NexusTrack is a full-stack employee monitoring solution consisting of a cloud-based dashboard and a native desktop agent. It tracks active application usage, window titles, and periodic screenshots, uploading them to a centralized dashboard for managers. The system is multi-tenant, supporting `SUPERADMIN` (platform owners), `ADMIN` (company managers), and `EMPLOYEE` roles.

## Tech Stack
### Cloud Dashboard (`/web`)
* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS v4 (Glassmorphism & Dark Mode)
* **Database:** PostgreSQL (via Prisma ORM)
* **Storage:** AWS S3 (for storing Base64 image payloads as JPEGs)
* **Deployment:** Vercel (Live at: `https://employe-monitoring.vercel.app`)

### Desktop Agent (`/agent`)
* **Framework:** Tauri v2
* **Backend:** Rust (`x-win` for active window tracking, `xcap` for screen capture, `image` for compression)
* **Frontend:** React (Vite + TypeScript) + Tailwind CSS
* **Build System:** GitHub Actions (Compiles macOS `.dmg` and Windows `.exe` installers)

## Core Capabilities
* **Active Window Tracking:** Rust agent polls the OS every 5 seconds for the active application name and window title.
* **Screenshot Capturing:** Agent captures screen, compresses it, and sends Base64 over HTTP to the Next.js API.
* **Dynamic Configuration:** Agent listens to API responses to dynamically update its screenshot interval (e.g., Every 1 min, 5 min, Disabled) based on database settings.
* **Web Dashboard:** Provides live activity feeds, screenshot galleries, and productivity analytics (pie charts calculating total app usage time).

## Current Status & Recent Fixes
* **Next.js Migration:** Successfully migrated the web dashboard from a standard React SPA to Next.js App Router to fix Vercel routing issues.
* **Vercel Payload Limits:** Fixed the `413 Payload Too Large` error by compressing screenshots natively in Rust before transmission.
* **Real-time Configuration:** Fixed a bug where the desktop agent required a restart to apply new capture settings. It now updates on the fly.

## Known Issues & Limitations
1. **macOS Permissions:** The agent requires Accessibility and Screen Recording permissions on macOS to function correctly (without Accessibility, window titles are blocked). There is currently no UI prompting the user to grant these on launch.
2. **Missing Settings Page:** The `/dashboard/settings` route in the web app currently returns a 404. It needs to be built to support tenant-wide default configurations and Light/Dark mode toggling.
3. **Mac App Signing:** The macOS `.dmg` built by GitHub Actions is unsigned, causing macOS Gatekeeper to flag it as "damaged" due to the quarantine attribute. Users must run `xattr -cr` manually.

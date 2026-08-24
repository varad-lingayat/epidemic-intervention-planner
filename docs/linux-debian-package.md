# EpiGraph Debian Desktop Package

## Purpose

The Debian package delivers the same Electron desktop application used by the optimized Windows portable build. It contains the local server runtime, client application, bundled Demonstration Mode fixtures, and local scenario persistence. It is intended for **64-bit Debian and Ubuntu-family systems** with a supported desktop session.

## Build command

From the repository root, run:

```bash
pnpm desktop:deb
```

The resulting file is written to:

```text
release/EpiGraph-Epidemic-Intervention-Planner-1.0.0-linux-amd64.deb
```

The validated x64 artifact is **89 MB** and has SHA-256:

```text
f4fcb76ca1f00c820a083eadbdf4b171a4d5791852be0d5fef78b4ccd4840b28
```

Generated `.deb`, `.exe`, `release/`, `dist/`, and `desktop-runtime/` directories are intentionally ignored by Git. The repository commits the configuration and source necessary to reproduce them.

## Installation

Copy the `.deb` file to the Debian or Ubuntu computer, then install it with:

```bash
sudo apt install ./EpiGraph-Epidemic-Intervention-Planner-1.0.0-linux-amd64.deb
```

If a local package dependency must be repaired, run:

```bash
sudo apt --fix-broken install
```

After installation, launch **EpiGraph Epidemic Intervention Planner** from the applications menu. The application stores local desktop scenarios in the operating system’s standard user-data location. No database server, Node.js installation, or development toolchain is required by the end user.

## Offline and online boundaries

| Capability | Debian package behavior |
|---|---|
| Synthetic city, five-strategy comparison, 2D/3D explorer, manual actions, sensitivity, CSV/PDF | Available locally |
| Curated Demonstration Mode | Available offline from bundled graph fixtures |
| Saved scenarios and reports | Stored locally on the computer |
| OpenStreetMap import | Requires internet access to public map services |
| Hosted LLM explanation and public cloud share links | Require their corresponding online services and are not guaranteed in desktop mode |

## Packaging note

The desktop launcher is shared by the Windows and Debian builds. It starts an isolated HTTP service bound to `127.0.0.1`, then opens an Electron window. The production package excludes development-only Vite tooling, while the client bundles the verified offline road fixtures needed by the demonstrations.

### Linux virtual-machine graphics compatibility

The Debian launcher explicitly selects Chromium's Linux software-WebGL path before Electron is ready. This is intended for virtual-machine graphics environments that expose an incomplete GPU stack. If a usable WebGL context is still unavailable or becomes lost, the 3D workspace automatically renders the full interactive 2D graph instead of a blank canvas. The fallback retains node states, road closures, initial-infection selection, pan/zoom, and manual-intervention context, and offers a **Retry 3D graphics** control.

Package inspection confirms Debian metadata for `amd64`, the desktop launcher entry, the Linux software-WebGL switch, the automatic blank-canvas fallback, the bundled `random-chance-alignment` demonstration fixture, the 869-byte production HTML entry, and no Vite development plugin references in the runtime payload.

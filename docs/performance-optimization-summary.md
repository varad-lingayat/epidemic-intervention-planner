# Desktop Performance Optimization Summary

## Reported issue

The portable Windows application was reported to take roughly 30 seconds to open and to feel stiff during workspace changes. The remediation focused on the critical path from launching the self-contained executable to reaching the initial Configure workspace, while preserving the deterministic comparison and offline Demonstration Mode contracts.

## Changes applied

| Bottleneck | Change | Expected effect |
|---|---|---|
| Portable archive extraction | Switched the Windows portable archive to `store` compression and enabled ZIP extraction. | Favors faster startup over a smaller download. |
| Invisible desktop startup | The Electron process now creates a branded local loading window before starting the local service. | Provides immediate visual feedback while the runtime initializes. |
| Repeated initial simulation work | The deterministic standard teaching graph and five-strategy comparison are built once per process and reused for startup and Reset. | Avoids repeated full comparison generation. |
| Eager heavy client imports | 3D, chart, sensitivity, and report-preview workspaces are loaded only when opened. | Keeps Three.js, Recharts, and report code off the critical initial path. |
| Sensitivity tab freeze | The seven analysis points are computed one at a time with event-loop yields. | The tab becomes responsive immediately and reports incremental progress. |
| 3D rendering cost | Reduced star count, device pixel ratio, and shadow-map resolution while retaining the miniature-city presentation. | Improves 3D interaction on typical laptops. |
| Production HTML overhead | Removed development-only runtime/debug injection and the external analytics script from the production entry. | Shrinks `index.html` from 368,232 bytes to 869 bytes and eliminates startup network dependency. |

## Validation evidence

The production build now separates the 3D renderer into a deferred approximately 1.06 MB module, the chart implementation into a deferred approximately 407 kB module, and report/sensitivity features into smaller deferred modules. The production HTML entry was measured at 869 bytes after removing the development and analytics injections. TypeScript passes, and the complete test suite passes with 65 passing tests across 24 test files and one intentional opt-in live-map test skipped. The default desktop dashboard was visually rechecked after the configuration change and rendered normally.

The rebuilt Windows x64 portable artifact is intentionally larger at **335 MB** because it prioritizes fast ZIP extraction rather than maximum compression. Its SHA-256 is `b476ef8c62e3e1886600556c1b0ad019f5145f756461db3044dc132c2ec9ccaf`. Package inspection confirmed the 869-byte production entry, the `random-chance-alignment` offline demonstration fixture preset, the splash-window source, and the absence of Vite development-plugin references from the packaged runtime.

## Scope boundary

Startup time still depends on the user’s Windows storage speed, Microsoft security scanning, and available graphics support. The new build is optimized to avoid avoidable application work and to show an immediate loading screen, but an end-user Windows-device smoke test remains the final confirmation of observed cold-start time.

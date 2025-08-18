<!-- src/scripts/utils/debug_enable-zoom.js/files/change-log.md -->

# enable-zoom Change Log

## Description

This `src/scripts/utils/debug_enable-zoom.js/files/` folder holds named backup versions of the project's `src/scripts/utils/enable-zoom.js` file as it iterates through the development process.

The [Versions](#versions) section (below) lists each version, and:

1. Provides a brief description of:
   1. the purpose of the new version (e.g. the issue it is intended to resolve), and
   2. the changes made
2. Includes a "DevNotes:" section for additional comments, analysis, etc., if required.

## Versions:

### File name: enable-zoom-v1.0.0.js

#### Purpose or Issue(s) Addressed:

Establish an initial zoom utility for the Vivaldi Bookmarks page providing user-adjustable scaling for the `.VivaldiList` element to improve readability for the target client.

#### Changes Made:

- Added basic zoom initialization using a provided `initialZoom` (default 2.0 in calling context).
- Implemented three UI buttons (Zoom Out, Reset (dynamic label), Zoom In) injected into the last `.toolbar-group` of the bookmarks manager.
- Added keyboard shortcuts: Ctrl/Cmd `+`, `-`, `0` to zoom in, zoom out, or reset.
- Added mouse wheel + Ctrl/Cmd gesture support for incremental zooming.
- Enforced zoom bounds (0.5–3.0) directly in event handlers (hard‑coded constants inside logic blocks).
- Added `updateZoom()` helper to keep the reset button label (`🔍{currentZoom}x`) synchronized.
- Applied CSS `zoom` and `transform-origin: top left` to the `.VivaldiList` container.
- Logged a final success message to the console confirming initial zoom enablement.

#### DevNotes:

Baseline functional version. No structured constant section yet; min/max and step values (0.5, 3.0, 0.1 increments) appear inline. No drag/auto-scroll instrumentation or fallback behavior. Public surface: a single exported `enableZoom` function (ES module style).

### File name: enable-zoom-v1.0.1.js

#### Purpose or Issue(s) Addressed:

Enhance the zoom utility with diagnostic instrumentation, configurable options, stricter clamping, and assisted drag auto-scrolling for improved large-scale usability at high zoom levels. Provide richer logging to troubleshoot edge behaviors (e.g., drag near list boundaries).

#### Changes Made:

- Introduced clearly defined CRITICAL constants at top:
  - DEFAULT_INITIAL_ZOOM = 2.0
  - MIN_ZOOM = 0.5
  - MAX_ZOOM = 3.0
  - ZOOM_STEP = 0.1
  - AUTO_SCROLL_EDGE_PX_BASE = 60
  - AUTO_SCROLL_SPEED_BASE = 32
- Added `options` parameter with `enableFallbackAutoScroll` (default `true`) and `fallbackActivationDelayMs` (default `400` ms).
- Implemented structured `clamp()` utility replacing repeated Math logic.
- Refactored UI button creation via `mkBtn()` helper; maintained same button labels (`🔍−`, dynamic reset `🔍{x.x}x`, `🔍+`).
- Added `applyZoom()` function centralizing zoom + reset button label updates + debug logging.
- Added dataset flag `data-zoom-enabled="true"` and initial zoom validation block comparing applied style vs expected numeric string.
- Introduced enhanced logging framework with optional grouped (`console.groupCollapsed`) diagnostic blocks when `debug` is true.
- Implemented keyboard zoom handling using new constants & clamping (supports `+`, `-`, `0`).
- Implemented mouse wheel + modifier zoom with clamped bounds.
- Added comprehensive drag diagnostics:
  - Detection of native auto-scroll (`detectNativeAutoScroll()`).
  - Conditional fallback activation (`maybeActivateFallback()`) after delay if native scroll not observed.
  - Fallback manual auto-scroll loop (`startManualAutoScrollLoop()`) using `requestAnimationFrame` with dynamic per-frame speed (`SCROLL_SPEED_PX_PER_FRAME()`).
  - Edge proximity detection scaled inversely with zoom (`EDGE_DYNAMIC()`).
  - Throttled drag telemetry logging (`logDragMetrics()`), plus periodic heartbeat logging when active.
- Added final structured success log: `[enable zoom] ✅ Zoom v2 enabled (initial=... applied=...)`.
- Ensured zoom boundaries & step transitions are uniformly enforced via constants instead of duplicated literals.
- Added internal state flags: `dragActive`, `nativeAutoScrollObserved`, `fallbackAutoScrollEnabled`, `manualScrollRAF`, etc., for clearer lifecycle control.

#### DevNotes:

Represents a “v2” diagnostic evolution while file name keeps semantic versioning (v1.0.1). Public API surface still the same exported `enableZoom` function signature (now with optional `options` param) to preserve compatibility. Fallback auto-scroll only engages during bookmark item drags when native behavior is absent—critical for high zoom accessibility. All CRITICAL constant values exactly match the code references: 2.0, 0.5, 3.0, 0.1, 60, 32. Added robust internal validation & grouped logging for maintainability. No changes to external selector logic aside from added dataset marker and logging refinements.

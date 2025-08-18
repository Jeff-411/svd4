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

### File name: [enable-zoom-v1.js](enable-zoom-v1.js)

#### Purpose or Issue(s) Addressed:

Initial baseline implementation to provide user zoom controls for the `.VivaldiList` on internal pages (e.g. Bookmarks page), including:

- Basic UI (Out / Reset / In buttons)
- Keyboard shortcuts (Ctrl/Cmd + '+', '-', '0')
- Mouse wheel zoom with Ctrl/Cmd modifier
- Minimum / maximum zoom boundary enforcement (implicit via Math.min/Math.max)

#### Changes Made:

- Added direct inline style zoom management using `element.style.setProperty('zoom', value)`
- Added toolbar buttons with dynamic reset button label showing current zoom (formatted to 1 decimal)
- Implemented keyboard zoom handlers:
  - Ctrl/Cmd + '+' → increment (capped at 3.0)
  - Ctrl/Cmd + '-' → decrement (floored at 0.5)
  - Ctrl/Cmd + '0' → reset to initial zoom (default 2.0)
- Implemented mouse wheel + Ctrl/Cmd zoom (±0.1 step; same 0.5–3.0 bounds)
- Provided optional debug log on initialization
- Chose in‑memory variable `currentZoom` (no persistence) for immediate responsiveness

#### DevNotes:

- No abstraction for constants; numeric literals embedded directly (potential future refactor target—addressed in v2).
- No drag/auto‑scroll instrumentation.
- Serves as a stable reference snapshot for regression comparison with later diagnostic versions.
- Bounds (0.5–3.0) and step (0.1) implicitly repeated; later centralized in v2.

---

### File name: [enable-zoom-v2.js](enable-zoom-v2.js)

#### Purpose or Issue(s) Addressed:

Enhance v1 by adding:

1. Centralized constants (critical values) for maintainability and auditability.
2. Clamp utility for consistent boundary enforcement.
3. Rich diagnostic / debug instrumentation (grouped console logs).
4. Drag operation auto-scroll diagnostics with optional fallback manual auto-scroll when native behavior not detected.
5. More resilient state handling and validation of applied zoom style.
6. Configurable fallback activation timing & feature toggle via `options` parameter.

#### Changes Made:

- Introduced CRITICAL constant declarations (exact values verified against source):
  - DEFAULT_INITIAL_ZOOM = 2.0 (matches v1 default; unchanged)
  - MIN_ZOOM = 0.5 (same as v1 lower bound; unchanged)
  - MAX_ZOOM = 3.0 (same as v1 upper bound; unchanged)
  - ZOOM_STEP = 0.1 (same as v1 increment; unchanged)
  - AUTO_SCROLL_EDGE_PX_BASE = 60 (new diagnostic constant)
  - AUTO_SCROLL_SPEED_BASE = 32 (new diagnostic constant; pixels/sec baseline)
- Added `clamp()` utility replacing repeated Math.min/Math.max patterns.
- Added structured logging helpers (`log`, `group`) gated by `debug` flag.
- Added enhanced zoom application routine (`applyZoom`) updating reset button label and emitting diagnostic output.
- Added dataset flag `data-zoom-enabled="true"` for potential CSS / test hooks.
- Added drag monitoring state: `dragActive`, `nativeAutoScrollObserved`, `fallbackAutoScrollEnabled`, `manualScrollRAF`, timing & scroll tracking variables.
- Implemented detection of native auto-scroll during drag (`detectNativeAutoScroll` with animation frame loop).
- Implemented fallback auto-scroll activation logic after configurable delay (`fallbackActivationDelayMs`, default 400ms) if native auto-scroll not observed.
- Implemented manual auto-scroll loop (requestAnimationFrame) with dynamic speed scaling (`SCROLL_SPEED_PX_PER_FRAME()`).
- Added dynamic edge threshold scaling by current zoom (`EDGE_DYNAMIC()`).
- Added periodic heartbeat logging (every 1000ms) when in debug mode & drag active.
- Added comprehensive drag lifecycle event handling (`dragstart`, `dragover`, `dragend`) including metrics logging (`logDragMetrics` throttled).
- Added final validation block to confirm zoom style applied exactly—logs mismatch if any.
- Added options parameter with feature toggle: `{ enableFallbackAutoScroll = true, fallbackActivationDelayMs = 400 }`.
- Standardized console messages prefix `[enable zoom:v2]` when debug; retained generic message when not in debug mode.
- Ensured button wiring uses centralized clamp-based enforcement for consistency with keyboard and wheel handlers.

#### DevNotes:

- All CRITICAL values match source exactly; no modifications introduced.
- Behavior parity for core zoom interactions with v1 (user-perceived) except additional diagnostics.
- Fallback auto-scroll only engages when native auto-scroll not detected—designed to avoid double-scrolling.
- Scaling edge threshold inversely with zoom maintains consistent physical (perceived) activation zone.
- Potential future extraction: drag diagnostic subsystem into a separate utility if reused elsewhere.
- Validation step helps catch stylesheet overrides or DOM mutations that might strip inline zoom.
- Consider adding persistence (localStorage) only after confirming no adverse UX for target user.
- Keyboard handling now early-returns if no Ctrl/Cmd modifier to reduce branch nesting.

---

### File name: [enable-zoom.js](../../enable-zoom.js)

#### Purpose or Issue(s) Addressed:

Primary production version currently in active use (parallel to diagnostic variants). Serves as streamlined, non-instrumented implementation derived from v1 pattern (without extended drag diagnostics of v2).

#### Changes Made (relative to v1 baseline):

- Mirrors v1 functional feature set (buttons, keyboard shortcuts, wheel zoom).
- Encapsulates button label update logic in `updateZoom()` helper (same conceptual role as `applyZoom` in v2 but simplified).
- Retains identical zoom bounds (0.5–3.0), step size (0.1), and default initial zoom (2.0).

#### DevNotes:

- Does not yet integrate centralized constants or clamp utility (opportunity to adopt selected non-diagnostic improvements from v2 without heavy logging).
- Adoption path: extract constants & clamp from v2 while omitting drag instrumentation for minimal footprint.

---

## Validation Steps

1. Diff Verification:
   - Confirm constants in [enable-zoom-v2.js](enable-zoom-v2.js) exactly match listed CRITICAL values.
   - Verify no unintended edits to header comments in this change-log file.
2. Functional Parity:
   - Test zoom in/out/reset (buttons, keyboard, wheel) across v1, v2, and current production [enable-zoom.js](../../enable-zoom.js).
3. Drag Diagnostics (v2 only):
   - Initiate drag near list edges at varied zoom levels; observe console for fallback activation only when native auto-scroll absent.
4. Integrity:
   - Search repo for occurrences of CRITICAL values to ensure no silent divergence if refactoring begins.

## Assumptions

- Only two archived diagnostic versions exist: v1 and v2.
- No intermediate (v1.x) or post‑v2 versions present at time of update.
- Production `enable-zoom.js` reflects streamlined v1 lineage.

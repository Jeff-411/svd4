<!-- idempotency.md -->

What is "idempotency"?

Idempotency means an operation can be performed multiple times with the same externally visible effect as performing it once (no duplicate side‑effects).

In the comment inside `init-bookmarks-page.js`, it notes that re‑running `initBookmarksPage` (and its internal handleAll) should not:

- Add duplicate event listeners
- Inject duplicate UI (e.g., extra zoom button sets)
- Reinitialize state in a way that breaks existing handlers

Practically: each handler should check for existing artifacts (buttons, flags, observers) before creating new ones, so calling initialization again after navigation/hash/visibility changes is safe.

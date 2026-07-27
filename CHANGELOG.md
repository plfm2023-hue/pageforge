# Changelog

## 0.1.0 (2026-07-27)

Initial open-source productization of the `html-to-figma` core.

- **Added** `chrome-extension/` — a Chrome MV3 extension that captures the current
  page (or a selected element) and POSTs serialized HTML to the bridge's
  `/mcp-trigger` endpoint. This completes the "web page → Figma" loop that the
  upstream project relied on external AI clients to start.
- **Added** CORS headers on the SSE server's `mcp-trigger` endpoint so browser and
  extension clients can POST cross-origin.
- **Added** full product docs: `README.md`, `CONTRIBUTING.md`, `NOTICE.md`,
  `docs/DEPLOY.md`, `docs/CHROME_EXTENSION.md`, `docs/STORE_LISTING.md`, and
  `.github/` templates.
- **Renamed** user-facing product to "PageForge" (package, Figma plugin manifest,
  extension) to avoid trademark collision with any commercial product.
- **Preserved** the original MIT license and copyright (Florencia Rosenfeld).

> Derives from `html-to-figma` (Floristeady), MIT. See `NOTICE.md`.

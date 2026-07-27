# Contributing to PageForge

Thanks for wanting to improve PageForge! This project is a friendly fork/derivative
of `html-to-figma`, so we keep the same permissive, low-friction spirit.

## Getting set up

```bash
npm install
npm run build      # Figma plugin: src/code.ts -> code.js
node sse-server.js # bridge server on :3003
```

Load the Figma plugin from `manifest.json` (Figma → Plugins → Development → Import
plugin from manifest) and the Chrome extension from `chrome-extension/` (unpacked).

## How the pieces fit

- `src/` — Figma plugin logic + the HTML/CSS → Figma IR parser.
- `mcp-server.js` / `sse-server.js` — the bridge between capture clients and Figma.
- `chrome-extension/` — browser capture; `content.js` is the DOM serializer.

## Guidelines

- **Small, focused PRs.** One change per PR; include a short "why".
- **Keep the MIT license.** Any file you add should carry the MIT header; preserve
  the existing `LICENSE` and `NOTICE`.
- **Capture fidelity** improvements (more CSS properties, better layout fidelity)
  are the highest-value contributions — that's the hardest part.
- **Don't break the pipeline.** If you touch `sse-server.js` or `mcp-server.js`,
  verify the extension can still POST to `/mcp-trigger` and the plugin still renders.
- Run `npm run build` before opening a PR. (`npm run typecheck` may show known
  upstream typings notes — see README — that's fine.)

## Reporting issues

Use the bug-report template and include: the source URL or a minimal HTML snippet,
the expected vs. actual Figma result, and which component (extension / server / plugin)
was involved.

## Code of conduct

Be respectful and constructive. We follow the standard
[Contributor Covenant](https://www.contributor-covenant.org/) in spirit.

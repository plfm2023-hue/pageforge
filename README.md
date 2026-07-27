# PageForge

> Turn any web page into an editable Figma design — capture from your browser, render in Figma, drive it with AI.

**PageForge** is an open-source toolkit that converts HTML/CSS into editable Figma nodes. It ships as three cooperating pieces:

1. **Chrome extension** (`chrome-extension/`) — click to capture the current page (or a selected element) and ship its HTML to your PageForge server.
2. **Figma plugin** (`manifest.json` + `code.js` + `ui.html`) — connects to the server and renders incoming HTML as real, editable Figma layers (95+ CSS properties supported).
3. **MCP / SSE bridge** (`mcp-server.js` + `sse-server.js`) — a small server that routes HTML from the extension (or any AI client) to the right Figma session. Also exposes an MCP tool so Claude Code / Cursor can send HTML straight to Figma.

```
┌──────────────┐   capture    ┌───────────────────────┐   SSE    ┌─────────────────┐
│ Chrome Ext   │ ───────────▶ │  PageForge Server      │ ───────▶ │  Figma Plugin  │
│ (web page)   │   POST html  │  (SSE + MCP bridge)    │          │  (draws nodes) │
└──────────────┘             └───────────────────────┘          └─────────────────┘
        ▲                         ▲                                     │
        │                         │ MCP tool                           │ HTML → layers
   AI clients (Claude/Cursor) ────┘                                     ▼
                                                            Editable Figma design
```

> 📌 **Name & trademark note.** "PageForge" is a neutral working name chosen to avoid clashing with any existing commercial product (e.g. CoDesign / DesignGenie). Rename freely — search-and-replace `PageForge` / `pageforge` across the repo.

---

## 💖 Sponsor / 打赏

If PageForge saves you time, consider supporting its development — every tip helps keep it open-source and ad-free. Thank you! 🙏

- **GitHub Sponsors** — once approved, a `Sponsor` button appears automatically on this repo (wired via [`.github/FUNDING.yml`](.github/FUNDING.yml)).
- **PayPal** — replace the placeholder in `FUNDING.yml` with your `paypal.me` link:
  - PayPal: `https://paypal.me/your-paypal`

Scan to tip (placeholder QR — point it at your PayPal link once set):

![Sponsor QR](assets/sponsor-qr.png)

> Maintainers: set your `paypal.me` handle in `.github/FUNDING.yml` and regenerate the QR:
> `python -c "import segno; segno.make('https://paypal.me/你的名').save('assets/sponsor-qr.png', scale=8, border=4)"`

---

## Features

- **One-click page capture** — the Chrome extension serializes the live DOM with inlined computed styles.
- **High-fidelity import** — Flexbox, Grid, gradients, shadows, transforms, positioning, and more.
- **AI-native** — an MCP server lets Claude Code / Cursor / Claude Desktop send HTML to Figma with a single prompt.
- **Self-hostable** — run the bridge on your own infra (Render, Railway, Fly, a VM…). No vendor lock-in.
- **MIT licensed** — fork it, ship it, sell it.

---

## Quick start (5 minutes)

### 1. Install the Figma plugin (development)

```bash
npm install
npm run build          # compiles src/code.ts -> code.js
```

Then in Figma: **Plugins → Development → Import plugin from manifest**, and select `manifest.json` in this repo.

### 2. Start the bridge server (local)

```bash
node sse-server.js     # SSE + trigger endpoint on http://localhost:3003
# (optional) node mcp-server.js   # if you want the stdio MCP server for AI clients
```

Open the plugin in Figma, enable **MCP**, and copy the **Session ID** it shows.

### 3. Configure the Chrome extension

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `chrome-extension/`.
2. Click the PageForge icon, fill in:
   - **Server URL**: `http://localhost:3003`
   - **API Key**: `dev-key`
   - **Session ID**: the one from the Figma plugin
3. Open any web page, click **Capture & Send to Figma** → the design appears in your Figma file.

> The Chrome extension needs `<all_urls>` host permission so it can POST to your bridge cross-origin.

---

## Using it with AI (MCP)

Add to `~/.claude/mcp.json` (Claude Code) or your client's MCP config:

```json
{
  "mcpServers": {
    "pageforge": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "env": {
        "FIGMA_SERVER_URL": "http://localhost:3003",
        "API_KEY": "dev-key",
        "FIGMA_SESSION_ID": "YOUR_SESSION_ID"
      }
    }
  }
}
```

Then in Claude Code: *"Send this HTML to Figma: `<div style='padding:40px;background:#5b5ef4;'><h1 style='color:white'>Hello</h1></div>`"*

See [`docs/DEPLOY.md`](./docs/DEPLOY.md) for production deployment and [`docs/CHROME_EXTENSION.md`](./docs/CHROME_EXTENSION.md) for the extension details.

---

## Project layout

```
pageforge/
├── manifest.json            # Figma plugin manifest
├── code.js / ui.html        # Built Figma plugin (npm run build regenerates code.js)
├── src/                     # Figma plugin TypeScript source + HTML/CSS parser
├── mcp-server.js            # Stdio MCP server for AI clients
├── sse-server.js            # SSE + HTTP trigger bridge to Figma
├── start-servers.js         # Convenience: run both
├── config/                  # Shared server config
├── chrome-extension/        # 🆕 Browser capture extension (the missing "web page" piece)
│   ├── manifest.json
│   ├── content.js           # DOM → HTML serializer (inlined computed styles)
│   ├── popup.html / popup.js
├── docs/                    # Deployment, store listing, extension guide
└── .github/                 # Issue / PR templates
```

---

## License & attribution

PageForge is a derivative of **[html-to-figma](https://github.com/Floristeady/html-to-figma)** by Florencia Rosenfeld, used under the **MIT License**.

- The original MIT License and copyright notice are preserved in [`LICENSE`](./LICENSE).
- Derivative-work attribution is recorded in [`NOTICE.md`](./NOTICE.md).

This project is not affiliated with, nor endorsed by, any commercial "HTML → design" product or Figma, Inc. "Figma" is a trademark of Figma, Inc.

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Bugs, capture-fidelity improvements, and new AI-client adapters are all welcome.

---

**Status:** v0.1.0 — core pipeline (extension → bridge → plugin → Figma) working; type-check has known upstream-compat notes (see below).

> ⚠️ **`npm run typecheck` note:** the Figma plugin source references a few APIs (`gridColumnCount`, blur effects) that changed in the latest `@figma/plugin-typings`. These are pre-existing in the upstream code and do **not** affect the esbuild build or runtime — `npm run build` is the authoritative build. Pin `@figma/plugin-typings` to an older version if you want a clean `tsc` run.

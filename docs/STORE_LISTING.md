# Store listing copy

Ready-to-use copy for publishing PageForge to the Chrome Web Store and the Figma
Community. Replace `<your-server>` and `<org>` placeholders before submitting.

---

## Chrome Web Store

**Name:** PageForge Capture
**Category:** Developer Tools
**Language:** English (and Chinese if you localize)

**Summary (≤132 chars):**
> Capture any web page as HTML and send it straight to Figma with one click.

**Detailed description:**
```
PageForge Capture turns the websites you browse into editable Figma designs.

How it works:
1. Open any web page.
2. Click the PageForge icon and press "Capture & Send to Figma".
3. The page appears as real, editable layers in your Figma file — layout, spacing,
   colors, typography, all preserved.

It pairs with the open-source PageForge Figma plugin and a small self-hosted bridge
server, so your data flows between your browser and your own Figma — no third-party
screenshot service, no account required.

Use it for:
• Reverse-engineering a competitor or inspiration page into a design file
• Recovering a lost design by rebuilding it from the live site
• Quickly prototyping with real-world layouts

PageForge is MIT-licensed and open source. You bring your own bridge server
(<your-server>), or deploy the included one in minutes.
```

**Privacy / permissions justification (for review):**
- *Read and change all your data on the websites you visit* — needed to read the
  page DOM and serialize it for capture (only on your explicit click).
- *Storage* — to remember your server URL, API key, and Session ID.
- We do **not** collect, transmit, or sell any browsing data. The extension only
  sends the page HTML you choose to your own configured server URL.

**Required assets:** 128×128 icon, at least one 1280×800 screenshot of the popup
capturing a page, and a short promo if desired.

---

## Figma Community (plugin)

**Plugin name:** PageForge — HTML to Figma
**Tagline:** Convert web pages and HTML into editable Figma designs, powered by AI/MCP.
**Category:** Development / Productivity

**Description:**
```
PageForge imports HTML/CSS directly into Figma as editable layers — 95+ CSS
properties supported (Flexbox, Grid, gradients, shadows, transforms, positioning).

Two ways to feed it HTML:
• The PageForge Chrome extension captures the current web page for you.
• Any AI client (Claude Code, Cursor) via the built-in MCP server.

Enable MCP inside the plugin to get a Session ID, then send HTML from your browser
or your AI assistant and watch it draw in real time.

Self-hostable, MIT-licensed, open source.
```

**Cover image / screenshots:** show the plugin UI with the MCP toggle + Session ID,
and a before/after (a web page vs. the imported Figma frame).

---

## GitHub repo description & topics

**Description:**
> PageForge — turn any web page into an editable Figma design. Chrome capture
> extension + Figma plugin + AI/MCP bridge. Open source, self-hostable, MIT.

**Topics:** `figma`, `figma-plugin`, `html-to-figma`, `design-tools`, `chrome-extension`,
`mcp`, `ai`, `open-source`, `mit-license`

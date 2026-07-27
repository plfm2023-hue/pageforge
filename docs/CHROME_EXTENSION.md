# PageForge Capture (Chrome extension)

The extension is the "web page → HTML" half of the pipeline. It lives in
`chrome-extension/`.

## How it works

1. Popup collects **Server URL**, **API Key**, and **Figma Session ID**.
2. On **Capture & Send**, it messages the content script (`content.js`) running on
   the active tab.
3. `content.js` walks the DOM and serializes it to an HTML string, inlining each
   element's **computed styles** (a curated set of ~70 CSS properties) so the Figma
   plugin renders faithfully.
4. The popup POSTs that HTML to `${Server URL}/mcp-trigger` with
   `Authorization: Bearer <API Key>`. The SSE bridge routes it to your Figma session.

## Load it (unpacked)

1. `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select the `chrome-extension/` folder.
4. Pin the PageForge icon, open a web page, click it, fill config, capture.

## Capture options

- **Whole page** (default): serializes `document.documentElement`.
- **Selected element**: tick *Capture only the selected element* — uses the current
  text-selection's nearest element as the root.

## Tuning the serializer

All capture logic is in `chrome-extension/content.js`:

- `STYLE_PROPS` — which CSS properties get inlined. Add more for fidelity, remove
  for smaller payloads.
- `DEFAULTS` — values skipped because they carry no visual information (keeps HTML
  lean). Adjust if a site's "default" differs.
- `SKIP_TAGS` / `VOID_TAGS` / `KEEP_ATTRS` — which tags/elements/attributes survive.
- `MAX_NODES` — safety cap to avoid gigantic captures.

`content.js` does **not** depend on external "capture" scripts, so it works even on
sites with strict CSP.

## Permissions

- `activeTab`, `tabs`, `scripting` — to read the current page and talk to the
  content script.
- `storage` — remember your config.
- `host_permissions: <all_urls>` — required so the extension's `fetch` to your
  bridge is not blocked by CORS.

## Publishing to the Chrome Web Store

See [`docs/STORE_LISTING.md`](./STORE_LISTING.md) for listing copy and the required
assets (icon, screenshots, privacy note). Before submitting, run `npm run build` is
not needed for the extension (plain JS), but do test capture on a few real sites.

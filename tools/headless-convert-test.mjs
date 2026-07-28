// Headless conversion smoke test for PageForge.
// Mocks the Figma plugin runtime, then runs the REAL converter
// (createFigmaNodesFromStructure in src/code.ts) against a fake HTML
// structure, so we can prove the engine turns markup into Figma nodes
// WITHOUT needing the Figma desktop app.
//
// Usage: node tools/headless-convert-test.mjs

import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function main() {
const root = process.cwd();
const bundlePath = path.join(root, 'tools', '.cache.code.bundle.cjs');

// ---- 1. Figma runtime mock (records everything it would draw) ----
const created = [];
function makeFigNode(kind) {
  const node = { __kind: kind, name: '', children: [], characters: '', _pd: {} };
  return new Proxy(node, {
    get(t, p) {
      if (p === 'appendChild') return (c) => { t.children.push(c); return c; };
      if (p === 'setPluginData') return (k, v) => { t._pd[k] = v; };
      if (p === 'getPluginData') return (k) => t._pd[k] || '';
      if (p === 'remove') return () => {};
      if (p === 'resize') return () => {};
      if (p in t) return t[p];
      return () => {}; // any other figma method => no-op
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

global.figma = {
  createFrame: () => { const n = makeFigNode('FRAME'); created.push(n); return n; },
  createText: () => { const n = makeFigNode('TEXT'); created.push(n); return n; },
  createRectangle: () => { const n = makeFigNode('RECT'); created.push(n); return n; },
  createLine: () => { const n = makeFigNode('LINE'); created.push(n); return n; },
  currentPage: makeFigNode('PAGE'),
  viewport: { center: { x: 0, y: 0 }, scrollAndZoomIntoView: () => {} },
  ui: { onmessage: null, postMessage: () => {}, resize: () => {} },
  notify: () => {},
  showUI: () => {},
  loadFontAsync: () => Promise.resolve(),
  clientStorage: { setAsync: () => Promise.resolve(), getAsync: () => Promise.resolve(null) },
};

// ---- 2. Bundle the real plugin code (keeps `figma` as a free global) ----
await build({
  entryPoints: [path.join(root, 'src', 'code.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: bundlePath,
  logLevel: 'silent',
  define: { __html__: '""' }, // injected by Figma sandbox at runtime; unused in headless test
});
require(bundlePath); // executes top-level figma.* calls, sets figma.ui.onmessage

const handler = global.figma.ui.onmessage;
if (typeof handler !== 'function') {
  console.error('FAIL: plugin did not register figma.ui.onmessage');
  process.exit(1);
}

// ---- 3. A fake "link page" structure (with several fake <a> links) ----
function el(tag, styles, text, children = []) {
  return { type: 'element', tagName: tag, styles: styles || {}, className: styles?.className || '', children, ...(text ? { text } : {}) };
}
const structure = [
  el('nav', { display: 'flex', className: 'nav' }, null, [
    el('a', {}, 'Home'),
    el('a', {}, 'Products'),
    el('a', {}, 'Pricing'),
    el('a', {}, 'Contact'),
  ]),
  el('section', { display: 'flex', 'flex-direction': 'column', className: 'hero' }, null, [
    el('h1', {}, 'Fake Link Tester'),
    el('p', {}, 'This page was generated only to exercise the HTML-to-Figma converter.'),
    el('a', { display: 'inline-block', width: '140px' }, 'Visit Example Site'),
  ]),
  el('footer', { className: 'footer' }, null, [
    el('a', {}, 'Privacy Policy'),
    el('a', {}, 'Terms of Service'),
    el('span', {}, '© 2026 PageForge'),
  ]),
];

// ---- 4. Run the REAL converter ----
const t0 = Date.now();
await handler({ type: 'html-structure', structure, name: 'FakeLinkTest', requestId: 'req-' + Date.now() });
const elapsed = Date.now() - t0;

// ---- 5. Report ----
const frames = created.filter((n) => n.__kind === 'FRAME').length;
const texts = created.filter((n) => n.__kind === 'TEXT').length;
const others = created.length - frames - texts;
const rootFrame = global.figma.currentPage.children[0];

function printTree(node, depth = 0) {
  const pad = '  '.repeat(depth);
  if (node.__kind === 'TEXT') {
    console.log(`${pad}• TEXT: "${(node.characters || '').slice(0, 40)}"`);
  } else {
    console.log(`${pad}▣ ${node.name}  (${node.children.length} children)`);
    for (const c of node.children) printTree(c, depth + 1);
  }
}

console.log('\n========== PageForge headless conversion result ==========');
console.log(`Source: fake "link page" structure (3 sections, 7 <a> fake links)`);
console.log(`Converter: src/code.ts → createFigmaNodesFromStructure (REAL code)`);
console.log(`Time: ${elapsed} ms`);
console.log(`Generated Figma nodes → frames: ${frames}, texts: ${texts}, other: ${others}, total: ${created.length}`);
console.log('\n--- Reconstructed Figma layer tree ---');
printTree(rootFrame);
console.log('==========================================================\n');

// cleanup
fs.rmSync(bundlePath, { force: true });
process.exit(0);
}

main().catch((e) => { console.error('TEST ERROR:', e); process.exit(1); });

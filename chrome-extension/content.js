// PageForge Capture - content script
// Serializes the current page DOM into an HTML string with inlined
// computed styles, which the PageForge Figma plugin can render 1:1.

(function () {
  'use strict';

  // CSS properties we inline. Chosen for visual fidelity vs. payload size.
  const STYLE_PROPS = [
    // layout
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'box-sizing', 'overflow', 'overflow-x', 'overflow-y',
    'float', 'clear', 'z-index', 'opacity', 'visibility',
    // flex
    'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
    'align-content', 'align-self', 'flex', 'flex-grow', 'flex-shrink',
    'flex-basis', 'gap', 'row-gap', 'column-gap', 'order',
    // grid
    'grid-template-columns', 'grid-template-rows', 'grid-auto-flow',
    'grid-auto-columns', 'grid-auto-rows', 'grid-column', 'grid-row',
    'grid-area', 'justify-items', 'place-items',
    // spacing
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    // background (shorthand intentionally avoided to keep payload small)
    'background-color', 'background-image', 'background-size',
    'background-position', 'background-repeat',
    // border
    'border', 'border-width', 'border-style', 'border-color',
    'border-radius', 'border-top', 'border-right', 'border-bottom', 'border-left',
    // typography
    'color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'text-align', 'text-decoration',
    'text-transform', 'white-space', 'word-break', 'vertical-align',
    // effects
    'box-shadow', 'text-shadow', 'filter', 'backdrop-filter', 'transform',
    'cursor', 'pointer-events',
    // lists
    'list-style-type'
  ];

  // Defaults we skip so the HTML stays lean (computed values equal to these
  // add no visual information).
  const DEFAULTS = {
    position: 'static', float: 'none', 'z-index': 'auto', opacity: '1',
    visibility: 'visible', 'box-sizing': 'content-box',
    overflow: 'visible', 'overflow-x': 'visible', 'overflow-y': 'visible',
    clear: 'none', 'flex-grow': '0', 'flex-shrink': '1', 'flex-basis': 'auto',
    order: '0', gap: 'normal', 'row-gap': 'normal', 'column-gap': 'normal',
    'grid-template-columns': 'none', 'grid-template-rows': 'none',
    'grid-auto-flow': 'row', 'align-self': 'auto', 'justify-self': 'auto',
    'background-color': 'rgba(0, 0, 0, 0)', 'background-image': 'none',
    'background-repeat': 'repeat', 'background-position': '0% 0%',
    'background-size': 'auto', 'border': 'none', 'border-width': 'medium',
    'border-style': 'none', 'border-color': 'rgb(0, 0, 0)',
    'border-radius': '0px', 'font-weight': '400', 'font-style': 'normal',
    'line-height': 'normal', 'letter-spacing': 'normal', 'text-align': 'start',
    'text-decoration': 'none', 'text-transform': 'none', 'white-space': 'normal',
    'vertical-align': 'baseline', 'box-shadow': 'none', 'text-shadow': 'none',
    filter: 'none', 'backdrop-filter': 'none', transform: 'none',
    cursor: 'auto', 'pointer-events': 'auto', 'list-style-type': 'disc'
  };

  const SKIP_TAGS = new Set([
    'script', 'style', 'link', 'meta', 'noscript', 'template',
    'head', 'title', 'svg', 'iframe', 'object', 'embed', 'canvas'
  ]);
  const VOID_TAGS = new Set(['img', 'input', 'br', 'hr', 'meta', 'link']);
  const KEEP_ATTRS = ['src', 'href', 'alt', 'title', 'id', 'class', 'type', 'placeholder', 'value', 'name', 'role'];
  const MAX_NODES = 12000;

  function escText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function serializeStyle(el) {
    const cs = getComputedStyle(el);
    const parts = [];
    for (const prop of STYLE_PROPS) {
      const raw = cs.getPropertyValue(prop);
      if (!raw) continue;
      const val = raw.trim();
      if (!val) continue;
      if (DEFAULTS[prop] === val) continue;
      parts.push(prop + ': ' + val);
    }
    return parts.join('; ');
  }

  function serializeNode(node, counter) {
    if (counter.n > MAX_NODES) return '';
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent;
      return (t && t.trim()) ? escText(t) : '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return '';
    counter.n++;

    let attrs = '';
    for (const a of KEEP_ATTRS) {
      if (node.hasAttribute(a)) {
        attrs += ' ' + a + '="' + escAttr(node.getAttribute(a)) + '"';
      }
    }
    const style = serializeStyle(node);
    if (style) attrs += ' style="' + escAttr(style) + '"';

    if (VOID_TAGS.has(tag)) return '<' + tag + attrs + '>';

    let inner = '';
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      inner += serializeNode(children[i], counter);
    }
    return '<' + tag + attrs + '>' + inner + '</' + tag + '>';
  }

  function selectionElement() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      return node || null;
    }
    return null;
  }

  function serializePage(opts) {
    let root = document.documentElement;
    if (opts && opts.selector) {
      const found = document.querySelector(opts.selector);
      if (found) root = found;
    } else if (opts && opts.useSelection) {
      const el = selectionElement();
      if (el) root = el;
    }
    const counter = { n: 0 };
    const body = serializeNode(root, counter);
    return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + body + '</body></html>';
  }

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg && msg.type === 'PAGEFORGE_CAPTURE') {
      try {
        const html = serializePage(msg);
        sendResponse({ ok: true, html: html, url: location.href, title: document.title });
      } catch (e) {
        sendResponse({ ok: false, error: String((e && e.message) || e) });
      }
      return true; // keep channel open for async sendResponse
    }
  });
})();

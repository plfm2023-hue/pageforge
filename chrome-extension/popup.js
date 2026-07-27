// PageForge Capture - popup logic

const $ = (id) => document.getElementById(id);
const els = {
  serverUrl: $('serverUrl'),
  apiKey: $('apiKey'),
  sessionId: $('sessionId'),
  useSelection: $('useSelection'),
  capture: $('capture'),
  status: $('status')
};

const CONFIG_KEYS = ['serverUrl', 'apiKey', 'sessionId', 'useSelection'];

function setStatus(text, kind) {
  els.status.textContent = text;
  els.status.className = 'status' + (kind ? ' ' + kind : '');
}

async function loadConfig() {
  const cfg = await chrome.storage.sync.get(CONFIG_KEYS);
  els.serverUrl.value = cfg.serverUrl || '';
  els.apiKey.value = cfg.apiKey || 'dev-key';
  els.sessionId.value = cfg.sessionId || '';
  els.useSelection.checked = !!cfg.useSelection;
}

function saveConfig() {
  chrome.storage.sync.set({
    serverUrl: els.serverUrl.value.trim(),
    apiKey: els.apiKey.value.trim(),
    sessionId: els.sessionId.value.trim(),
    useSelection: els.useSelection.checked
  });
}

async function captureAndSend() {
  saveConfig();
  const serverUrl = els.serverUrl.value.trim();
  const apiKey = els.apiKey.value.trim();
  const sessionId = els.sessionId.value.trim();

  if (!serverUrl || !sessionId) {
    setStatus('Fill in Server URL and Session ID first.', 'err');
    return;
  }

  els.capture.disabled = true;
  setStatus('Capturing page…');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id == null) throw new Error('No active tab.');

    const resp = await chrome.tabs.sendMessage(tab.id, {
      type: 'PAGEFORGE_CAPTURE',
      useSelection: els.useSelection.checked
    });
    if (!resp || !resp.ok) {
      throw new Error((resp && resp.error) || 'Page capture failed (try reloading the tab).');
    }

    setStatus('Page captured (' + resp.html.length + ' chars). Sending to Figma…');

    const url = serverUrl.replace(/\/+$/, '') + '/mcp-trigger';
    const payload = {
      type: 'mcp-request',
      function: 'figma_html_bridge_import',
      arguments: {
        html: resp.html,
        name: tab.title || 'PageForge Capture'
      },
      sessionId: sessionId,
      requestId: 'pf-' + Date.now(),
      timestamp: new Date().toISOString(),
      source: 'pageforge-chrome-extension'
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(payload)
    });

    let data = {};
    try { data = await res.json(); } catch (_) { /* non-JSON response is fine */ }

    if (res.ok && data.success) {
      setStatus('✅ Sent! Check your Figma file — the design is being drawn.', 'ok');
    } else if (res.status === 404) {
      setStatus('❌ Session not connected. Open the Figma plugin and enable MCP, then retry.', 'err');
    } else {
      setStatus('❌ Server replied: ' + (data.error || res.status), 'err');
    }
  } catch (e) {
    setStatus('❌ ' + (e && e.message ? e.message : String(e)), 'err');
  } finally {
    els.capture.disabled = false;
  }
}

els.capture.addEventListener('click', captureAndSend);
loadConfig();

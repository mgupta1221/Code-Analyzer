document.addEventListener('DOMContentLoaded', () => {
  checkKey();
  document.getElementById('check-btn').addEventListener('click', checkKey);
});

async function checkKey() {
  setStatus('checking', 'Checking…');
  try {
    const res = await chrome.runtime.sendMessage({ action: 'checkApiKey' });
    if (res?.hasKey) {
      setStatus('ok', `API key loaded  (${res.preview})`);
    } else {
      setStatus('err', 'No API key found — run inject_key.py then reload the extension');
    }
  } catch (e) {
    setStatus('err', 'Could not reach background service worker — try reloading the extension');
  }
}

function setStatus(type, msg) {
  const el = document.getElementById('key-status');
  el.className = `key-status ${type}`;
  document.getElementById('key-msg').textContent = msg;
}

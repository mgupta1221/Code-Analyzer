let currentMode = 'explain';
let selectedCode = '';
let rawResponse = '';

const MODE_LABEL = { explain: 'Explain Code', review: 'Review Code', convert: 'Convert Code' };
const MODE_ICON  = { explain: '🔍', review: '✅', convert: '🔄' };

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Clear the context-menu badge (if set by background.js)
  chrome.action.setBadgeText({ text: '' }).catch(() => {});

  await loadCode();
  bindTabs();
  bindRunButton();
  bindCopyButton();
  document.getElementById('settings-btn').addEventListener('click', () =>
    chrome.runtime.openOptionsPage()
  );
});

// ── Load selected code from page or context-menu storage ──────────────────────
async function loadCode() {
  // Context menu path: code saved to local storage by background.js
  const { contextCode, contextTs } = await chrome.storage.local.get(['contextCode', 'contextTs']);
  if (contextCode && Date.now() - (contextTs || 0) < 8000) {
    selectedCode = contextCode;
    await chrome.storage.local.remove(['contextCode', 'contextTs']);
    renderCode(selectedCode);
    return;
  }

  // Primary path: executeScript to grab window.getSelection()
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim()
    });
    const code = results?.[0]?.result;
    if (code) { selectedCode = code; renderCode(code); return; }
  } catch (_) { /* restricted page – fall through to content script */ }

  // Fallback: ask content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
    if (res?.code) { selectedCode = res.code; renderCode(res.code); return; }
  } catch (_) { /* ignore */ }

  showEmpty();
}

function renderCode(code) {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('main-content').style.display = 'flex';
  document.getElementById('code-display').textContent = code;
  const lines = code.split('\n').length;
  document.getElementById('code-meta').textContent =
    `${lines} line${lines !== 1 ? 's' : ''} · ${code.length} chars`;
}

function showEmpty() {
  document.getElementById('empty-state').style.display = 'flex';
  document.getElementById('main-content').style.display = 'none';
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      document.getElementById('convert-options').style.display =
        currentMode === 'convert' ? 'flex' : 'none';
      document.getElementById('btn-text').textContent = MODE_LABEL[currentMode];
      document.getElementById('btn-icon').textContent  = MODE_ICON[currentMode];
      // Clear previous result when switching mode
      document.getElementById('result-section').style.display = 'none';
    });
  });
}

// ── Run ───────────────────────────────────────────────────────────────────────
function bindRunButton() {
  document.getElementById('run-btn').addEventListener('click', async () => {
    if (!selectedCode) return;
    setLoading(true);
    const prompt = buildPrompt();
    try {
      const res = await chrome.runtime.sendMessage({ action: 'callGemini', prompt });
      if (res.success) { rawResponse = res.text; showResult(res.text); }
      else showError(res.error);
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  });
}

function buildPrompt() {
  const lang = document.getElementById('target-language').value;

  const prompts = {
    explain:
`You are an expert code teacher. Analyse and explain the following code snippet.

Structure your answer as:
1. **Language & Purpose** – what language is this and what does it do overall?
2. **Line-by-Line Explanation** – go through each meaningful section
3. **Key Concepts** – patterns, data structures, algorithms used
4. **Gotchas / Edge Cases** – anything surprising or worth noting

Use markdown. Wrap code references in \`backticks\`.

\`\`\`
${selectedCode}
\`\`\``,

    review:
`You are a senior software engineer performing a code review.

Analyse the code and return:
1. **Summary** – what the code does
2. **Bugs & Issues** – logic errors, null-pointer risks, off-by-one, etc.
3. **Security Concerns** – injection, exposure, unsafe operations
4. **Performance** – inefficiencies or better alternatives
5. **Improvements** – refactored snippets where helpful
6. **Positives** – what's done well
7. **Score** – X / 10 with one-line justification

Use markdown.

\`\`\`
${selectedCode}
\`\`\``,

    convert:
`You are a polyglot programming expert.

Convert the code below to **${lang}**.

Return:
1. The complete converted code in a fenced code block
2. A brief section titled **Changes Made** explaining syntax differences, library swaps, and idioms used

Target language: ${lang}

\`\`\`
${selectedCode}
\`\`\``
  };

  return prompts[currentMode];
}

function setLoading(on) {
  const btn  = document.getElementById('run-btn');
  const text = document.getElementById('btn-text');
  const icon = document.getElementById('btn-icon');
  const spin = document.getElementById('btn-loader');
  btn.disabled        = on;
  text.textContent    = on ? 'Analysing…' : MODE_LABEL[currentMode];
  icon.style.display  = on ? 'none' : '';
  spin.style.display  = on ? 'inline-block' : 'none';
}

// ── Result ────────────────────────────────────────────────────────────────────
function showResult(text) {
  document.getElementById('result-section').style.display = 'block';
  const el = document.getElementById('result-content');
  el.innerHTML = renderMarkdown(text);
  el.scrollTop = 0;
}

function showError(msg) {
  document.getElementById('result-section').style.display = 'block';
  document.getElementById('result-content').innerHTML =
    `<div class="error-box">⚠️ ${escHtml(msg)}</div>`;
}

// ── Copy ──────────────────────────────────────────────────────────────────────
function bindCopyButton() {
  const btn = document.getElementById('copy-btn');
  btn.addEventListener('click', async () => {
    if (!rawResponse) return;
    await navigator.clipboard.writeText(rawResponse).catch(() => {});
    const orig = btn.innerHTML;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  });
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(raw) {
  const blocks = [];

  // 1. Extract fenced code blocks – escape their content, store as placeholders
  let s = raw.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    const i = blocks.length;
    blocks.push(`<pre><code>${escHtml(code.trim())}</code></pre>`);
    return `\x00BLK${i}\x00`;
  });

  // 2. Escape HTML in non-code text
  s = escHtml(s);

  // 3. Inline code
  s = s.replace(/`([^`\n]+)`/g, (_, c) => `<span class="ic">${c}</span>`);

  // 4. Bold / italic
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g,     '<em>$1</em>');

  // 5. Headers
  s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  s = s.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  s = s.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

  // 6. Ordered lists (consecutive lines starting with digit+period)
  s = s.replace(/((?:^\d+\. .+\n?)+)/gm, m => {
    const items = m.trim().split('\n')
      .map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // 7. Unordered lists
  s = s.replace(/((?:^[*\-] .+\n?)+)/gm, m => {
    const items = m.trim().split('\n')
      .map(l => `<li>${l.replace(/^[*\-] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // 8. Paragraphs
  s = s.split(/\n\n+/).map(p => {
    p = p.trim();
    if (!p) return '';
    if (/^<(h[1-3]|pre|ul|ol|li|\x00)/.test(p)) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).filter(Boolean).join('');

  // 9. Restore code blocks
  s = s.replace(/\x00BLK(\d+)\x00/g, (_, i) => blocks[+i]);

  return s;
}

function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

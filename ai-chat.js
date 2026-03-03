/**
 * Math Verse — AI Chat Module v2
 * Auto-discovers theory panels, scrapes live inputs/outputs for context,
 * and opens a topic-locked Gemini chat. Model selection is internal only.
 */
(function () {
  'use strict';

  /* ─── CONFIG ─────────────────────────────────────────── */
  const BACKEND_URL = '/api/chat';

  /* ─── STATE ───────────────────────────────────────────── */
  let history = [];
  let currentTopic = '';
  let currentContext = '';
  let isLoading = false;

  /* ─── STYLES ──────────────────────────────────────────── */
  const CSS = `
  #mv-ai-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9998;backdrop-filter:blur(4px);opacity:0;transition:opacity .25s;pointer-events:none;}
  #mv-ai-overlay.open{opacity:1;pointer-events:all;}
  #mv-ai-modal{
    position:fixed;top:50%;left:50%;transform:translate(-50%,-55%) scale(.96);
    z-index:9999;width:min(640px,96vw);max-height:88vh;
    background:linear-gradient(145deg,#0f172a,#1e1b4b);
    border:1px solid rgba(139,92,246,.45);border-radius:1.25rem;
    box-shadow:0 0 60px rgba(139,92,246,.35),inset 0 1px 0 rgba(255,255,255,.06);
    display:flex;flex-direction:column;transition:transform .25s,opacity .25s;opacity:0;pointer-events:none;
  }
  #mv-ai-modal.open{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:all;}
  #mv-ai-header{
    display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem .85rem;
    border-bottom:1px solid rgba(139,92,246,.2);flex-shrink:0;
  }
  #mv-ai-icon{font-size:1.5rem;animation:mv-pulse 2.5s ease-in-out infinite;}
  @keyframes mv-pulse{0%,100%{text-shadow:0 0 8px rgba(139,92,246,.7);}50%{text-shadow:0 0 22px rgba(139,92,246,1),0 0 40px rgba(109,40,217,.5);}}
  #mv-ai-headtext{flex:1;}
  #mv-ai-title{font-weight:800;font-size:.95rem;color:#e0e7ff;line-height:1.2;}
  #mv-ai-subtitle{font-size:.7rem;color:#7c3aed;margin-top:.1rem;font-weight:600;}
  #mv-ai-close{
    width:2rem;height:2rem;border-radius:50%;background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.1);color:#94a3b8;cursor:pointer;
    display:grid;place-items:center;font-size:1rem;transition:.2s;flex-shrink:0;
  }
  #mv-ai-close:hover{background:rgba(239,68,68,.15);color:#f87171;border-color:#f87171;}
  #mv-ai-ctx-bar{
    padding:.5rem 1.25rem;background:rgba(109,40,217,.08);
    border-bottom:1px solid rgba(139,92,246,.12);flex-shrink:0;
    font-size:.68rem;color:#6b7280;line-height:1.4;
  }
  #mv-ai-ctx-bar strong{color:#a78bfa;}
  #mv-ai-msgs{flex:1;overflow-y:auto;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:.75rem;min-height:0;}
  #mv-ai-msgs::-webkit-scrollbar{width:4px;}
  #mv-ai-msgs::-webkit-scrollbar-thumb{background:rgba(139,92,246,.35);border-radius:4px;}
  .mv-msg{display:flex;gap:.6rem;animation:mv-msgIn .2s ease-out;}
  @keyframes mv-msgIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:none;}}
  .mv-msg.user{flex-direction:row-reverse;}
  .mv-bubble{
    max-width:82%;padding:.6rem .9rem;border-radius:1rem;font-size:.82rem;line-height:1.58;word-break:break-word;white-space:pre-wrap;
  }
  .mv-msg.user .mv-bubble{background:rgba(109,40,217,.4);border:1px solid rgba(139,92,246,.35);color:#e0e7ff;border-radius:1rem 1rem 0 1rem;}
  .mv-msg.ai  .mv-bubble{background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.08);color:#cbd5e1;border-radius:1rem 1rem 1rem 0;}
  .mv-msg.ai .mv-bubble h1,.mv-msg.ai .mv-bubble h2,.mv-msg.ai .mv-bubble h3{color:#c4b5fd;font-weight:700;margin:.5em 0 .2em;}
  .mv-msg.ai .mv-bubble code{background:rgba(139,92,246,.2);padding:.1em .35em;border-radius:.3em;font-family:monospace;font-size:.88em;color:#a78bfa;}
  .mv-msg.ai .mv-bubble pre{background:rgba(0,0,0,.6);border:1px solid rgba(139,92,246,.2);border-radius:.5rem;padding:.6rem;overflow-x:auto;margin:.4em 0;}
  .mv-msg.ai .mv-bubble pre code{background:none;padding:0;color:#e2e8f0;}
  .mv-msg.ai .mv-bubble strong{color:#f0abfc;}
  .mv-msg.ai .mv-bubble ul,.mv-msg.ai .mv-bubble ol{padding-left:1.2em;margin:.3em 0;}
  .mv-avatar{width:1.8rem;height:1.8rem;border-radius:50%;display:grid;place-items:center;font-size:.85rem;flex-shrink:0;margin-top:2px;}
  .mv-msg.user .mv-avatar{background:rgba(109,40,217,.5);border:1px solid rgba(139,92,246,.4);}
  .mv-msg.ai  .mv-avatar{background:rgba(0,0,0,.5);border:1px solid rgba(139,92,246,.3);}
  .mv-typing{display:flex;gap:.3rem;padding:.5rem .7rem;align-items:center;}
  .mv-dot{width:7px;height:7px;border-radius:50%;background:#7c3aed;animation:mv-bounce .8s infinite;}
  .mv-dot:nth-child(2){animation-delay:.15s;}.mv-dot:nth-child(3){animation-delay:.3s;}
  @keyframes mv-bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
  #mv-ai-input-bar{
    display:flex;gap:.5rem;padding:.75rem 1.25rem 1rem;
    border-top:1px solid rgba(139,92,246,.15);flex-shrink:0;
  }
  #mv-ai-input{
    flex:1;background:rgba(0,0,0,.6);border:1px solid rgba(139,92,246,.3);
    color:#e0e7ff;border-radius:.75rem;padding:.6rem .9rem;font-size:.85rem;
    outline:none;resize:none;font-family:inherit;max-height:120px;overflow-y:auto;transition:.2s;
  }
  #mv-ai-input:focus{border-color:#7c3aed;box-shadow:0 0 12px rgba(109,40,217,.25);}
  #mv-ai-send{
    background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;color:white;
    padding:.6rem .95rem;border-radius:.75rem;cursor:pointer;font-size:1rem;transition:.2s;
    display:grid;place-items:center;
  }
  #mv-ai-send:hover{background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 0 14px rgba(139,92,246,.5);}
  #mv-ai-send:disabled{opacity:.4;cursor:not-allowed;}
  #mv-ai-clear{
    background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1);color:#6b7280;
    padding:.6rem .7rem;border-radius:.75rem;cursor:pointer;font-size:.72rem;transition:.2s;
  }
  #mv-ai-clear:hover{border-color:#f87171;color:#f87171;}
  .mv-ai-btn{
    display:inline-flex;align-items:center;gap:.3rem;
    background:rgba(109,40,217,.15);border:1px solid rgba(139,92,246,.3);
    color:#a78bfa;border-radius:.5rem;padding:.28rem .6rem;font-size:.7rem;
    font-weight:700;cursor:pointer;transition:.2s;font-family:inherit;
  }
  .mv-ai-btn:hover{background:rgba(109,40,217,.35);box-shadow:0 0 10px rgba(139,92,246,.4);color:white;}
  .mv-ai-btn-wrap{display:flex;justify-content:flex-end;margin-bottom:.35rem;}
  `;
  injectCSS(CSS);

  /* ─── MODAL HTML ──────────────────────────────────────── */
  const overlay = document.createElement('div');
  overlay.id = 'mv-ai-overlay';
  const modal = document.createElement('div');
  modal.id = 'mv-ai-modal';
  modal.innerHTML = `
    <div id="mv-ai-header">
      <span id="mv-ai-icon">🤖</span>
      <div id="mv-ai-headtext">
        <div id="mv-ai-title">Math AI Assistant</div>
        <div id="mv-ai-subtitle">—</div>
      </div>
      <button id="mv-ai-close" title="Close">✕</button>
    </div>
    <div id="mv-ai-ctx-bar">
      <strong>Context loaded:</strong> <span id="mv-ai-ctx-preview">—</span>
    </div>
    <div id="mv-ai-msgs"></div>
    <div id="mv-ai-input-bar">
      <textarea id="mv-ai-input" rows="1" placeholder="Ask anything about this topic…"></textarea>
      <button id="mv-ai-send" title="Send">➤</button>
      <button id="mv-ai-clear" title="Clear">Clear</button>
    </div>
  `;

  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    document.getElementById('mv-ai-close').addEventListener('click', closeModal);
    document.getElementById('mv-ai-send').addEventListener('click', sendMessage);
    document.getElementById('mv-ai-clear').addEventListener('click', clearChat);

    const inp = document.getElementById('mv-ai-input');
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    inp.addEventListener('input', () => {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 120) + 'px';
    });

    // Initial injection on all visible panels
    injectButtons();

    // Hook into switchTab (defined in most tool pages) to inject into newly revealed tabs
    const _origSwitchTab = window.switchTab;
    window.switchTab = function (...args) {
      if (_origSwitchTab) _origSwitchTab.apply(this, args);
      // Small delay lets tab content become visible before we scan
      setTimeout(injectButtons, 80);
    };

    // MutationObserver watches for dynamically rendered content (e.g. lawsGrid, ttSummary filled by JS)
    const observer = new MutationObserver(() => setTimeout(injectButtons, 120));
    observer.observe(document.body, { childList: true, subtree: true });
  });

  /* ─── OPEN / CLOSE ────────────────────────────────────── */
  function openModal(topic, context, panelEl) {
    currentTopic = topic || document.title.replace(' - Math Verse', '').trim() || 'Mathematics';
    currentContext = buildRichContext(topic, context, panelEl);
    history = [];

    document.getElementById('mv-ai-subtitle').textContent = currentTopic;
    document.getElementById('mv-ai-msgs').innerHTML = '';
    document.getElementById('mv-ai-input').value = '';

    // Show a short preview of the context in the bar
    const ctxPreview = currentContext.slice(0, 200).replace(/\n/g, ' ') + (currentContext.length > 200 ? '…' : '');
    document.getElementById('mv-ai-ctx-preview').textContent = ctxPreview;

    addSystemMessage(`I can see your current inputs and outputs for **${currentTopic}**. Ask me anything — how it works, why the result is what it is, or how to go further.`);

    overlay.classList.add('open');
    modal.classList.add('open');
    setTimeout(() => document.getElementById('mv-ai-input').focus(), 280);
  }

  window.openMathAI = openModal;

  function closeModal() {
    overlay.classList.remove('open');
    modal.classList.remove('open');
  }

  function clearChat() {
    history = [];
    document.getElementById('mv-ai-msgs').innerHTML = '';
    addSystemMessage(`Chat cleared. Still focused on **${currentTopic}** with full context.`);
  }

  /* ─── CONTEXT SCRAPER ─────────────────────────────────── */
  function buildRichContext(topic, baseContext, panelEl) {
    const pageTitle = document.title.replace(' - Math Verse', '').trim();
    let ctx = `Tool: ${pageTitle}\nSection: ${topic}\n`;

    if (baseContext) ctx += baseContext + '\n';

    if (panelEl) {
      // Scrape input values
      const inputs = panelEl.querySelectorAll('input, select, textarea');
      const inputData = [];
      inputs.forEach(inp => {
        const lbl = findLabel(inp, panelEl);
        const val = inp.value?.trim();
        if (val && val !== '' && !inp.type?.match(/button|submit/i)) {
          inputData.push(`${lbl ? lbl + ': ' : ''}${val}`);
        }
      });
      if (inputData.length) ctx += `\nCurrent inputs:\n${inputData.join('\n')}`;

      // Scrape visible output values (spans/divs that look like results)
      const outputSels = [
        '[id*="out"]', '[id*="result"]', '[id*="ans"]', '[id*="val"]',
        '[id*="res"]', '[id*="output"]', '[class*="result"]',
        '.text-3xl', '.text-2xl:not(h1):not(h2):not(h3)',
        'span[class*="font-mono"]', 'span[class*="font-bold"]'
      ];
      const outData = new Set();
      outputSels.forEach(sel => {
        panelEl.querySelectorAll(sel).forEach(el => {
          const t = el.innerText?.trim();
          const lbl = findLabel(el, panelEl) || el.id || '';
          if (t && t.length > 0 && t.length < 200 && !el.matches('button,input,select,textarea,h1,h2,h3,h4')) {
            outData.add(`${lbl ? lbl + ': ' : ''}${t}`);
          }
        });
      });
      if (outData.size) ctx += `\n\nCurrent outputs/results:\n${[...outData].slice(0, 20).join('\n')}`;

      // Scrape any displayed text (theory blurbs, formulas)
      const infoEls = panelEl.querySelectorAll('p, .text-xs.text-gray-400, .text-sm.text-gray-400');
      const infoTexts = [];
      infoEls.forEach(el => {
        const t = el.innerText?.trim();
        if (t && t.length > 10 && t.length < 400) infoTexts.push(t);
      });
      if (infoTexts.length) ctx += `\n\nPanel description: ${infoTexts.slice(0, 3).join(' | ')}`;
    }

    // Also scrape page-level active tab if present
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) ctx += `\n\nActive tab: ${activeTab.textContent.trim()}`;

    return ctx;
  }

  function findLabel(el, container) {
    // Try associated label
    if (el.id) {
      const lbl = container.querySelector(`label[for="${el.id}"]`);
      if (lbl) return lbl.textContent.trim().replace(/:$/, '');
    }
    // Try closest label ancestor
    const parentLbl = el.closest('label');
    if (parentLbl) return parentLbl.textContent.replace(el.value || '', '').trim().replace(/:$/, '');
    // Try previous sibling text
    const prev = el.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') return prev.textContent.trim().replace(/:$/, '');
    // Try closest text node with "label" class
    const lblCls = el.closest('[class*="label"]');
    if (lblCls) return lblCls.textContent.trim().slice(0, 40);
    return el.placeholder || el.name || '';
  }

  /* ─── SEND MESSAGE ────────────────────────────────────── */
  async function sendMessage() {
    if (isLoading) return;
    const inp = document.getElementById('mv-ai-input');
    const text = inp.value.trim();
    if (!text) return;

    inp.value = ''; inp.style.height = 'auto';
    addUserBubble(text);
    history.push({ role: 'user', content: text });

    const typingEl = addTypingIndicator();
    isLoading = true;
    document.getElementById('mv-ai-send').disabled = true;

    try {
      const reply = await callGemini(buildMessages());
      typingEl.remove();
      addAIBubble(reply);
      history.push({ role: 'assistant', content: reply });
    } catch {
      typingEl.remove();
      addAIBubble('⚠️ All AI models are temporarily unavailable. Please try again in a moment.');
    } finally {
      isLoading = false;
      document.getElementById('mv-ai-send').disabled = false;
      document.getElementById('mv-ai-input').focus();
      scrollMsgs();
    }
  }

  /* ─── GEMINI API ──────────────────────────────────────── */
  function buildMessages() {
    const sys = `You are an expert mathematics tutor embedded in the "${document.title.replace(' - Math Verse', '').trim()}" tool of Math Verse, an interactive math platform.

You have been given the following live context from the user's current session:
---
${currentContext}
---

Your role:
- Answer questions ONLY about the topic "${currentTopic}" and directly related mathematics.
- You already know the user's current inputs and outputs (from the context above). Reference them naturally.
- If the user asks "why is the result X?" or "explain this" — use the actual values from the context.
- Provide step-by-step mathematical explanations with examples.
- Keep answers focused and precise. Do not ask the user what they're working on — you already know.
- If asked about completely unrelated subjects (biology, history, etc.) politely decline.`;

    return { sys, history: history.slice(-16) };
  }

  async function callGemini({ sys, history: hist }) {
    // Map history: 'assistant' -> 'model' for Gemini
    const contents = hist.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: { parts: [{ text: sys }] },
      contents,
      generationConfig: { temperature: 0.55, maxOutputTokens: 1024 },
    };

    const resp = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini error ${resp.status}`);
    }

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  /* ─── AUTO-INJECT BUTTONS ─────────────────────────────── */
  function injectButtons() {
    // Scan h2, h3, h4 headings — h2s inside tab-content panels are also valid targets
    const headings = document.querySelectorAll('h2.text-3xl, h2.text-2xl, h3, h4');

    headings.forEach(heading => {
      const text = heading.textContent.trim();
      if (!text || text.length < 3) return;

      const panel = findNearestPanel(heading);
      if (!panel) return;

      // Skip if already has a button, or if it's inside the modal itself
      if (panel.querySelector('.mv-ai-btn') || panel.closest('#mv-ai-modal')) return;

      const pageTitle = document.title.replace(' - Math Verse', '').trim();
      const context = `This is the "${pageTitle}" tool in Math Verse.`;

      const wrap = document.createElement('div');
      wrap.className = 'mv-ai-btn-wrap';

      const btn = document.createElement('button');
      btn.className = 'mv-ai-btn';
      btn.innerHTML = '🤖 Ask AI';
      btn.title = `Ask AI about: ${text}`;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openModal(text, context, panel);
      });

      wrap.appendChild(btn);
      heading.parentNode.insertBefore(wrap, heading);
    });
  }

  function findNearestPanel(el) {
    // Expanded patterns: covers all panel-like containers across the codebase
    const PANEL_PATTERNS = [
      /bg-gray-900/,
      /bg-gray-800/,
      /bg-black\/(20|30|40|50|60|70)/,
      /rounded-(xl|2xl|3xl)/,
      /glass-panel/,
      /tab-content/,
      /border.*indigo/,
      /border.*violet/,
      /border.*yellow/,
      /border.*pink/,
      /border.*teal/,
      /border.*sky/,
      /border.*orange/,
      /border.*purple/,
      /border.*gray/,
      /p-4|p-5|p-6/,       // padded content blocks
    ];

    let node = el.parentElement;
    let depth = 0;
    while (node && depth < 10) {
      const cls = (node.className || '');
      const id = (node.id || '').toLowerCase();
      // Match by class pattern OR by id/keyword containing history/proof/detail/theory/definition
      const idMatch = /history|proof|detail|theory|definition|section|info|desc|content|panel/.test(id);
      if (node.tagName === 'DIV' && (PANEL_PATTERNS.some(p => p.test(cls)) || idMatch)) {
        return node;
      }
      node = node.parentElement;
      depth++;
    }
    // Fallback: return the direct parent if it's a div
    return el.parentElement?.tagName === 'DIV' ? el.parentElement : null;
  }

  // Expose globally so individual pages can call after tab switches
  window.injectAIButtons = injectButtons;

  /* ─── UI HELPERS ──────────────────────────────────────── */
  function addUserBubble(text) {
    const msgs = document.getElementById('mv-ai-msgs');
    const div = document.createElement('div');
    div.className = 'mv-msg user';
    div.innerHTML = `<div class="mv-avatar">👤</div><div class="mv-bubble">${esc(text)}</div>`;
    msgs.appendChild(div); scrollMsgs();
  }

  function addAIBubble(md) {
    const msgs = document.getElementById('mv-ai-msgs');
    const div = document.createElement('div');
    div.className = 'mv-msg ai';
    div.innerHTML = `<div class="mv-avatar">🤖</div><div class="mv-bubble">${renderMD(md)}</div>`;
    msgs.appendChild(div); scrollMsgs();
  }

  function addSystemMessage(md) {
    const msgs = document.getElementById('mv-ai-msgs');
    const div = document.createElement('div');
    div.className = 'mv-msg ai';
    div.innerHTML = `<div class="mv-avatar">🤖</div><div class="mv-bubble" style="border-color:rgba(139,92,246,.35);background:rgba(109,40,217,.12)">${renderMD(md)}</div>`;
    msgs.appendChild(div); scrollMsgs();
  }

  function addTypingIndicator() {
    const msgs = document.getElementById('mv-ai-msgs');
    const div = document.createElement('div');
    div.className = 'mv-msg ai';
    div.innerHTML = `<div class="mv-avatar">🤖</div><div class="mv-bubble"><div class="mv-typing"><div class="mv-dot"></div><div class="mv-dot"></div><div class="mv-dot"></div></div></div>`;
    msgs.appendChild(div); scrollMsgs();
    return div;
  }

  function scrollMsgs() {
    const msgs = document.getElementById('mv-ai-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  /* ─── MINIMAL MARKDOWN ────────────────────────────────── */
  function renderMD(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[^]*?<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
  }

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function injectCSS(css) {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

})();

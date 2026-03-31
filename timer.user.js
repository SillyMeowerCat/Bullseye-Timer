// ==UserScript==
// @name         Bullseye Timer
// @namespace    statguessr
// @version      1.0.0
// @description  GeoGuessr timer for Bullseye
// @author       Sidecans
// @match        https://www.geoguessr.com/*
// @icon         https://www.geoguessr.com/favicon.ico
// @grant        none
// ==/UserScript==
(function () {
    'use strict';
    let rounds = [], t0 = 0, end = 0, ui, ticker, lastCapt = 0;
    const fmt = ms => (ms / 1000).toFixed(2) + 's';
    const cell = (l, v) => `<div class="c"><div class="l">${l}</div><div class="v">${v}</div></div>`;

    function render() {
        if (!ui) return;
        const live = end ? fmt(end - t0) : t0 ? fmt(Date.now() - t0) : '--';
        ui.innerHTML = rounds.map((r, i) => cell(`R${i + 1}`, r)).join('') + (t0 ? cell(`R${rounds.length + 1}`, live) : '');
    }

    function onCapture() {
        if (!t0 || Date.now() - lastCapt < 1500) return;
        lastCapt = end = Date.now(); render();
        setTimeout(() => { rounds.push(fmt(end - t0)); t0 = Date.now(); end = 0; render(); }, 1200);
    }

    function checkText(txt) {
        if (/game starting in/i.test(txt)) { rounds = []; t0 = Date.now(); end = 0; lastCapt = 0; render(); return; }
        if (/\bcaptured\b/i.test(txt)) onCapture();
    }

    const obs = new MutationObserver(muts => {
        for (const m of muts) {
            if (m.type === 'characterData') { checkText(m.target.textContent); continue; }
            for (const n of m.addedNodes) checkText(n.textContent || '');
        }
    });

    function init() {
        clearInterval(ticker); obs.disconnect(); ui?.remove(); ui = null;
        if (!/\/bullseye\//.test(location.pathname)) return;
        rounds = []; t0 = Date.now(); end = 0; lastCapt = 0;
        if (!document.getElementById('sg-bt-s')) {
            const s = document.createElement('style'); s.id = 'sg-bt-s';
            s.textContent = '#sg-bt{position:fixed;top:14px;left:14px;z-index:99999;background:#4a2399;color:#fff;border-radius:10px;padding:10px 14px;font:11px/1.5 sans-serif;pointer-events:none;display:flex;gap:14px;align-items:center}'
                + '#sg-bt .c{text-align:center}#sg-bt .l{font-size:10px;font-weight:700;opacity:.7}#sg-bt .v{font-size:18px;font-weight:700;line-height:1.2}';
            document.head.appendChild(s);
        }
        ui = Object.assign(document.createElement('div'), { id: 'sg-bt' });
        document.body.appendChild(ui); render();
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
        ticker = setInterval(render, 100);
    }

    let last = '';
    ['pushState', 'replaceState'].forEach(m => { const o = history[m].bind(history); history[m] = (...a) => { o(...a); setTimeout(init, 300); }; });
    window.addEventListener('popstate', () => setTimeout(init, 300));
    setInterval(() => { if (location.pathname !== last) { last = location.pathname; init(); } }, 500);
    init();
})();

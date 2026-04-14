// content.js — youLIB v2

let currentVideoId   = null;
let panelOpen        = false;
let currentRating    = 0;
let summaryResults   = {};   // { short, detailed, report, timeBlocked }
let importantMoments = null;
let summaryCache     = {};   // { [videoId]: { summaryResults, importantMoments, rating } }

// ── Inject styles ──
function injectStyles() {
  if (document.getElementById('vv2-styles')) return;
  const style = document.createElement('style');
  style.id = 'vv2-styles';
  style.textContent = `
    /* ── Archive Button ── */
    #vv2-btn {
      position: fixed; right: 20px; top: 50%;
      transform: translateY(-50%); z-index: 9998;
      background: #0C0C10; border: 1px solid #F59E0B;
      border-radius: 10px; padding: 10px 13px;
      cursor: pointer; display: flex; flex-direction: column;
      align-items: center; gap: 4px;
      box-shadow: 0 4px 24px rgba(245,158,11,0.18);
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: 'Inter', system-ui, sans-serif;
    }
    #vv2-btn.mono-theme { background: #F4F4F4; border-color: #1A1A1A; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
    #vv2-btn:hover { transform: translateY(-50%) scale(1.04); box-shadow: 0 6px 28px rgba(245,158,11,0.32); }
    #vv2-btn.mono-theme:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.22); }
    #vv2-btn .vv2-btn-icon { font-size: 17px; line-height: 1; }
    #vv2-btn .vv2-btn-label { font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #F59E0B; }
    #vv2-btn.mono-theme .vv2-btn-label { color: #1A1A1A; }

    /* ── Backdrop ── */
    #vv2-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 9998;
      opacity: 0; animation: vv2-fade-in 0.2s ease forwards;
    }
    @keyframes vv2-fade-in { to { opacity: 1; } }

    /* ── Panel ── */
    #vv2-panel {
      position: fixed; right: 0; top: 0; bottom: 0; width: 400px;
      background: var(--vv-bg, #0C0C10);
      border-left: 1px solid var(--vv-border, #252530);
      z-index: 9999; display: flex; flex-direction: column;
      transform: translateX(100%);
      animation: vv2-slide-in 0.26s cubic-bezier(0.22,1,0.36,1) forwards;
      font-family: var(--vv-font, 'Inter', system-ui, sans-serif);
      overflow: hidden;
    }
    @keyframes vv2-slide-in { to { transform: translateX(0); } }

    /* Theme variables */
    #vv2-panel.theme-amber {
      --vv-bg: #0C0C10; --vv-bg2: #111118; --vv-bg3: #18181F;
      --vv-border: #252530; --vv-border2: #363648;
      --vv-accent: #F59E0B; --vv-accent-dim: #B97A08;
      --vv-accent-glow: rgba(245,158,11,0.09);
      --vv-cream: #E4DFD5; --vv-cream-dim: #6A6560;
      --vv-red: #EF4444; --vv-green: #22C55E;
      --vv-btn-text: #0C0C10; --vv-star-empty: #2A2A38;
      --vv-font: 'Inter', system-ui, -apple-system, sans-serif;
      --vv-r: 6px; --vv-r-md: 8px; --vv-r-lg: 10px;
    }
    #vv2-panel.theme-mono {
      --vv-bg: #F4F4F4; --vv-bg2: #FFFFFF; --vv-bg3: #EBEBEB;
      --vv-border: #DCDCDC; --vv-border2: #C4C4C4;
      --vv-accent: #1A1A1A; --vv-accent-dim: #555555;
      --vv-accent-glow: rgba(26,26,26,0.06);
      --vv-cream: #111111; --vv-cream-dim: #666666;
      --vv-red: #DC2626; --vv-green: #16A34A;
      --vv-btn-text: #FFFFFF; --vv-star-empty: #CCCCCC;
      --vv-font: 'Inter', system-ui, -apple-system, sans-serif;
      --vv-r: 6px; --vv-r-md: 8px; --vv-r-lg: 10px;
    }

    /* ── Header ── */
    .vv2-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 18px; border-bottom: 1px solid var(--vv-border);
      flex-shrink: 0;
    }
    .vv2-logo { font-size: 14px; font-weight: 700; color: var(--vv-cream); letter-spacing: -0.02em; }
    .vv2-close {
      background: none; border: none; color: var(--vv-cream-dim);
      font-size: 13px; cursor: pointer; padding: 5px 8px;
      line-height: 1; border-radius: var(--vv-r); transition: color 0.15s, background 0.15s;
      font-family: var(--vv-font);
    }
    .vv2-close:hover { color: var(--vv-cream); background: var(--vv-bg3); }

    /* ── Scrollable body ── */
    .vv2-body {
      flex: 1; overflow-y: auto; padding: 16px 18px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .vv2-body::-webkit-scrollbar { width: 3px; }
    .vv2-body::-webkit-scrollbar-thumb { background: var(--vv-border); border-radius: 2px; }

    /* ── Video card ── */
    .vv2-video-card { display: flex; gap: 12px; align-items: flex-start; }
    .vv2-thumb {
      width: 100px; height: 62px; border-radius: var(--vv-r-md);
      object-fit: cover; background: var(--vv-bg3); flex-shrink: 0;
    }
    .vv2-video-info { flex: 1; min-width: 0; padding-top: 1px; }
    .vv2-video-title {
      font-size: 13px; font-weight: 600; color: var(--vv-cream); line-height: 1.4; margin: 0 0 4px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .vv2-channel { font-size: 11px; color: var(--vv-cream-dim); font-weight: 400; }
    .vv2-duration { font-size: 10px; color: var(--vv-cream-dim); margin-top: 3px; font-variant-numeric: tabular-nums; }

    /* ── Section label ── */
    .vv2-label {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--vv-cream-dim); margin-bottom: 8px;
    }

    /* ── Field label ── */
    .vv2-field-label {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--vv-cream-dim); margin-bottom: 9px;
    }

    /* ── Settings section ── */
    .vv2-settings-section {
      background: var(--vv-bg2); border: 1px solid var(--vv-border);
      border-radius: var(--vv-r-lg); padding: 14px;
      display: flex; flex-direction: column; gap: 14px;
    }

    /* ── Radio cards (summary mode) ── */
    .vv2-radio-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .vv2-radio-card { position: relative; cursor: pointer; }
    .vv2-radio-card input[type="radio"] { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
    .vv2-radio-card-label {
      display: flex; align-items: center; justify-content: center; text-align: center;
      padding: 9px 6px; border: 1px solid var(--vv-border);
      border-radius: var(--vv-r-md); background: var(--vv-bg3);
      font-size: 11px; font-weight: 500; color: var(--vv-cream-dim);
      transition: all 0.15s; cursor: pointer; line-height: 1.3;
    }
    .vv2-radio-card:hover .vv2-radio-card-label { border-color: var(--vv-border2); color: var(--vv-cream); }
    .vv2-radio-card input:checked + .vv2-radio-card-label {
      border-color: var(--vv-accent); background: var(--vv-accent-glow);
      color: var(--vv-accent); font-weight: 600;
    }

    /* ── Toggle switches ── */
    .vv2-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 2px 0; }
    .vv2-toggle-name { font-size: 12px; font-weight: 500; color: var(--vv-cream); }
    .vv2-switch { position: relative; display: inline-flex; cursor: pointer; width: 32px; height: 18px; flex-shrink: 0; }
    .vv2-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
    .vv2-switch-thumb {
      position: absolute; inset: 0; border-radius: 99px;
      background: var(--vv-bg3); border: 1px solid var(--vv-border2);
      transition: background 0.2s, border-color 0.2s;
    }
    .vv2-switch-thumb::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--vv-cream-dim); transition: transform 0.2s, background 0.2s;
    }
    .vv2-switch input:checked + .vv2-switch-thumb { background: var(--vv-accent-glow); border-color: var(--vv-accent); }
    .vv2-switch input:checked + .vv2-switch-thumb::after { transform: translateX(14px); background: var(--vv-accent); }

    /* ── Checkbox row (legacy compat) ── */
    .vv2-checkbox-row { display: flex; align-items: flex-start; gap: 8px; padding: 4px 0; cursor: pointer; }
    .vv2-checkbox-row input[type="checkbox"] { width: 14px; height: 14px; margin-top: 2px; accent-color: var(--vv-accent); cursor: pointer; flex-shrink: 0; }
    .vv2-checkbox-label { font-size: 12px; color: var(--vv-cream); cursor: pointer; line-height: 1.4; }
    .vv2-checkbox-label small { display: block; font-size: 10px; color: var(--vv-cream-dim); margin-top: 1px; }

    /* ── Sub-option (block size) ── */
    .vv2-sub-option {
      margin-top: 8px; padding: 10px 11px;
      background: var(--vv-bg3); border-radius: var(--vv-r-md);
      border: 1px solid var(--vv-border); display: none;
    }
    .vv2-sub-option.visible { display: block; }
    .vv2-sub-label { font-size: 10px; color: var(--vv-cream-dim); margin-bottom: 7px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
    .vv2-block-btns { display: flex; gap: 5px; }
    .vv2-block-btn {
      flex: 1; padding: 6px 4px; border-radius: var(--vv-r);
      border: 1px solid var(--vv-border); background: var(--vv-bg2);
      color: var(--vv-cream-dim); font-size: 11px; font-weight: 500;
      cursor: pointer; text-align: center; transition: all 0.15s;
      font-family: var(--vv-font);
    }
    .vv2-block-btn:hover { border-color: var(--vv-border2); color: var(--vv-cream); }
    .vv2-block-btn.active { background: var(--vv-accent-glow); border-color: var(--vv-accent); color: var(--vv-accent); font-weight: 600; }

    /* ── Select row ── */
    .vv2-select-row { display: flex; align-items: center; gap: 10px; }
    .vv2-select-label { font-size: 11px; color: var(--vv-cream-dim); font-weight: 500; white-space: nowrap; min-width: 34px; }
    .vv2-select {
      flex: 1; background: var(--vv-bg3); border: 1px solid var(--vv-border);
      border-radius: var(--vv-r); color: var(--vv-cream); font-family: var(--vv-font);
      font-size: 12px; padding: 7px 9px; outline: none; cursor: pointer; transition: border-color 0.15s;
    }
    .vv2-select:focus { border-color: var(--vv-accent); }
    .vv2-select option { background: var(--vv-bg2); }

    /* ── Folder row ── */
    .vv2-folder-row { display: flex; align-items: center; gap: 10px; }
    .vv2-folder-controls { display: flex; gap: 6px; flex: 1; min-width: 0; }
    .vv2-folder-create-btn {
      background: var(--vv-bg3); border: 1px solid var(--vv-border); border-radius: var(--vv-r);
      color: var(--vv-cream-dim); font-size: 11px; font-weight: 500;
      padding: 7px 9px; cursor: pointer; white-space: nowrap;
      font-family: var(--vv-font); transition: all 0.15s; flex-shrink: 0;
    }
    .vv2-folder-create-btn:hover { border-color: var(--vv-border2); color: var(--vv-cream); }
    .vv2-folder-create-form { margin-top: 8px; }
    .vv2-input-sm {
      width: 100%; background: var(--vv-bg3); border: 1px solid var(--vv-border);
      border-radius: var(--vv-r); color: var(--vv-cream); font-family: var(--vv-font);
      font-size: 12px; padding: 7px 10px; outline: none; transition: border-color 0.15s;
      box-sizing: border-box; margin-bottom: 7px;
    }
    .vv2-input-sm:focus { border-color: var(--vv-accent); }
    .vv2-input-sm::placeholder { color: var(--vv-cream-dim); opacity: 0.45; }
    .vv2-folder-create-actions { display: flex; gap: 6px; justify-content: flex-end; }
    .vv2-btn-ghost-sm {
      padding: 5px 12px; border: 1px solid var(--vv-border); border-radius: var(--vv-r);
      background: transparent; color: var(--vv-cream-dim); font-size: 11px; font-weight: 500;
      cursor: pointer; font-family: var(--vv-font); transition: all 0.15s;
    }
    .vv2-btn-ghost-sm:hover { border-color: var(--vv-border2); color: var(--vv-cream); }
    .vv2-btn-primary-sm {
      padding: 5px 12px; border: none; border-radius: var(--vv-r);
      background: var(--vv-accent); color: var(--vv-btn-text); font-size: 11px; font-weight: 600;
      cursor: pointer; font-family: var(--vv-font); transition: filter 0.15s;
    }
    .vv2-btn-primary-sm:hover { filter: brightness(1.08); }

    /* ── Divider ── */
    .vv2-settings-divider { border: none; border-top: 1px solid var(--vv-border); }

    /* ── Saved banner ── */
    .vv2-saved-banner {
      background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.20);
      border-radius: var(--vv-r); padding: 8px 12px; font-size: 11px; color: var(--vv-green); font-weight: 500;
    }

    /* ── Summary content ── */
    .vv2-summary-content { }
    .vv2-summary-block { border: 1px solid var(--vv-border); border-radius: var(--vv-r-md); overflow: hidden; margin-bottom: 7px; }
    .vv2-summary-block-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 13px; cursor: pointer; background: var(--vv-bg2); transition: background 0.15s;
    }
    .vv2-summary-block-header:hover { background: var(--vv-bg3); }
    .vv2-summary-block-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--vv-accent); }
    .vv2-summary-block-body { padding: 13px; border-top: 1px solid var(--vv-border); display: none; }
    .vv2-summary-block-body.open { display: block; }
    .vv2-expand-arrow { font-size: 10px; color: var(--vv-cream-dim); transition: transform 0.2s; }
    .vv2-summary-block.open .vv2-expand-arrow { transform: rotate(180deg); }

    /* ── Important moments ── */
    .vv2-moments-grid { display: flex; flex-direction: column; gap: 7px; }
    .vv2-moment-item { background: var(--vv-bg3); border: 1px solid var(--vv-border); border-radius: var(--vv-r); padding: 9px 11px; }
    .vv2-moment-badge { display: inline-block; font-size: 9px; padding: 1px 6px; border-radius: 99px; font-weight: 600; margin-bottom: 4px; }
    .vv2-moment-title { font-size: 12px; font-weight: 600; color: var(--vv-cream); margin-bottom: 2px; }
    .vv2-moment-ts { font-size: 10px; color: var(--vv-accent); float: right; font-variant-numeric: tabular-nums; }
    .vv2-moment-desc { font-size: 11px; color: var(--vv-cream-dim); line-height: 1.5; }

    /* ── Markdown ── */
    .vv2-md-heading {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
      color: var(--vv-accent); margin: 14px 0 6px; padding-bottom: 5px;
      border-bottom: 1px solid var(--vv-border);
    }
    .vv2-md-heading:first-child { margin-top: 0; }
    .vv2-md-para { font-size: 13px; color: var(--vv-cream); line-height: 1.75; margin: 3px 0; }
    .vv2-md-list { margin: 4px 0 4px 4px; padding: 0; list-style: none; }
    .vv2-md-list li { font-size: 13px; color: var(--vv-cream); line-height: 1.75; padding: 1px 0 1px 14px; position: relative; }
    .vv2-md-list li::before { content: '›'; position: absolute; left: 0; color: var(--vv-accent); font-weight: 700; }
    .vv2-md-list li strong, .vv2-md-para strong { color: var(--vv-cream); font-weight: 600; }
    .vv2-badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .vv2-badge-warn { background: rgba(245,158,11,0.12); color: #F59E0B; border: 1px solid rgba(245,158,11,0.25); }
    .vv2-badge-crit { background: rgba(239,68,68,0.10); color: #EF4444; border: 1px solid rgba(239,68,68,0.22); }
    .vv2-badge-info { background: rgba(99,102,241,0.10); color: #818CF8; border: 1px solid rgba(99,102,241,0.22); }

    /* ── States ── */
    .vv2-warn { background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.18); border-radius: var(--vv-r); padding: 8px 11px; font-size: 11px; color: #F59E0B; margin-bottom: 6px; line-height: 1.5; }
    .vv2-err  { background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.20); border-radius: var(--vv-r); padding: 8px 11px; font-size: 11px; color: var(--vv-red); margin-bottom: 6px; line-height: 1.5; }
    .vv2-loading-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    .vv2-loading-text { font-size: 12px; color: var(--vv-cream); font-weight: 500; }
    .vv2-loading-sub  { font-size: 11px; color: var(--vv-cream-dim); margin-top: 2px; }

    /* ── Buttons ── */
    .vv2-btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 10px 16px; background: var(--vv-accent); color: var(--vv-btn-text);
      border: none; border-radius: var(--vv-r-md); font-family: var(--vv-font);
      font-size: 13px; font-weight: 600; letter-spacing: 0.01em;
      cursor: pointer; transition: filter 0.15s, transform 0.1s;
    }
    .vv2-btn-primary:hover { filter: brightness(1.08); }
    .vv2-btn-primary:active { transform: scale(0.99); }
    .vv2-btn-primary:disabled { opacity: 0.38; cursor: not-allowed; transform: none; filter: none; }
    .vv2-btn-ghost {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 9px 14px; background: transparent; color: var(--vv-cream-dim);
      border: 1px solid var(--vv-border); border-radius: var(--vv-r-md);
      font-family: var(--vv-font); font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
    }
    .vv2-btn-ghost:hover { border-color: var(--vv-border2); color: var(--vv-cream); }
    .vv2-regen {
      font-size: 11px; color: var(--vv-cream-dim); background: none; border: none;
      cursor: pointer; padding: 5px 0; margin-top: 6px; transition: color 0.15s;
      font-family: var(--vv-font); display: block; font-weight: 500;
    }
    .vv2-regen:hover { color: var(--vv-accent); }

    /* ── Textarea ── */
    .vv2-textarea {
      width: 100%; background: var(--vv-bg2); border: 1px solid var(--vv-border);
      border-radius: var(--vv-r-md); color: var(--vv-cream); font-family: var(--vv-font);
      font-size: 13px; padding: 10px 12px; resize: none; outline: none;
      transition: border-color 0.15s; box-sizing: border-box; line-height: 1.6;
    }
    .vv2-textarea:focus { border-color: var(--vv-accent); }
    .vv2-textarea::placeholder { color: var(--vv-cream-dim); opacity: 0.4; }

    /* ── Stars ── */
    .vv2-stars { display: flex; gap: 3px; }
    .vv2-star { cursor: pointer; font-size: 18px; color: var(--vv-star-empty); transition: color 0.1s, transform 0.1s; line-height: 1; user-select: none; }
    .vv2-star:hover, .vv2-star.on { color: var(--vv-accent); }
    .vv2-star:hover { transform: scale(1.12); }
    .vv2-rating-row { display: flex; align-items: center; justify-content: space-between; }
    .vv2-rating-val { font-size: 12px; color: var(--vv-accent); min-width: 36px; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }

    /* ── Spinner ── */
    @keyframes vv2-spin { to { transform: rotate(360deg); } }
    .vv2-spinner {
      width: 13px; height: 13px; border: 1.5px solid rgba(245,158,11,0.18);
      border-top-color: var(--vv-accent); border-radius: 50%;
      animation: vv2-spin 0.7s linear infinite; flex-shrink: 0; display: inline-block;
    }

    /* ── Footer ── */
    .vv2-footer {
      padding: 12px 18px 16px; border-top: 1px solid var(--vv-border);
      display: flex; gap: 8px; flex-shrink: 0;
    }

    /* ── Success ── */
    .vv2-success { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 52px 24px; text-align: center; flex: 1; }
    .vv2-success-icon { font-size: 38px; }
    .vv2-success-title { font-size: 16px; font-weight: 700; color: var(--vv-green); }
    .vv2-success-sub { font-size: 13px; color: var(--vv-cream-dim); line-height: 1.6; }

    /* ── Progress ── */
    .vv2-progress-bar { height: 2px; background: var(--vv-border); border-radius: 2px; margin-top: 7px; overflow: hidden; }
    .vv2-progress-fill { height: 100%; background: var(--vv-accent); border-radius: 2px; transition: width 0.4s ease; width: 0%; }
  `;
  document.head.appendChild(style);
}

// ── Helpers ──
function getVideoId()   { return new URLSearchParams(window.location.search).get('v'); }
function getVideoTitle() {
  return (
    document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string')?.textContent ||
    document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent ||
    document.querySelector('#title h1 yt-formatted-string')?.textContent ||
    document.title.replace(' - YouTube', '')
  ).trim();
}
function getChannelName() {
  return (
    document.querySelector('#channel-name yt-formatted-string a')?.textContent ||
    document.querySelector('#owner #channel-name a')?.textContent ||
    'Bilinmeyen Kanal'
  ).trim();
}
function getDuration() { return Math.round(document.querySelector('video')?.duration || 0); }
function escHtml(str)  { return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Storage ──
function getArchive()   { return new Promise(r => chrome.storage.local.get('archive', d => r(d.archive || []))); }
function getFolders()   { return new Promise(r => chrome.storage.local.get('folders', d => r(d.folders || []))); }
function getSettings()  { return new Promise(r => chrome.storage.local.get('settings', d => r(d.settings || {}))); }
function getApiKey()    { return new Promise(r => chrome.storage.local.get('apiKey', d => r((d.apiKey || '').trim()))); }
function getSupadataKey(){ return new Promise(r => chrome.storage.local.get('supadataKey', d => r((d.supadataKey || '').trim()))); }

function saveArchiveData(archive) { return new Promise(r => chrome.storage.local.set({ archive }, r)); }

// ── Caption/Transcript infrastructure (preserved from v1) ──
function injectCaptionMonitor() {
  const s = document.createElement('script');
  s.textContent = `(function(){if(window.__vvMonitorActive)return;window.__vvMonitorActive=true;window.__vvCaptionCache=null;function c(){try{var pr=window.ytInitialPlayerResponse;if(!pr)return;var ct=pr.captions&&pr.captions.playerCaptionsTracklistRenderer;var t=ct&&ct.captionTracks;if(t&&t.length){window.__vvCaptionCache=JSON.stringify(t);}}catch(e){}}c();['yt-navigate-finish','yt-page-data-updated'].forEach(function(ev){document.addEventListener(ev,function(){window.__vvCaptionCache=null;setTimeout(c,300);setTimeout(c,1000);setTimeout(c,2500);});});})();`;
  (document.head||document.documentElement).appendChild(s);
  s.remove();
}

function getCaptionTracksFromMonitor(ms=5000) {
  return new Promise(resolve=>{
    const evtName='__vvRead_'+Date.now();
    const timer=setTimeout(()=>{document.removeEventListener(evtName,handler);resolve(null);},ms);
    function handler(e){clearTimeout(timer);try{resolve(e.detail?JSON.parse(e.detail):null);}catch(_){resolve(null);}}
    document.addEventListener(evtName,handler,{once:true});
    const s=document.createElement('script');
    s.textContent=`document.dispatchEvent(new CustomEvent(${JSON.stringify(evtName)},{detail:window.__vvCaptionCache||null}));`;
    document.head.appendChild(s);s.remove();
  });
}

function readTracksViaEvent(ms=4000) {
  return new Promise(resolve=>{
    const evtName='__vvDirect_'+Date.now();
    const timer=setTimeout(()=>{document.removeEventListener(evtName,handler);resolve(null);},ms);
    function handler(e){clearTimeout(timer);try{resolve(e.detail?JSON.parse(e.detail):null);}catch(_){resolve(null);}}
    document.addEventListener(evtName,handler,{once:true});
    const s=document.createElement('script');
    s.textContent=`(function(){try{var pr=window.ytInitialPlayerResponse;var ct=pr&&pr.captions&&pr.captions.playerCaptionsTracklistRenderer;var t=ct&&ct.captionTracks;document.dispatchEvent(new CustomEvent(${JSON.stringify(evtName)},{detail:(t&&t.length)?JSON.stringify(t):null}));}catch(e){document.dispatchEvent(new CustomEvent(${JSON.stringify(evtName)},{detail:null}));}})();`;
    document.head.appendChild(s);s.remove();
  });
}

async function fetchTextFromTracks(tracks) {
  const track = tracks.find(c=>c.languageCode==='tr') || tracks.find(c=>c.languageCode==='en') || tracks.find(c=>c.kind!=='asr') || tracks[0];
  if (!track||!track.baseUrl) return null;
  try {
    const res = await fetch(track.baseUrl+'&fmt=json3');
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.events||[]).filter(e=>e.segs).map(e=>e.segs.map(s=>s.utf8||'').join('')).join(' ').replace(/\s+/g,' ').trim();
    return text.length>80?text:null;
  } catch(_){return null;}
}

function parseTracksFromHtml(html) {
  try {
    const marker='"captionTracks":';
    const idx=html.indexOf(marker);
    if(idx===-1)return null;
    const arrStart=html.indexOf('[',idx);
    if(arrStart===-1)return null;
    let depth=0,end=-1;
    for(let j=arrStart;j<Math.min(arrStart+300000,html.length);j++){
      if(html[j]==='[')depth++;else if(html[j]===']'){depth--;if(depth===0){end=j;break;}}
    }
    if(end===-1)return null;
    const tracks=JSON.parse(html.substring(arrStart,end+1));
    return(tracks&&tracks.length)?tracks:null;
  }catch(_){return null;}
}

async function fetchTranscript() {
  const videoId = getVideoId();
  if (!videoId) return null;

  // Supadata first
  const supadataKey = await getSupadataKey();
  if (supadataKey) {
    const result = await chrome.runtime.sendMessage({ type:'SUPADATA_TRANSCRIPT', supadataKey, videoId });
    if (result&&result.text&&result.text.length>80) return result.text;
  }

  // YT monitor cache
  const monitorTracks = await getCaptionTracksFromMonitor(3000);
  if (monitorTracks&&monitorTracks.length) { const t=await fetchTextFromTracks(monitorTracks); if(t)return t; }

  // ytInitialPlayerResponse
  const directTracks = await readTracksViaEvent(4000);
  if (directTracks&&directTracks.length) { const t=await fetchTextFromTracks(directTracks); if(t)return t; }

  // Page fetch
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`,{headers:{'Accept-Language':'tr-TR,tr;q=0.9,en-US,en;q=0.7'}});
    if (pageRes.ok) { const html=await pageRes.text(); const pageTracks=parseTracksFromHtml(html); if(pageTracks){const t=await fetchTextFromTracks(pageTracks);if(t)return t;} }
  } catch(_){}

  // timedtext API
  const candidates = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&fmt=json3&kind=asr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3&kind=asr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=json3&kind=asr`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url); if(!res.ok)continue;
      const data = await res.json();
      if(!data||!data.events||data.events.length<5)continue;
      const text = data.events.filter(e=>e.segs).map(e=>e.segs.map(s=>s.utf8||'').join('')).join(' ').replace(/\s+/g,' ').trim();
      if(text.length>80)return text;
    }catch(_){}
  }
  return null;
}

// ── Language labels ──
const LANG_LABELS = {
  tr: 'Türkçe', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español'
};
const LANG_INSTRUCTIONS = {
  tr: 'Tüm yanıtını Türkçe yaz.',
  en: 'Write your entire response in English.',
  de: 'Schreibe deine gesamte Antwort auf Deutsch.',
  fr: 'Écris toute ta réponse en français.',
  es: 'Escribe toda tu respuesta en español.',
};

// ── Prompt builders ──
function buildShortPrompt(title, channel, transcript, lang) {
  const langInstr = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS['tr'];
  const trPart = transcript
    ? `Transkript:\n${transcript.substring(0,10000)}`
    : `(Transkript bulunamadı — başlık ve kanala göre tahmin yap.)`;
  return `${langInstr}

Sen bir özet uzmanısın. "${title}" başlıklı YouTube videosunu (Kanal: ${channel}) kısaca özetle.

Kurallar:
- Sadece ana fikri ver
- Maksimum 5-6 cümle
- Kompakt, hızlı okunabilir
- Madde listesi kullanma, paragraf yaz
- Başlık kullanma

${trPart}`;
}

function buildDetailedPrompt(title, channel, transcript, lang) {
  const langInstr = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS['tr'];
  const trPart = transcript
    ? `Transkript:\n${transcript.substring(0,18000)}`
    : `(Transkript bulunamadı — başlık ve kanala göre tahmin yap.)`;
  return `${langInstr}

Sen bir eğitim uzmanısın. "${title}" başlıklı YouTube videosunu (Kanal: ${channel}) detaylı şekilde özetle.

Şu yapıyı kullan:

## GENEL ÖZET
Videonun ana fikrini ve amacını 3-5 cümleyle anlat.

## BÖLÜM BÖLÜM İÇERİK
Transkripti mantıksal parçalara böl. Her bölüm için başlık yaz ve konuyu öğretici şekilde anlat.

## KAVRAM AÇIKLAMALARI
Videoda geçen teknik terimler veya özel kavramlar varsa açıkla.

## KRİTİK NOKTALAR
En önemli, dikkat çekici bilgileri listele.

## EN ÖNEMLİ ÇIKARIMLAR
Bu videodan öğrenilecek 3-5 anahtar mesaj.

${trPart}`;
}

function buildReportPrompt(title, channel, transcript, lang) {
  const langInstr = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS['tr'];
  const trPart = transcript
    ? `Transkript:\n${transcript.substring(0,18000)}`
    : `(Transkript bulunamadı — başlık ve kanala göre tahmin yap.)`;
  return `${langInstr}

Sen bir araştırma analistisin. "${title}" başlıklı YouTube videosunu (Kanal: ${channel}) sistematik şekilde raporla.

KRİTİK KURAL: Video içeriği ve ek AI bağlamı MUTLAKA ayrı başlıklar altında gösterilecek. Hiçbir zaman karıştırma.

## 📹 VIDEODAN GELEN BİLGİLER
Sadece transkriptte gerçekten söylenen bilgileri yaz. Yorum yapma, sadece içeriği aktar.

### Temel Konular
### Önemli İfadeler ve Tanımlar
### Adım Adım Anlatılan Süreçler (varsa)
### Sunulan Veriler ve Örüntüler (varsa)
### Konuşmacının Önerileri ve Sonuçları

---

## 🤖 EK AI BAĞLAMI
Bu bölüm tamamen AI'ın eklediği ek bağlamdır. Video bu bilgileri içermiyor olabilir.

### Konunun Genel Bağlamı
### İlgili Ek Kavramlar
### Potansiyel Uygulama Alanları
### Dikkat Edilmesi Gereken Noktalar

${trPart}`;
}

function buildTimeBlockedPrompt(title, channel, transcript, lang, blockMinutes, durationSec) {
  const langInstr = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS['tr'];
  const totalMin  = Math.ceil((durationSec || 600) / 60);
  const blocks    = [];
  for (let start = 0; start < totalMin; start += blockMinutes) {
    const end = Math.min(start + blockMinutes, totalMin);
    blocks.push(`${start}:00–${end}:00`);
  }

  const detailLevel = blockMinutes <= 3 ? 'çok detaylı (4-6 cümle)' : blockMinutes <= 5 ? 'orta detaylı (3-4 cümle)' : 'genel (2-3 cümle)';

  const trPart = transcript
    ? `Transkript:\n${transcript.substring(0,18000)}`
    : `(Transkript bulunamadı — başlık ve kanala göre tahmin yap ve zaman bloklarını kurgula.)`;

  return `${langInstr}

"${title}" başlıklı YouTube videosunu (Kanal: ${channel}, Süre: ~${totalMin} dakika) ${blockMinutes} dakikalık bloklara böl ve her blok için ${detailLevel} özet oluştur.

Her blok için şu formatı kullan:
## ⏱ [ZAMAN ARALIĞI]
[O zaman aralığında anlatılan konuların özeti]

Toplam bloklar: ${blocks.join(' | ')}

${trPart}`;
}

function buildImportantMomentsPrompt(title, channel, transcript, lang, durationSec) {
  const langInstr = LANG_INSTRUCTIONS[lang] || LANG_INSTRUCTIONS['tr'];
  const totalMin  = Math.ceil((durationSec || 600) / 60);
  const trPart    = transcript
    ? `Transkript:\n${transcript.substring(0,15000)}`
    : `(Transkript yok — başlık ve konuya göre tahmin et.)`;

  return `${langInstr}

"${title}" başlıklı YouTube videosunu (Kanal: ${channel}, Süre: ~${totalMin} dakika) analiz et ve şunları üret:

CEVABINI TAM OLARAK BU JSON FORMATINDA VER (başka metin ekleme):
{
  "criticalMoments": [
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" },
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" },
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" },
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" },
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" }
  ],
  "examPoints": [
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" },
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" },
    { "title": "...", "description": "...", "reason": "...", "timestamp": "MM:SS" }
  ],
  "actionItems": [
    { "title": "...", "description": "...", "reason": "...", "timestamp": null },
    { "title": "...", "description": "...", "reason": "...", "timestamp": null },
    { "title": "...", "description": "...", "reason": "...", "timestamp": null },
    { "title": "...", "description": "...", "reason": "...", "timestamp": null }
  ]
}

Kurallar:
- criticalMoments: Tam 5 kritik an (vurgu içeren, tekrarlanan önemli fikirler, tanımlar)
- examPoints: Tam 3 sınavlık nokta (öğrenciye yararlı, sınava gelebilecek bilgiler)
- actionItems: Tam 4 aksiyon önerisi (uygulanabilir, somut tavsiyeler)
- timestamp: varsa gerçek süre (transkriptten tahmin et), yoksa null yaz
- title: kısa ve öz başlık
- description: kısa açıklama
- reason: neden önemli olduğu

${trPart}`;
}

// ── Panel HTML builder ──
function buildPanelHTML({ title, channel, duration, thumb, existing, settings, folders }) {
  const mins = Math.floor(duration / 60);
  const secs = String(duration % 60).padStart(2,'0');
  const durationStr = duration ? `${mins}:${secs}` : '';
  const savedBanner = existing
    ? '<div class="vv2-saved-banner">Bu video zaten arşivde — güncelleyebilirsin.</div>' : '';

  // Folder options
  const existingFolder = existing ? (existing.folderId || '') : '';
  const folderOptions = (folders || []).map(f =>
    `<option value="${escHtml(f.id)}" ${existingFolder === f.id ? 'selected' : ''}>${escHtml(f.name)}</option>`
  ).join('');

  // Default settings
  const defaultTypes = (settings && settings.defaultSummaryTypes) || ['detailed'];
  const defaultLang  = (settings && settings.defaultOutputLanguage) || 'tr';
  const defaultBlock = (settings && settings.defaultBlockSize) || 5;

  const types = existing ? (existing.summaryTypes || defaultTypes) : defaultTypes;
  const lang  = existing ? (existing.selectedOutputLanguage || defaultLang) : defaultLang;
  const block = existing ? (existing.blockSizePreference || defaultBlock) : defaultBlock;

  // Radio: pick primary type (short/detailed/report), default to 'detailed'
  const radioTypes  = ['short', 'detailed', 'report'];
  const primaryType = radioTypes.find(t => types.includes(t)) || 'detailed';
  function radioChk(t) { return t === primaryType ? 'checked' : ''; }
  const timeChecked = types.includes('timeBlocked') ? 'checked' : '';

  function sel(l) { return l === lang ? 'selected' : ''; }

  return `
    <div class="vv2-header">
      <div class="vv2-logo">you<span style="color:var(--vv-accent);font-weight:800;">LIB</span></div>
      <button class="vv2-close" id="vv2-close">✕</button>
    </div>
    <div class="vv2-body" id="vv2-body">
      ${savedBanner}

      <div class="vv2-video-card">
        <img class="vv2-thumb" src="${escHtml(thumb)}" alt=""
          onerror="this.style.background='var(--vv-bg3)';this.removeAttribute('src')" />
        <div class="vv2-video-info">
          <div class="vv2-video-title">${escHtml(title)}</div>
          <div class="vv2-channel">${escHtml(channel)}</div>
          ${durationStr ? `<div class="vv2-duration">${durationStr}</div>` : ''}
        </div>
      </div>

      <div class="vv2-settings-section">

        <div>
          <div class="vv2-field-label">Özet Modu</div>
          <div class="vv2-radio-cards">
            <label class="vv2-radio-card" for="cb-short">
              <input type="radio" id="cb-short" name="summary-mode" value="short" ${radioChk('short')} />
              <span class="vv2-radio-card-label">Kısa Özet</span>
            </label>
            <label class="vv2-radio-card" for="cb-detailed">
              <input type="radio" id="cb-detailed" name="summary-mode" value="detailed" ${radioChk('detailed')} />
              <span class="vv2-radio-card-label">Detaylı Özet</span>
            </label>
            <label class="vv2-radio-card" for="cb-report">
              <input type="radio" id="cb-report" name="summary-mode" value="report" ${radioChk('report')} />
              <span class="vv2-radio-card-label">Profesyonel Rapor</span>
            </label>
          </div>
        </div>

        <hr class="vv2-settings-divider" />

        <div>
          <div class="vv2-field-label">Ek Özellikler</div>

          <div class="vv2-toggle-row">
            <span class="vv2-toggle-name">Zaman Bloklu Özet</span>
            <label class="vv2-switch">
              <input type="checkbox" id="cb-time" ${timeChecked} />
              <span class="vv2-switch-thumb"></span>
            </label>
          </div>

          <div class="vv2-sub-option" id="block-size-option">
            <div class="vv2-sub-label">Blok Boyutu</div>
            <div class="vv2-block-btns">
              <div class="vv2-block-btn ${block===3?'active':''}" data-block="3">3 dk</div>
              <div class="vv2-block-btn ${block===5?'active':''}" data-block="5">5 dk</div>
              <div class="vv2-block-btn ${block===10?'active':''}" data-block="10">10 dk</div>
            </div>
          </div>

          <div class="vv2-toggle-row" style="margin-top:10px;">
            <span class="vv2-toggle-name">Önemli Anlar</span>
            <label class="vv2-switch">
              <input type="checkbox" id="cb-moments" />
              <span class="vv2-switch-thumb"></span>
            </label>
          </div>
        </div>

        <hr class="vv2-settings-divider" />

        <div class="vv2-select-row">
          <span class="vv2-select-label">Dil</span>
          <select class="vv2-select" id="lang-select">
            <option value="tr" ${sel('tr')}>Türkçe</option>
            <option value="en" ${sel('en')}>English</option>
            <option value="de" ${sel('de')}>Deutsch</option>
            <option value="fr" ${sel('fr')}>Français</option>
            <option value="es" ${sel('es')}>Español</option>
          </select>
        </div>

        <hr class="vv2-settings-divider" />

        <div>
          <div class="vv2-folder-row">
            <span class="vv2-select-label">Klasör</span>
            <div class="vv2-folder-controls">
              <select class="vv2-select" id="folder-select">
                <option value="" ${!existingFolder?'selected':''}>Kategorisiz</option>
                ${folderOptions}
              </select>
              <button class="vv2-folder-create-btn" id="vv2-folder-create-btn" type="button">+ Yeni</button>
            </div>
          </div>
          <div class="vv2-folder-create-form" id="vv2-folder-create-form" style="display:none;">
            <input type="text" class="vv2-input-sm" id="vv2-folder-name-input"
              placeholder="Klasör adı..." maxlength="40" />
            <div class="vv2-folder-create-actions">
              <button class="vv2-btn-ghost-sm" id="vv2-folder-create-cancel" type="button">İptal</button>
              <button class="vv2-btn-primary-sm" id="vv2-folder-create-confirm" type="button">Oluştur</button>
            </div>
          </div>
        </div>

      </div>

      <div id="vv2-summary-section">
        <div class="vv2-label">Yapay Zeka Çıktısı</div>
        <div id="vv2-summary-content">
          <button class="vv2-btn-primary" id="vv2-gen-btn">Özet Oluştur</button>
        </div>
      </div>

      <div>
        <div class="vv2-label">Notlarım</div>
        <textarea class="vv2-textarea" id="vv2-note" rows="3"
          placeholder="Bu videoda şunu anlattı...">${escHtml(existing ? (existing.note || '') : '')}</textarea>
      </div>

      <div>
        <div class="vv2-label">Puan</div>
        <div class="vv2-rating-row">
          <div class="vv2-stars" id="vv2-stars"></div>
          <div class="vv2-rating-val" id="vv2-rating-val">—/10</div>
        </div>
      </div>
    </div>
    <div class="vv2-footer">
      <button class="vv2-btn-ghost" id="vv2-cancel-btn">İptal</button>
      <button class="vv2-btn-primary" id="vv2-save-btn" style="flex:1;">Arşivle</button>
    </div>`;
}

// ── Markdown renderer ──
function renderMarkdown(text) {
  const container = document.createElement('div');
  const lines = (text || '').split('\n');
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i]; const trimmed = raw.trim();
    if (!trimmed) { i++; continue; }
    if (trimmed === '---') { const hr=document.createElement('hr'); hr.style.cssText='border:none;border-top:1px solid var(--vv-border);margin:10px 0;'; container.appendChild(hr); i++; continue; }
    if (trimmed.startsWith('#')) { const h=document.createElement('div'); h.className='vv2-md-heading'; h.textContent=trimmed.replace(/^#+\s*/,''); container.appendChild(h); i++; continue; }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const ul=document.createElement('ul'); ul.className='vv2-md-list';
      while(i<lines.length&&(lines[i].trim().startsWith('- ')||lines[i].trim().startsWith('* '))){
        const li=document.createElement('li'); li.innerHTML=inlineFormat(lines[i].trim().replace(/^[-*]\s+/,'')); ul.appendChild(li); i++;
      }
      container.appendChild(ul); continue;
    }
    const p=document.createElement('p'); p.className='vv2-md-para'; p.innerHTML=inlineFormat(trimmed); container.appendChild(p); i++;
  }
  return container;
}

function inlineFormat(text) {
  let t = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t = t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  t = t.replace(/(⚠️?\s*(?:Dikkat|dikkat)\s*:)/g,'<span class="vv2-badge vv2-badge-warn">$1</span>');
  t = t.replace(/(🔴\s*(?:Kritik Nokta|Kritik nokta|KRİTİK)\s*:?)/g,'<span class="vv2-badge vv2-badge-crit">$1</span>');
  t = t.replace(/(🔁\s*(?:Sık Karıştırılır|Sık karıştırılır)\s*:?)/g,'<span class="vv2-badge vv2-badge-info">$1</span>');
  return t;
}

// ── Summary block renderer ──
function createSummaryBlock(label, text, openByDefault) {
  const block = document.createElement('div');
  block.className = 'vv2-summary-block' + (openByDefault ? ' open' : '');
  const hdr = document.createElement('div');
  hdr.className = 'vv2-summary-block-header';
  hdr.innerHTML = `<span class="vv2-summary-block-title">${escHtml(label)}</span><span class="vv2-expand-arrow">▾</span>`;
  const body = document.createElement('div');
  body.className = 'vv2-summary-block-body' + (openByDefault ? ' open' : '');
  body.appendChild(renderMarkdown(text));
  hdr.addEventListener('click', () => { block.classList.toggle('open'); body.classList.toggle('open'); });
  block.appendChild(hdr); block.appendChild(body);
  return block;
}

// ── Loading / Error states ──
function showLoadingState(msg, sub) {
  const el = document.getElementById('vv2-summary-content');
  if (!el) return;
  el.innerHTML = `
    <div class="vv2-loading-row">
      <div class="vv2-spinner"></div>
      <div>
        <div class="vv2-loading-text" id="vv2-loading-text">${escHtml(msg)}</div>
        ${sub ? `<div class="vv2-loading-sub" id="vv2-loading-sub">${escHtml(sub)}</div>` : ''}
      </div>
    </div>
    <div class="vv2-progress-bar"><div class="vv2-progress-fill" id="vv2-progress-fill"></div></div>`;
}
function updateLoadingText(msg, sub) {
  const el = document.getElementById('vv2-loading-text');
  const subEl = document.getElementById('vv2-loading-sub');
  if (el) el.textContent = msg;
  if (subEl && sub) subEl.textContent = sub;
}
function setProgress(pct) {
  const fill = document.getElementById('vv2-progress-fill');
  if (fill) fill.style.width = pct + '%';
}
function showErrorState(msg) {
  const el = document.getElementById('vv2-summary-content');
  if (!el) return;
  el.innerHTML = '';
  const err = document.createElement('div'); err.className = 'vv2-err'; err.textContent = '⚠ ' + msg;
  el.appendChild(err);
  const btn = document.createElement('button'); btn.className = 'vv2-btn-primary'; btn.style.marginTop='8px'; btn.textContent='↻ Tekrar Dene';
  btn.addEventListener('click', startGenerate);
  el.appendChild(btn);
}

// ── Block size state ──
let selectedBlock = 5;
function wireBlockBtns() {
  document.querySelectorAll('.vv2-block-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedBlock = parseInt(btn.dataset.block, 10);
      document.querySelectorAll('.vv2-block-btn').forEach(b => b.classList.toggle('active', b.dataset.block === btn.dataset.block));
    });
  });
  // Read initial
  const activeBtn = document.querySelector('.vv2-block-btn.active');
  if (activeBtn) selectedBlock = parseInt(activeBtn.dataset.block, 10);
}

function wireTimeBlockedToggle() {
  const cb = document.getElementById('cb-time');
  const opt = document.getElementById('block-size-option');
  if (!cb || !opt) return;
  const update = () => opt.classList.toggle('visible', cb.checked);
  cb.addEventListener('change', update);
  update();
}

// ── Inline folder creation ──
function wireFolderCreate() {
  const createBtn  = document.getElementById('vv2-folder-create-btn');
  const createForm = document.getElementById('vv2-folder-create-form');
  const nameInput  = document.getElementById('vv2-folder-name-input');
  const cancelBtn  = document.getElementById('vv2-folder-create-cancel');
  const confirmBtn = document.getElementById('vv2-folder-create-confirm');
  const folderSel  = document.getElementById('folder-select');
  if (!createBtn) return;

  createBtn.addEventListener('click', () => {
    createForm.style.display = 'block';
    createBtn.style.display  = 'none';
    setTimeout(() => nameInput?.focus(), 40);
  });

  function hideForm() {
    createForm.style.display = 'none';
    createBtn.style.display  = '';
    if (nameInput) nameInput.value = '';
  }
  cancelBtn?.addEventListener('click', hideForm);

  async function doCreate() {
    const name = nameInput?.value.trim();
    if (!name) return;
    const fid    = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const folder = { id: fid, name, createdAt: Date.now(), updatedAt: Date.now() };
    const current = await getFolders();
    current.push(folder);
    await chrome.storage.local.set({ folders: current });
    if (folderSel) {
      const opt = document.createElement('option');
      opt.value = fid; opt.textContent = name; opt.selected = true;
      folderSel.appendChild(opt);
    }
    hideForm();
  }
  confirmBtn?.addEventListener('click', doCreate);
  nameInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter')  doCreate();
    if (e.key === 'Escape') hideForm();
  });
}

// ── Wire panel buttons ──
function wirePanel(videoId, title, channel, url, thumb, duration, existing) {
  const panel = document.getElementById('vv2-panel');
  if (panel) {
    panel.dataset.vid      = videoId;
    panel.dataset.title    = title;
    panel.dataset.channel  = channel;
    panel.dataset.url      = url;
    panel.dataset.thumb    = thumb;
    panel.dataset.duration = String(duration);
  }

  document.getElementById('vv2-close')?.addEventListener('click', closePanel);
  document.getElementById('vv2-cancel-btn')?.addEventListener('click', closePanel);
  document.getElementById('vv2-gen-btn')?.addEventListener('click', startGenerate);

  wireBlockBtns();
  wireTimeBlockedToggle();
  wireFolderCreate();

  // Show results from session cache (panel was closed without archiving)
  const sessionCached = summaryCache[videoId];
  if (sessionCached && Object.keys(sessionCached.summaryResults).length) {
    showExistingResults(sessionCached.summaryResults, sessionCached.importantMoments);
  } else if (existing) {
    // Show previously archived results
    const sr = existing.summaryResults || {};
    if (existing.summary && !Object.keys(sr).length) {
      showExistingResults({ detailed: existing.summary }, existing.importantMoments);
    } else if (Object.keys(sr).length) {
      showExistingResults(sr, existing.importantMoments);
    }
  }
  if (existing) {
    if (existing.note) {
      const noteEl = document.getElementById('vv2-note');
      if (noteEl && !noteEl.value) noteEl.value = existing.note;
    }
    const saveBtn = document.getElementById('vv2-save-btn');
    if (saveBtn) saveBtn.textContent = '💾 Güncelle';
  }

  buildStars(currentRating);
  wireSaveButton({ videoId, title, channel, url, thumb, duration });
}

function showExistingResults(sr, moments) {
  const el = document.getElementById('vv2-summary-content');
  if (!el) return;
  el.innerHTML = '';
  const LABELS = { short: 'Kısa Özet', detailed: 'Detaylı Özet', report: 'Profesyonel Rapor', timeBlocked: 'Zaman Bloklu Özet' };
  const keys = Object.keys(sr).filter(k => sr[k]);
  keys.forEach((key, idx) => {
    el.appendChild(createSummaryBlock(LABELS[key] || key, sr[key], idx === 0));
  });
  if (moments) showMomentsBlock(moments);
  const regenBtn = document.createElement('button');
  regenBtn.className = 'vv2-regen';
  regenBtn.textContent = 'Yeniden oluştur';
  regenBtn.addEventListener('click', startGenerate);
  el.appendChild(regenBtn);
}

function showMomentsBlock(moments) {
  const el = document.getElementById('vv2-summary-content');
  if (!el) return;
  const block = createSummaryBlock('Önemli Anlar', '', false);
  const body = block.querySelector('.vv2-summary-block-body');
  body.innerHTML = ''; // Clear placeholder from renderMarkdown('')

  if (moments.raw) {
    body.appendChild(renderMarkdown(moments.raw));
  } else {
    const sections = [
      { key: 'criticalMoments', label: 'Kritik Anlar' },
      { key: 'examPoints',      label: 'Sınavlık Noktalar' },
      { key: 'actionItems',     label: 'Aksiyon Önerileri' },
    ];
    sections.forEach(({ key, label }) => {
      const items = moments[key];
      if (!items || !items.length) return;
      const h = document.createElement('div');
      h.style.cssText = 'font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--vv-accent);margin:12px 0 6px;';
      h.textContent = label;
      body.appendChild(h);
      items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'vv2-moment-item';
        card.innerHTML = `
          ${item.timestamp ? `<span class="vv2-moment-ts">⏱ ${escHtml(item.timestamp)}</span>` : ''}
          <div class="vv2-moment-title">${escHtml(item.title||'')}</div>
          <div class="vv2-moment-desc">${escHtml(item.description||'')}</div>
          ${item.reason ? `<div style="font-size:11px;color:var(--vv-accent);margin-top:3px;font-style:italic;">› ${escHtml(item.reason)}</div>` : ''}`;
        body.appendChild(card);
      });
    });
  }

  el.appendChild(block);
}

// ── Main generate flow ──
async function startGenerate() {
  const panel = document.getElementById('vv2-panel');
  if (!panel) return;

  const videoId  = panel.dataset.vid;
  const title    = panel.dataset.title;
  const channel  = panel.dataset.channel;
  const duration = parseInt(panel.dataset.duration || '0', 10);

  // Collect selected types
  const selectedTypes = [];
  ['short','detailed','report','timeBlocked'].forEach(type => {
    const cb = document.getElementById('cb-' + (type==='timeBlocked'?'time':type));
    if (cb && cb.checked) selectedTypes.push(type);
  });
  const doMoments = document.getElementById('cb-moments')?.checked || false;

  if (!selectedTypes.length && !doMoments) {
    showErrorState('En az bir özet türü seç.');
    return;
  }

  const lang     = document.getElementById('lang-select')?.value || 'tr';
  const blockMin = selectedBlock || 5;

  const totalSteps = selectedTypes.length + (doMoments ? 1 : 0);
  let completedSteps = 0;

  showLoadingState('Transkript alınıyor...', 'Lütfen bekle...');
  setProgress(5);

  let transcript = null;
  try {
    transcript = await fetchTranscript();
  } catch (_) {}

  setProgress(15);

  if (!transcript) {
    const el = document.getElementById('vv2-summary-content');
    const warn = document.createElement('div');
    warn.className = 'vv2-warn';
    warn.textContent = '⚠ Transkript bulunamadı — başlığa göre tahmini özet oluşturulacak.';
    if (el && el.firstChild) el.insertBefore(warn, el.firstChild);
  }

  const apiKey = await getApiKey();
  if (!apiKey) { showErrorState('API Key girilmemiş. Extension ikonuna tıkla ve kaydet.'); return; }

  // Clear content and start fresh
  const contentEl = document.getElementById('vv2-summary-content');
  if (contentEl) contentEl.innerHTML = '';
  summaryResults   = {};
  importantMoments = null;

  // Build prompts map
  const prompts = {
    short:       () => buildShortPrompt(title, channel, transcript, lang),
    detailed:    () => buildDetailedPrompt(title, channel, transcript, lang),
    report:      () => buildReportPrompt(title, channel, transcript, lang),
    timeBlocked: () => buildTimeBlockedPrompt(title, channel, transcript, lang, blockMin, duration),
  };
  const LABELS = { short: 'Kısa Özet', detailed: 'Detaylı Özet', report: 'Profesyonel Rapor', timeBlocked: 'Zaman Bloklu Özet' };

  // Add loading placeholder
  if (contentEl) {
    const loadDiv = document.createElement('div');
    loadDiv.id = 'vv2-inline-loading';
    loadDiv.className = 'vv2-loading-row';
    loadDiv.innerHTML = `<div class="vv2-spinner"></div><div>
      <div class="vv2-loading-text" id="vv2-loading-text">Özet oluşturuluyor...</div>
      <div class="vv2-loading-sub" id="vv2-loading-sub"></div>
    </div>`;
    contentEl.appendChild(loadDiv);
    const pb = document.createElement('div');
    pb.className = 'vv2-progress-bar';
    pb.innerHTML = '<div class="vv2-progress-fill" id="vv2-progress-fill"></div>';
    contentEl.appendChild(pb);
  }

  let hasError = false;

  // Process each selected type sequentially
  for (const type of selectedTypes) {
    updateLoadingText(LABELS[type] + ' oluşturuluyor...', `${completedSteps+1}/${totalSteps}`);
    setProgress(15 + ((completedSteps / totalSteps) * 75));
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'GROK_SUMMARY',
        apiKey,
        prompt: prompts[type](),
        maxTokens: type === 'report' ? 6000 : 4096,
      });
      if (!result || result.error) throw new Error(result?.error || 'Yanıt alınamadı');
      summaryResults[type] = result.text;
    } catch (e) {
      summaryResults[type] = `⚠ Hata: ${e.message}`;
      hasError = true;
    }
    completedSteps++;
    setProgress(15 + ((completedSteps / totalSteps) * 75));
  }

  // Important moments
  if (doMoments) {
    updateLoadingText('Önemli anlar analiz ediliyor...', `${completedSteps+1}/${totalSteps}`);
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'GROK_SUMMARY',
        apiKey,
        prompt: buildImportantMomentsPrompt(title, channel, transcript, lang, duration),
        maxTokens: 3000,
      });
      if (!result || result.error) throw new Error(result?.error || 'Yanıt alınamadı');
      // Parse JSON moments
      try {
        const jsonStr = result.text.replace(/```json\n?/g,'').replace(/```/g,'').trim();
        importantMoments = JSON.parse(jsonStr);
      } catch (_) {
        // Fallback: store as raw markdown text
        importantMoments = { raw: result.text };
      }
    } catch (e) {
      importantMoments = { raw: `⚠ Hata: ${e.message}` };
    }
    completedSteps++;
  }

  setProgress(100);

  // Remove loading indicator
  const loadingDiv = document.getElementById('vv2-inline-loading');
  const progressBar = contentEl?.querySelector('.vv2-progress-bar');
  loadingDiv?.remove();
  progressBar?.remove();

  // Render results
  if (!contentEl) return;
  const keys = Object.keys(summaryResults).filter(k => summaryResults[k]);
  keys.forEach((key, idx) => {
    contentEl.appendChild(createSummaryBlock(LABELS[key] || key, summaryResults[key], idx === 0));
  });
  if (importantMoments) showMomentsBlock(importantMoments);

  if (keys.length > 0 || importantMoments) {
    const regenBtn = document.createElement('button');
    regenBtn.className = 'vv2-regen';
    regenBtn.textContent = 'Yeniden oluştur';
    regenBtn.addEventListener('click', startGenerate);
    contentEl.appendChild(regenBtn);

    // Cache results for this video so panel close/reopen doesn't lose them
    summaryCache[videoId] = {
      summaryResults: { ...summaryResults },
      importantMoments: importantMoments,
    };
  } else if (hasError) {
    showErrorState('Özet oluşturulamadı. Tekrar dene.');
  }
}

// ── Stars ──
function buildStars(val) {
  const container = document.getElementById('vv2-stars');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const s = document.createElement('span');
    s.className = 'vv2-star' + (i <= val ? ' on' : '');
    s.textContent = '★';
    s.addEventListener('click', () => { currentRating = i; buildStars(i); const v=document.getElementById('vv2-rating-val'); if(v)v.textContent=i+'/10'; });
    s.addEventListener('mouseover', () => { document.querySelectorAll('.vv2-star').forEach((x,idx)=>{ x.style.color=idx<i?'var(--vv-accent)':'var(--vv-star-empty)'; }); const v=document.getElementById('vv2-rating-val'); if(v)v.textContent=i+'/10'; });
    s.addEventListener('mouseout', () => buildStars(currentRating));
    container.appendChild(s);
  }
  const valEl = document.getElementById('vv2-rating-val');
  if (valEl) valEl.textContent = val ? val+'/10' : '—/10';
}

// ── Save button ──
function wireSaveButton({ videoId, title, channel, url, thumb, duration }) {
  const btn = document.getElementById('vv2-save-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const spinner = document.createElement('div');
    spinner.className = 'vv2-spinner';
    spinner.style.cssText = 'border-color:rgba(12,12,16,0.3);border-top-color:#0C0C10;';
    btn.innerHTML = ''; btn.appendChild(spinner); btn.append(' Kaydediliyor...');

    try {
      const note     = (document.getElementById('vv2-note')?.value || '').trim();
      const folderId = document.getElementById('folder-select')?.value || null;
      const lang     = document.getElementById('lang-select')?.value || 'tr';

      // Collect selected types for metadata
      const selectedTypes = [];
      ['short','detailed','report','timeBlocked'].forEach(type => {
        const cb = document.getElementById('cb-' + (type==='timeBlocked'?'time':type));
        if (cb && cb.checked) selectedTypes.push(type);
      });

      const archive = await getArchive();
      const idx     = archive.findIndex(v => v.videoId === videoId);
      const entry   = {
        videoId, title, channel, url,
        thumbnail: thumb, duration,
        // Summary data
        summary:        Object.values(summaryResults)[0] || '',  // legacy compat
        summaryTypes:   selectedTypes,
        summaryResults: { ...summaryResults },
        importantMoments: importantMoments,
        // Metadata
        note, rating: currentRating,
        folderId: folderId || null,
        selectedOutputLanguage: lang,
        blockSizePreference: selectedBlock,
        savedAt:   (idx >= 0 ? archive[idx].savedAt : null) || Date.now(),
        updatedAt: Date.now(),
      };

      if (idx >= 0) archive[idx] = entry;
      else archive.unshift(entry);
      await saveArchiveData(archive);

      // Success UI
      const body   = document.getElementById('vv2-body');
      const footer = document.querySelector('#vv2-panel .vv2-footer');
      if (!body || !footer) return;

      body.innerHTML = `
        <div class="vv2-success">
          <div class="vv2-success-icon">✓</div>
          <div class="vv2-success-title">Arşivlendi</div>
          <div class="vv2-success-sub">${escHtml(title.length>50?title.substring(0,50)+'...':title)}<br>kütüphanene eklendi.</div>
        </div>`;

      footer.innerHTML = '';
      const closeBtn = document.createElement('button');
      closeBtn.className = 'vv2-btn-ghost'; closeBtn.textContent = 'Kapat';
      closeBtn.addEventListener('click', closePanel);
      const libBtn = document.createElement('button');
      libBtn.className = 'vv2-btn-primary'; libBtn.style.flex = '1'; libBtn.textContent = 'Kütüphaneyi Aç';
      libBtn.addEventListener('click', () => { chrome.runtime.sendMessage({ type:'OPEN_LIBRARY' }); closePanel(); });
      footer.appendChild(closeBtn); footer.appendChild(libBtn);

    } catch (e) {
      btn.disabled = false; btn.textContent = 'Hata — tekrar dene';
    }
  });
}

// ── Panel open ──
async function openPanel() {
  if (panelOpen) return;
  panelOpen = true;

  const videoId  = getVideoId();
  const title    = getVideoTitle();
  const channel  = getChannelName();
  const duration = getDuration();
  const thumb    = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  const url      = window.location.href;

  const [archive, folders, settings] = await Promise.all([getArchive(), getFolders(), getSettings()]);
  const existing = archive.find(v => v.videoId === videoId);

  // Restore from session cache first (survives panel close/reopen without archiving)
  const cached = summaryCache[videoId];
  if (cached) {
    summaryResults   = cached.summaryResults;
    importantMoments = cached.importantMoments;
    currentRating    = currentRating || (existing ? existing.rating || 0 : 0);
  } else if (existing) {
    currentRating    = existing.rating  || 0;
    summaryResults   = existing.summaryResults || (existing.summary ? { detailed: existing.summary } : {});
    importantMoments = existing.importantMoments || null;
  } else {
    currentRating    = 0;
    summaryResults   = {};
    importantMoments = null;
  }

  // Apply theme to button
  const theme = settings.selectedTheme || 'amber';
  const archiveBtn = document.getElementById('vv2-btn');
  if (archiveBtn) {
    archiveBtn.classList.toggle('mono-theme', theme === 'mono');
  }

  const backdrop = document.createElement('div');
  backdrop.id = 'vv2-backdrop';
  backdrop.addEventListener('click', closePanel);

  const panel = document.createElement('div');
  panel.id = 'vv2-panel';
  panel.className = `theme-${theme}`;
  panel.innerHTML = buildPanelHTML({ title, channel, duration, thumb, existing, settings, folders });

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  wirePanel(videoId, title, channel, url, thumb, duration, existing);
}

function closePanel() {
  panelOpen = false;
  document.getElementById('vv2-panel')?.remove();
  document.getElementById('vv2-backdrop')?.remove();
}

// ── Inject archive button ──
function injectButton() {
  if (document.getElementById('vv2-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'vv2-btn';
  btn.innerHTML = '<span class="vv2-btn-icon">▣</span><span class="vv2-btn-label">Arşivle</span>';
  btn.addEventListener('click', openPanel);
  document.body.appendChild(btn);
}
function removeButton() { document.getElementById('vv2-btn')?.remove(); }

// ── Navigation ──
function onNavigate() {
  const vid = getVideoId();
  if (vid && vid !== currentVideoId) {
    // Clean up old video's cache to free memory (keep only last 5 videos)
    const cacheKeys = Object.keys(summaryCache);
    if (cacheKeys.length > 5) delete summaryCache[cacheKeys[0]];
    currentVideoId = vid;
    closePanel();
    setTimeout(injectButton, 1000);
  } else if (!vid) {
    removeButton(); closePanel();
  }
}

// ── Boot ──
injectStyles();
injectCaptionMonitor();
if (getVideoId()) {
  currentVideoId = getVideoId();
  setTimeout(injectButton, 1500);
}

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(onNavigate, 800);
  }
}).observe(document.body, { childList: true, subtree: true });

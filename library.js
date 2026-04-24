// library.js — youLIB v2

// ── State ──
let archive      = [];
let folders      = [];
let settings     = {};
let visualNotes  = {};  // { [videoId]: [{id, timestamp, imageData, noteText, capturedAt}] }

let currentSort       = 'newest';
let currentFilter     = 'all';
let currentFolderId   = 'all';  // 'all' | 'uncategorized' | folder.id
let searchQuery       = '';
let modalVideoId      = null;
let modalRating       = 0;
let folderModalMode   = null;   // 'create' | 'rename'
let folderModalTarget = null;   // folder id when renaming

// ── DOM refs ──
const grid          = document.getElementById('video-grid');
const emptyState    = document.getElementById('empty-state');
const emptyTitle    = document.getElementById('empty-title');
const emptySub      = document.getElementById('empty-sub');
const searchInput   = document.getElementById('search-input');
const ratingFilter  = document.getElementById('rating-filter');
const statTotal     = document.getElementById('stat-total');
const statAvg       = document.getElementById('stat-avg');
const statHigh      = document.getElementById('stat-high');
const statTime      = document.getElementById('stat-time');
const modalOverlay  = document.getElementById('vv-modal');
const modalPanel    = document.getElementById('vv-modal-panel');
const folderModal   = document.getElementById('folder-modal');
const folderList    = document.getElementById('folder-list');
const folderInput   = document.getElementById('folder-modal-input');
const topbarTitle   = document.getElementById('topbar-title');
const topbarSub     = document.getElementById('topbar-subtitle');
const viewCount     = document.getElementById('view-count');

// ── Migration ──
function migrateArchive(raw) {
  // Ensure every entry has v2 fields
  return (raw || []).map(v => ({
    // Keep all existing fields
    ...v,
    // New v2 fields with defaults
    folderId:              v.folderId              || null,
    summaryTypes:          v.summaryTypes          || (v.summary ? ['detailed'] : []),
    summaryResults:        v.summaryResults        || (v.summary ? { detailed: v.summary } : {}),
    importantMoments:      v.importantMoments      || null,
    selectedOutputLanguage: v.selectedOutputLanguage || 'tr',
    updatedAt:             v.updatedAt             || v.savedAt || Date.now(),
  }));
}

// ── Helpers ──
function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}s ${m}d` : `${m}d`;
}
function fmtTotalTime(totalSec) {
  if (!totalSec) return '0d';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h >= 24) return `${Math.floor(h/24)}g ${h%24}s`;
  if (h > 0)   return `${h}s ${m}d`;
  return `${m}d`;
}
function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function uid() {
  return 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
function fmtLibTime(sec) {
  const s  = Math.round(sec || 0);
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    : `${m}:${String(ss).padStart(2,'0')}`;
}
function openLibLightbox(note) {
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'position:absolute;top:14px;right:18px;background:none;border:none;color:rgba(255,255,255,.5);font-size:30px;cursor:pointer;line-height:1;padding:4px;transition:color .15s;z-index:2;';
  closeBtn.addEventListener('mouseover',  () => { closeBtn.style.color = '#fff'; });
  closeBtn.addEventListener('mouseout',   () => { closeBtn.style.color = 'rgba(255,255,255,.5)'; });
  closeBtn.addEventListener('click', () => lb.remove());

  const stage = document.createElement('div');
  stage.style.cssText = 'flex:1 1 auto;width:100%;display:flex;align-items:center;justify-content:center;overflow:auto;max-height:calc(100vh - 120px);';

  const img = document.createElement('img');
  img.src = note.imageData;
  img.alt = 'Görsel not';
  img.title = 'Zoom için tıkla';
  const fitCss  = 'max-width:96vw;max-height:88vh;border-radius:6px;box-shadow:0 8px 48px rgba(0,0,0,.8);object-fit:contain;cursor:zoom-in;';
  const zoomCss = 'max-width:none;max-height:none;width:auto;height:auto;border-radius:6px;box-shadow:0 8px 48px rgba(0,0,0,.8);cursor:zoom-out;';
  img.style.cssText = fitCss;
  let zoomed = false;
  img.addEventListener('click', (e) => {
    e.stopPropagation();
    zoomed = !zoomed;
    img.style.cssText = zoomed ? zoomCss : fitCss;
    stage.style.alignItems     = zoomed ? 'flex-start' : 'center';
    stage.style.justifyContent = zoomed ? 'flex-start' : 'center';
  });
  stage.appendChild(img);

  const meta = document.createElement('div');
  meta.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;max-width:min(92vw,750px);flex-shrink:0;';

  if (note.timestamp > 0) {
    const ts = document.createElement('span');
    ts.textContent = fmtLibTime(note.timestamp);
    ts.style.cssText = 'background:rgba(255,255,255,.14);color:rgba(255,255,255,.9);font-size:12px;padding:3px 12px;border-radius:20px;letter-spacing:.04em;';
    meta.appendChild(ts);
  }

  if (note.noteText) {
    const p = document.createElement('p');
    p.textContent = note.noteText;
    p.style.cssText = 'color:rgba(255,255,255,.8);font-size:13px;text-align:center;line-height:1.65;margin:0;';
    meta.appendChild(p);
  }

  lb.appendChild(closeBtn);
  lb.appendChild(stage);
  lb.appendChild(meta);
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) lb.remove(); });
  const onKey = (e) => { if (e.key === 'Escape') { lb.remove(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
  document.body.appendChild(lb);
}
function getFolderName(folderId) {
  if (!folderId) return 'Kategorisiz';
  const f = folders.find(x => x.id === folderId);
  return f ? f.name : 'Kategorisiz';
}

// ── Theme ──
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'amber');
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === (theme || 'amber'));
  });
}
async function setTheme(theme) {
  settings.selectedTheme = theme;
  await chrome.storage.local.set({ settings });
  applyTheme(theme);
}
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});

// ── Storage ──
async function persist() {
  await chrome.storage.local.set({ archive, folders, settings });
}
async function persistVisualNotes() {
  await chrome.storage.local.set({ visualNotes });
}

// ── Stats ──
function updateStats() {
  const rated    = archive.filter(v => v.rating > 0);
  const avg      = rated.length ? (rated.reduce((s,v) => s + v.rating, 0) / rated.length).toFixed(1) : '—';
  const totalSec = archive.reduce((s,v) => s + (v.duration || 0), 0);
  statTotal.textContent = archive.length;
  statAvg.textContent   = avg;
  statHigh.textContent  = archive.filter(v => v.rating >= 8).length;
  statTime.textContent  = fmtTotalTime(totalSec);
}

// ── Folder sidebar ──
function countInFolder(folderId) {
  if (folderId === 'all')          return archive.length;
  if (folderId === 'uncategorized') return archive.filter(v => !v.folderId).length;
  return archive.filter(v => v.folderId === folderId).length;
}

function renderFolderSidebar() {
  // Update built-in counts
  document.getElementById('count-all').textContent   = countInFolder('all');
  document.getElementById('count-uncat').textContent = countInFolder('uncategorized');

  // Mark active on built-in items
  document.querySelectorAll('[data-folder-id]').forEach(el => {
    el.classList.toggle('active', el.dataset.folderId === currentFolderId);
  });

  // Render custom folders
  folderList.innerHTML = '';
  folders.forEach(f => {
    const cnt  = countInFolder(f.id);
    const item = document.createElement('div');
    item.className = 'folder-item' + (currentFolderId === f.id ? ' active' : '');
    item.dataset.folderId = f.id;
    item.innerHTML = `
      <span class="folder-icon">▷</span>
      <span class="folder-name" title="${esc(f.name)}">${esc(f.name)}</span>
      <span class="folder-count">${cnt}</span>
      <div class="folder-actions">
        <button class="folder-action-btn" data-action="rename-folder" data-fid="${esc(f.id)}" title="Yeniden adlandır">↩</button>
        <button class="folder-action-btn" data-action="delete-folder" data-fid="${esc(f.id)}" title="Sil">✕</button>
      </div>`;
    folderList.appendChild(item);
  });
}

// ── Folder selection (sidebar click delegation) ──
document.querySelector('.sidebar').addEventListener('click', (e) => {
  // Folder action buttons
  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn) {
    e.stopPropagation();
    const action = actionBtn.dataset.action;
    const fid    = actionBtn.dataset.fid;
    if (action === 'rename-folder') openFolderModal('rename', fid);
    if (action === 'delete-folder') deleteFolder(fid);
    return;
  }
  // Folder nav item
  const folderItem = e.target.closest('[data-folder-id]');
  if (folderItem) {
    currentFolderId = folderItem.dataset.folderId;
    updateTopbar();
    renderFolderSidebar();
    render();
  }
});

document.getElementById('btn-add-folder').addEventListener('click', () => openFolderModal('create'));

// ── Topbar ──
function updateTopbar() {
  if (currentFolderId === 'all') {
    topbarTitle.textContent = 'Tüm Videolar';
    topbarSub.textContent = '';
  } else if (currentFolderId === 'uncategorized') {
    topbarTitle.textContent = 'Kategorisiz';
    topbarSub.textContent = 'Klasöre atanmamış videolar';
  } else {
    const f = folders.find(x => x.id === currentFolderId);
    topbarTitle.textContent = f ? f.name : 'Klasör';
    topbarSub.textContent = 'Klasör';
  }
}

// ── Folder Modal ──
function openFolderModal(mode, fid = null) {
  folderModalMode   = mode;
  folderModalTarget = fid;
  const titleEl = document.getElementById('folder-modal-title');
  const confirmBtn = document.getElementById('folder-modal-confirm');
  if (mode === 'create') {
    titleEl.textContent = 'Yeni Klasör';
    confirmBtn.textContent = 'Oluştur';
    folderInput.value = '';
  } else {
    const f = folders.find(x => x.id === fid);
    titleEl.textContent = 'Klasörü Yeniden Adlandır';
    confirmBtn.textContent = 'Kaydet';
    folderInput.value = f ? f.name : '';
  }
  folderModal.classList.add('open');
  setTimeout(() => folderInput.focus(), 50);
}
function closeFolderModal() {
  folderModal.classList.remove('open');
  folderModalMode = null;
  folderModalTarget = null;
}

document.getElementById('folder-modal-cancel').addEventListener('click', closeFolderModal);
document.getElementById('folder-modal-confirm').addEventListener('click', confirmFolderModal);
folderInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmFolderModal(); });
folderModal.addEventListener('click', (e) => { if (e.target === folderModal) closeFolderModal(); });

async function confirmFolderModal() {
  const name = folderInput.value.trim();
  if (!name) return;
  if (folderModalMode === 'create') {
    const f = { id: uid(), name, createdAt: Date.now(), updatedAt: Date.now() };
    folders.push(f);
  } else if (folderModalMode === 'rename' && folderModalTarget) {
    const f = folders.find(x => x.id === folderModalTarget);
    if (f) { f.name = name; f.updatedAt = Date.now(); }
  }
  await persist();
  closeFolderModal();
  renderFolderSidebar();
  render();
}

async function deleteFolder(fid) {
  if (!confirm('Bu klasörü silmek istediğine emin misin? Videolar kategorisiz kalacak.')) return;
  // Un-assign videos in this folder
  archive.forEach(v => { if (v.folderId === fid) v.folderId = null; });
  folders = folders.filter(x => x.id !== fid);
  if (currentFolderId === fid) currentFolderId = 'all';
  await persist();
  updateTopbar();
  renderFolderSidebar();
  render();
  updateStats();
}

// ── Filter & Sort ──
function getFiltered() {
  let items = [...archive];

  // Folder filter
  if (currentFolderId === 'uncategorized') {
    items = items.filter(v => !v.folderId);
  } else if (currentFolderId !== 'all') {
    items = items.filter(v => v.folderId === currentFolderId);
  }

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(v =>
      (v.title   || '').toLowerCase().includes(q) ||
      (v.channel || '').toLowerCase().includes(q) ||
      (v.note    || '').toLowerCase().includes(q) ||
      // Search in all summary results
      Object.values(v.summaryResults || {}).join(' ').toLowerCase().includes(q) ||
      // Legacy summary field
      (v.summary || '').toLowerCase().includes(q)
    );
  }

  // Rating filter
  if      (currentFilter === 'high') items = items.filter(v => v.rating >= 8);
  else if (currentFilter === 'mid')  items = items.filter(v => v.rating >= 5 && v.rating <= 7);
  else if (currentFilter === 'low')  items = items.filter(v => v.rating >= 1 && v.rating <= 4);
  else if (currentFilter === 'none') items = items.filter(v => !v.rating);

  // Sort
  if      (currentSort === 'newest') items.sort((a,b) => (b.savedAt||0) - (a.savedAt||0));
  else if (currentSort === 'oldest') items.sort((a,b) => (a.savedAt||0) - (b.savedAt||0));
  else if (currentSort === 'rating') items.sort((a,b) => (b.rating||0) - (a.rating||0));

  return items;
}

// ── Markdown ──
function mdInline(text) {
  let t = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(⚠️?\s*(?:Dikkat|dikkat)\s*:)/g, '<span class="vv-badge vv-badge-warn">$1</span>');
  t = t.replace(/(🔴\s*(?:Kritik Nokta|Kritik nokta|KRİTİK)\s*:?)/g, '<span class="vv-badge vv-badge-crit">$1</span>');
  t = t.replace(/(🔁\s*(?:Sık Karıştırılır|Sık karıştırılır)\s*:?)/g, '<span class="vv-badge vv-badge-info">$1</span>');
  return t;
}
function renderMarkdown(text) {
  const container = document.createElement('div');
  container.className = 'vv-md';
  const lines = (text || '').split('\n');
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed) { i++; continue; }
    if (trimmed === '---') {
      const hr = document.createElement('hr');
      hr.style.cssText = 'border:none;border-top:1px solid var(--border);margin:12px 0;';
      container.appendChild(hr); i++; continue;
    }
    if (trimmed.startsWith('#')) {
      const h = document.createElement('div');
      h.className = 'vv-md-heading';
      h.textContent = trimmed.replace(/^#+\s*/, '');
      container.appendChild(h); i++; continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const ul = document.createElement('ul');
      ul.className = 'vv-md-list';
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const li = document.createElement('li');
        li.innerHTML = mdInline(lines[i].trim().replace(/^[-*]\s+/, ''));
        ul.appendChild(li); i++;
      }
      container.appendChild(ul); continue;
    }
    const p = document.createElement('p');
    p.className = 'vv-md-para';
    p.innerHTML = mdInline(trimmed);
    container.appendChild(p); i++;
  }
  return container;
}

function stripMd(text) {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '').replace(/^---$/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/^[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

// Get the best summary text to display in card preview
function getCardSummaryText(v) {
  // Priority: short > detailed > report > legacy summary
  const sr = v.summaryResults || {};
  return sr.short || sr.detailed || sr.report || sr.timeBlocked || v.summary || '';
}

// ── Card render ──
function renderCard(v) {
  const ratingBadge = v.rating
    ? `<div class="card-rating-badge${v.rating >= 8 ? ' high' : ''}">${v.rating}/10</div>` : '';
  const durBadge = v.duration
    ? `<div class="card-duration-badge">${fmtDuration(v.duration)}</div>` : '';

  const plain = stripMd(getCardSummaryText(v));
  const summaryHtml = plain
    ? `<div class="card-summary">${esc(plain.substring(0, 220))}</div>`
    : `<div class="card-no-summary">Özet yok</div>`;

  const folderChip = v.folderId
    ? `<div class="card-folder-chip">${esc(getFolderName(v.folderId))}</div>` : '';
  const noteChip = v.note
    ? `<span class="badge badge-dim" title="Not var">Not</span>` : '';
  const momentsChip = v.importantMoments
    ? `<span class="badge badge-dim" title="Önemli Anlar">Anlar</span>` : '';

  return `
    <div class="video-card fade-up" data-card-id="${esc(v.videoId)}" data-action="open-modal" data-vid="${esc(v.videoId)}">
      <div class="card-thumb-wrap">
        <img class="card-thumb" src="${esc(v.thumbnail)}" alt="" loading="lazy"
          onerror="this.style.background='var(--bg3)';this.removeAttribute('src')" />
        ${ratingBadge}
        ${durBadge}
      </div>
      <div class="card-body">
        ${folderChip}
        <div class="card-title">${esc(v.title)}</div>
        <div class="card-channel">${esc(v.channel)}</div>
        ${summaryHtml}
        <div class="card-meta">
          <div class="card-date">${fmtDate(v.savedAt)}</div>
          <div class="card-chips">${noteChip}${momentsChip}</div>
        </div>
      </div>
    </div>`;
}

// ── Render grid ──
function render() {
  const items = getFiltered();
  viewCount.textContent = items.length ? `${items.length} video` : '';

  if (items.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    if (searchQuery) {
      emptyTitle.textContent = 'Sonuç bulunamadı';
      emptySub.textContent   = '"' + searchQuery + '" için eşleşen video yok.';
    } else if (currentFolderId === 'uncategorized') {
      emptyTitle.textContent = 'Kategorisiz video yok';
      emptySub.textContent   = 'Tüm videolar bir klasöre atanmış.';
    } else if (currentFolderId !== 'all') {
      emptyTitle.textContent = 'Bu klasör boş';
      emptySub.textContent   = 'Video arşivlerken bu klasörü seçebilirsin.';
    } else {
      emptyTitle.textContent = 'Kütüphane boş';
      emptySub.textContent   = 'YouTube\'da bir video izle ve Arşivle butonuna bas.';
    }
    return;
  }
  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  grid.innerHTML = items.map(renderCard).join('');
}

// ── Modal ──
function openModal(videoId) {
  const v = archive.find(x => x.videoId === videoId);
  if (!v) return;
  modalVideoId = videoId;
  modalRating  = v.rating || 0;
  buildModalContent(v);
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
  modalVideoId = null;
}
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalVideoId) closeModal(); });

function buildModalContent(v) {
  const vid = v.videoId;
  const sr  = v.summaryResults || {};

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'vv-modal-header';
  const folderBadge = v.folderId
    ? `<span class="vv-modal-folder-badge">${esc(getFolderName(v.folderId))}</span>` : '';
  header.innerHTML = `
    <img class="vv-modal-thumb" src="${esc(v.thumbnail)}" alt=""
      onerror="this.style.background='var(--bg3)';this.removeAttribute('src')" />
    <div class="vv-modal-info">
      <div class="vv-modal-title">${esc(v.title)}</div>
      <div class="vv-modal-channel">${esc(v.channel)}</div>
      <div class="vv-modal-meta">
        ${v.rating ? `<span class="vv-modal-rating-badge">${v.rating}/10</span>` : ''}
        ${folderBadge}
        <span class="vv-modal-date">${fmtDate(v.savedAt)}${v.duration ? ' · ' + fmtDuration(v.duration) : ''}</span>
      </div>
    </div>
    <button class="vv-modal-close" id="vv-modal-close-btn">✕</button>`;

  // ── Body ──
  const body = document.createElement('div');
  body.className = 'vv-modal-body';

  // Summary sections (collapsible per type)
  const SUMMARY_LABELS = {
    short:       'Kısa Özet',
    detailed:    'Detaylı Özet',
    report:      'Profesyonel Rapor',
    timeBlocked: 'Zaman Bloklu Özet',
  };

  // Also show legacy summary if no summaryResults
  const allSummaryKeys = Object.keys(sr).filter(k => sr[k]);
  const legacySummary  = !allSummaryKeys.length && v.summary ? v.summary : null;

  if (allSummaryKeys.length > 0 || legacySummary) {
    const summarySection = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'vv-modal-section-label';
    label.textContent = 'AI Özetleri';
    summarySection.appendChild(label);

    if (legacySummary) {
      // Backward compat: show old format
      const sec = makeSummaryBlock('Özet', legacySummary, true);
      summarySection.appendChild(sec);
    } else {
      allSummaryKeys.forEach((key, idx) => {
        const label2 = SUMMARY_LABELS[key] || key;
        const sec    = makeSummaryBlock(label2, sr[key], idx === 0);
        summarySection.appendChild(sec);
      });
    }
    body.appendChild(summarySection);
  }

  // Important Moments
  if (v.importantMoments) {
    const momSection = document.createElement('div');
    const momLabel   = document.createElement('div');
    momLabel.className = 'vv-modal-section-label';
    momLabel.textContent = 'Önemli Anlar';
    momSection.appendChild(momLabel);
    momSection.appendChild(renderImportantMoments(v.importantMoments));
    body.appendChild(momSection);
  }

  // Notes
  const noteSection = document.createElement('div');
  const noteLabel   = document.createElement('div');
  noteLabel.className = 'vv-modal-section-label';
  noteLabel.textContent = 'Notlarım';
  noteSection.appendChild(noteLabel);

  const noteDisplay = document.createElement('div');
  noteDisplay.id = `modal-note-display-${vid}`;
  noteDisplay.className = 'vv-modal-note';
  if (v.note) {
    noteDisplay.textContent = v.note;
  } else {
    noteDisplay.style.cssText = 'color:var(--cream-dim);font-style:italic;';
    noteDisplay.textContent = 'Henüz not yok';
  }
  noteSection.appendChild(noteDisplay);

  const noteEdit = document.createElement('div');
  noteEdit.id = `modal-note-edit-${vid}`;
  noteEdit.style.display = 'none';
  noteEdit.innerHTML = `<textarea id="modal-note-ta-${vid}" rows="5" style="margin-top:8px;width:100%;"
    placeholder="Notlarını buraya yaz...">${esc(v.note || '')}</textarea>`;
  noteSection.appendChild(noteEdit);
  body.appendChild(noteSection);

  // Visual Notes
  const vnList = visualNotes[vid] || [];
  if (vnList.length) {
    const vnSection = document.createElement('div');
    const vnLabel   = document.createElement('div');
    vnLabel.className = 'vv-modal-section-label';
    vnLabel.textContent = 'Görsel Notlar';
    vnSection.appendChild(vnLabel);

    const vnGrid = document.createElement('div');
    vnGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;';

    vnList.forEach(note => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;cursor:pointer;border-radius:6px;overflow:hidden;width:110px;height:70px;border:1px solid var(--border);transition:border-color .15s,transform .1s;flex-shrink:0;';

      const img = document.createElement('img');
      img.src = note.thumbData || note.imageData;   // fallback for legacy entries
      img.alt = 'Görsel not';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

      const ts = document.createElement('div');
      ts.style.cssText = 'position:absolute;bottom:3px;left:3px;background:rgba(0,0,0,0.72);color:#fff;font-size:9px;padding:1px 4px;border-radius:3px;letter-spacing:.02em;pointer-events:none;';
      ts.textContent = fmtLibTime(note.timestamp);

      const del = document.createElement('button');
      del.style.cssText = 'position:absolute;top:3px;right:3px;background:rgba(200,40,40,.88);color:#fff;border:none;border-radius:3px;width:16px;height:16px;font-size:14px;line-height:1;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;';
      del.textContent = '×';
      del.title = 'Sil';
      del.addEventListener('click', async (e) => {
        e.stopPropagation();
        visualNotes[vid] = (visualNotes[vid] || []).filter(n => n.id !== note.id);
        if (!visualNotes[vid].length) delete visualNotes[vid];
        await persistVisualNotes();
        wrap.remove();
      });

      wrap.addEventListener('mouseenter', () => { del.style.display = 'flex'; wrap.style.borderColor = 'var(--accent)'; wrap.style.transform = 'scale(1.04)'; });
      wrap.addEventListener('mouseleave', () => { del.style.display = 'none'; wrap.style.borderColor = ''; wrap.style.transform = ''; });
      wrap.addEventListener('click', () => openLibLightbox(note));

      wrap.appendChild(img);
      wrap.appendChild(ts);
      wrap.appendChild(del);
      vnGrid.appendChild(wrap);
    });

    vnSection.appendChild(vnGrid);
    body.appendChild(vnSection);
  }

  // Rating
  const ratingSection = document.createElement('div');
  const ratingLabel   = document.createElement('div');
  ratingLabel.className = 'vv-modal-section-label';
  ratingLabel.textContent = 'Puan';
  ratingSection.appendChild(ratingLabel);

  const ratingRow = document.createElement('div');
  ratingRow.className = 'vv-modal-rating-row';
  const starsDiv  = document.createElement('div');
  starsDiv.className = 'vv-modal-stars';
  starsDiv.id = `modal-stars-${vid}`;
  for (let i = 1; i <= 10; i++) {
    const s = document.createElement('span');
    s.className = 'vv-modal-star' + (i <= modalRating ? ' active' : '');
    s.textContent = '★'; s.dataset.val = i;
    starsDiv.appendChild(s);
  }
  const ratingVal = document.createElement('div');
  ratingVal.className = 'vv-modal-rating-val';
  ratingVal.id = `modal-rating-val-${vid}`;
  ratingVal.textContent = modalRating ? modalRating + '/10' : '—/10';
  ratingRow.appendChild(starsDiv);
  ratingRow.appendChild(ratingVal);
  ratingSection.appendChild(ratingRow);
  body.appendChild(ratingSection);

  // Folder assignment
  const folderSection = document.createElement('div');
  const folderLabel   = document.createElement('div');
  folderLabel.className = 'vv-modal-section-label';
  folderLabel.textContent = 'Klasör';
  folderSection.appendChild(folderLabel);

  const folderSelect = document.createElement('select');
  folderSelect.className = 'filter-select';
  folderSelect.style.width = 'auto';
  folderSelect.innerHTML = `<option value="">Kategorisiz</option>` +
    folders.map(f => `<option value="${esc(f.id)}" ${v.folderId === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('');
  folderSelect.addEventListener('change', async () => {
    const idx = archive.findIndex(x => x.videoId === vid);
    if (idx >= 0) {
      archive[idx].folderId = folderSelect.value || null;
      archive[idx].updatedAt = Date.now();
      await persist();
      renderFolderSidebar();
      render();
    }
  });
  folderSection.appendChild(folderSelect);
  body.appendChild(folderSection);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'vv-modal-actions';
  actions.innerHTML = `
    <a href="${esc(v.url)}" target="_blank" class="btn btn-ghost">YouTube'da Aç</a>
    <button class="btn btn-ghost" id="modal-btn-edit-${vid}" data-action="modal-edit-note" data-vid="${esc(vid)}">Notu Düzenle</button>
    <button class="btn btn-primary" id="modal-btn-save-note-${vid}" data-action="modal-save-note" data-vid="${esc(vid)}" style="display:none;">Kaydet</button>
    <button class="btn btn-danger" data-action="modal-delete" data-vid="${esc(vid)}">Sil</button>`;
  body.appendChild(actions);

  // Assemble
  modalPanel.innerHTML = '';
  modalPanel.appendChild(header);
  modalPanel.appendChild(body);
  modalPanel.scrollTop = 0;

  // Close
  document.getElementById('vv-modal-close-btn').addEventListener('click', closeModal);

  // Stars
  starsDiv.addEventListener('mouseover', (e) => {
    const s = e.target.closest('.vv-modal-star');
    if (!s) return;
    const val = parseInt(s.dataset.val, 10);
    starsDiv.querySelectorAll('.vv-modal-star').forEach((x, i) => {
      x.style.color = i < val ? 'var(--accent)' : 'var(--star-empty)';
    });
    ratingVal.textContent = val + '/10';
  });
  starsDiv.addEventListener('mouseout', () => {
    starsDiv.querySelectorAll('.vv-modal-star').forEach((x, i) => {
      x.style.color = ''; x.classList.toggle('active', i < modalRating);
    });
    ratingVal.textContent = modalRating ? modalRating + '/10' : '—/10';
  });
  starsDiv.addEventListener('click', async (e) => {
    const s = e.target.closest('.vv-modal-star');
    if (!s) return;
    const val = parseInt(s.dataset.val, 10);
    modalRating = val;
    await setRating(vid, val);
    starsDiv.querySelectorAll('.vv-modal-star').forEach((x, i) => {
      x.classList.toggle('active', i < val); x.style.color = '';
    });
    ratingVal.textContent = val + '/10';
  });
}

function makeSummaryBlock(label, text, openByDefault) {
  const sec = document.createElement('div');
  sec.className = 'modal-summary-section' + (openByDefault ? ' open' : '');
  const hdr = document.createElement('div');
  hdr.className = 'modal-summary-section-header';
  hdr.innerHTML = `<span class="modal-summary-section-header-title">${esc(label)}</span>
    <span class="expand-arrow">▾</span>`;
  const bdy = document.createElement('div');
  bdy.className = 'modal-summary-section-body' + (openByDefault ? ' open' : '');
  bdy.appendChild(renderMarkdown(text));
  hdr.addEventListener('click', () => {
    sec.classList.toggle('open');
    bdy.classList.toggle('open');
  });
  sec.appendChild(hdr);
  sec.appendChild(bdy);
  return sec;
}

function renderImportantMoments(moments) {
  const container = document.createElement('div');
  if (!moments || typeof moments !== 'object') {
    container.innerHTML = '<p style="color:var(--cream-dim);font-size:13px;">Önemli anlar verisi bulunamadı.</p>';
    return container;
  }

  // Try to re-parse raw fallback (e.g. Gemini returned JSON in a code block)
  if (moments.raw) {
    try {
      const start = moments.raw.indexOf('{');
      const end = moments.raw.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(moments.raw.slice(start, end + 1));
        if (parsed && (parsed.criticalMoments || parsed.examPoints || parsed.actionItems)) {
          moments = parsed;
        }
      }
    } catch (_) {}
    if (moments.raw) {
      container.appendChild(renderMarkdown(moments.raw));
      return container;
    }
  }

  const sections = [
    { key: 'criticalMoments', label: 'Kritik Anlar',      badge: 'vv-badge-crit' },
    { key: 'examPoints',      label: 'Sınavlık Noktalar', badge: 'vv-badge-info' },
    { key: 'actionItems',     label: 'Aksiyon Önerileri', badge: 'vv-badge-warn' },
  ];

  sections.forEach(({ key, label, badge }) => {
    const items = moments[key];
    if (!items || !items.length) return;
    const h = document.createElement('div');
    h.style.cssText = 'font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--accent);margin:16px 0 8px;';
    h.textContent = label;
    container.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'moments-grid';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'moment-item';
      card.innerHTML = `
        <div class="moment-header">
          <span class="moment-badge ${badge}">${esc(label)}</span>
          ${item.timestamp ? `<span class="moment-ts">${esc(item.timestamp)}</span>` : ''}
        </div>
        <div class="moment-title">${esc(item.title || '')}</div>
        <div class="moment-desc">${esc(item.description || '')}</div>
        ${item.reason ? `<div class="moment-why">› ${esc(item.reason)}</div>` : ''}`;
      grid.appendChild(card);
    });
    container.appendChild(grid);
  });

  return container;
}

// ── Modal actions delegation ──
modalPanel.addEventListener('click', async (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  const vid    = actionEl.dataset.vid;

  if (action === 'modal-edit-note') {
    const display  = document.getElementById(`modal-note-display-${vid}`);
    const editArea = document.getElementById(`modal-note-edit-${vid}`);
    const editBtn  = document.getElementById(`modal-btn-edit-${vid}`);
    const saveBtn  = document.getElementById(`modal-btn-save-note-${vid}`);
    const editing  = editArea.style.display !== 'none';
    if (editing) {
      editArea.style.display = 'none'; display.style.display = 'block';
      editBtn.textContent = 'Notu Düzenle'; saveBtn.style.display = 'none';
    } else {
      editArea.style.display = 'block'; display.style.display = 'none';
      editBtn.textContent = 'İptal'; saveBtn.style.display = '';
      const ta = document.getElementById(`modal-note-ta-${vid}`);
      if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    }
    return;
  }

  if (action === 'modal-save-note') {
    const ta   = document.getElementById(`modal-note-ta-${vid}`);
    if (!ta) return;
    const note = ta.value.trim();
    const idx  = archive.findIndex(v => v.videoId === vid);
    if (idx >= 0) { archive[idx].note = note; archive[idx].updatedAt = Date.now(); await persist(); }
    const display  = document.getElementById(`modal-note-display-${vid}`);
    const editArea = document.getElementById(`modal-note-edit-${vid}`);
    const editBtn  = document.getElementById(`modal-btn-edit-${vid}`);
    const saveBtn  = document.getElementById(`modal-btn-save-note-${vid}`);
    if (note) { display.textContent = note; display.style.cssText = ''; }
    else { display.textContent = 'Henüz not yok'; display.style.cssText = 'color:var(--cream-dim);font-style:italic;'; }
    editArea.style.display = 'none'; display.style.display = 'block';
    editBtn.textContent = 'Notu Düzenle'; saveBtn.style.display = 'none';
    render();
    return;
  }

  if (action === 'modal-delete') {
    if (!confirm('Bu videoyu arşivden silmek istediğinden emin misin?')) return;
    archive = archive.filter(v => v.videoId !== vid);
    // Görsel notları da temizle
    if (visualNotes[vid]) { delete visualNotes[vid]; await persistVisualNotes(); }
    await persist();
    closeModal();
    render(); updateStats(); renderFolderSidebar();
    return;
  }
});

async function setRating(videoId, val) {
  const idx = archive.findIndex(v => v.videoId === videoId);
  if (idx < 0) return;
  archive[idx].rating = val; archive[idx].updatedAt = Date.now();
  await persist();
  const badge = document.querySelector(`[data-card-id="${videoId}"] .card-rating-badge`);
  if (badge) { badge.textContent = val + '/10'; badge.className = 'card-rating-badge' + (val >= 8 ? ' high' : ''); }
  updateStats();
}

// ── Grid event delegation ──
grid.addEventListener('click', (e) => {
  if (e.target.closest('a[target="_blank"]')) return;
  const card = e.target.closest('[data-action="open-modal"]');
  if (card) openModal(card.dataset.vid);
});

// ── Controls ──
searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; render(); });
ratingFilter.addEventListener('change', (e) => { currentFilter = e.target.value; render(); });
document.querySelectorAll('.sort-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sort-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSort = tab.dataset.sort;
    render();
  });
});

// ── Init ──
async function init() {
  const result = await chrome.storage.local.get(['archive', 'folders', 'settings', 'visualNotes']);

  // Apply settings
  settings = result.settings || {};
  applyTheme(settings.selectedTheme || 'amber');

  // Migrate archive
  archive      = migrateArchive(result.archive);
  folders      = result.folders      || [];
  visualNotes  = result.visualNotes  || {};

  // If migration added new fields, persist
  await chrome.storage.local.set({ archive, folders });

  updateStats();
  renderFolderSidebar();
  updateTopbar();
  render();
}

init();

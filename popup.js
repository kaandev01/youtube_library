// popup.js — youLIB v2

// ── Theme helpers ──
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'amber');
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === (theme || 'amber'));
  });
}

async function setTheme(theme) {
  const { settings = {} } = await chrome.storage.local.get('settings');
  settings.selectedTheme = theme;
  await chrome.storage.local.set({ settings });
  applyTheme(theme);
}

// ── Theme buttons ──
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});

// ── Library button ──
document.getElementById('btn-library').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_LIBRARY' });
  window.close();
});

// ── Groq API Key ──
document.getElementById('btn-save-key').addEventListener('click', async () => {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) return;
  await chrome.storage.local.set({ apiKey: key });
  const msg = document.getElementById('saved-msg');
  msg.textContent = '✓ Kaydedildi';
  setTimeout(() => msg.textContent = '', 2000);
});

// ── Supadata API Key ──
document.getElementById('btn-save-supadata').addEventListener('click', async () => {
  const key = document.getElementById('supadata-key-input').value.trim();
  if (!key) return;
  await chrome.storage.local.set({ supadataKey: key });
  const msg = document.getElementById('supadata-saved-msg');
  msg.textContent = '✓ Kaydedildi';
  setTimeout(() => msg.textContent = '', 2000);
});

// ── Init ──
async function init() {
  const { apiKey, supadataKey, archive, folders, settings } = await chrome.storage.local.get([
    'apiKey', 'supadataKey', 'archive', 'folders', 'settings'
  ]);

  // Apply theme
  applyTheme(settings?.selectedTheme || 'amber');

  // Fill in saved API keys (masked)
  if (apiKey) document.getElementById('api-key-input').value = apiKey;
  if (supadataKey) document.getElementById('supadata-key-input').value = supadataKey;

  // Stats
  const list = archive || [];
  const folderList = folders || [];
  document.getElementById('s-total').textContent = list.length;
  const rated = list.filter(v => v.rating > 0);
  document.getElementById('s-avg').textContent = rated.length
    ? (rated.reduce((s, v) => s + v.rating, 0) / rated.length).toFixed(1)
    : '—';
  document.getElementById('s-folders').textContent = folderList.length;
}

init();

// background.js — youLIB v3

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── Kütüphane ──
  if (message.type === 'OPEN_LIBRARY') {
    chrome.tabs.create({ url: chrome.runtime.getURL('library.html') });
    return false;
  }

  // ── OpenRouter: AI Özeti / Analiz ──
  if (message.type === 'GROK_SUMMARY') {
    const { apiKey, prompt, maxTokens } = message;

    if (!apiKey || !apiKey.trim()) {
      sendResponse({ error: 'OpenRouter API Key girilmemiş. Extension ikonuna tıkla ve key\'ini kaydet.' });
      return false;
    }

    // Model zinciri: limit/hata durumunda sıradakine geç
    const MODELS = [
      'google/gemma-4-31b-it:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'openrouter/free'
    ];

    async function tryModel(modelIndex, attemptsLeft) {
      if (modelIndex >= MODELS.length) {
        return sendResponse({ error: 'Tüm ücretsiz modeller şu an meşgul. Birkaç dakika sonra tekrar dene.' });
      }

      const model = MODELS[modelIndex];
      let r, data;
      try {
        r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`,
            'HTTP-Referer': 'https://github.com/youlib',
            'X-Title': 'youLIB'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens || 8192,
            temperature: 0.7
          })
        });
        try { data = await r.json(); } catch (_) { data = {}; }
      } catch (e) {
        return sendResponse({ error: 'Bağlantı hatası: ' + (e.message || 'bilinmeyen') });
      }

      // 429 (limit) veya 503 (yoğun) → sonraki modele geç
      if (r.status === 429 || r.status === 503 || r.status === 529) {
        if (attemptsLeft > 1) {
          await new Promise(res => setTimeout(res, 2000));
          return tryModel(modelIndex, attemptsLeft - 1);
        }
        return tryModel(modelIndex + 1, 2);
      }

      if (!r.ok) {
        const apiMsg = data && data.error && data.error.message ? data.error.message : '';
        if (r.status === 401 || r.status === 403) return sendResponse({ error: 'OpenRouter API Key geçersiz. openrouter.ai/keys adresinden kontrol et.' });
        if (r.status === 400) return sendResponse({ error: 'Geçersiz istek. API Key\'ini kontrol et.' });
        return sendResponse({ error: apiMsg || ('Sunucu hatası HTTP ' + r.status) });
      }

      const choice = data && data.choices && data.choices[0];
      if (!choice) return sendResponse({ error: 'Yanıt gelmedi. Tekrar dene.' });

      const text = choice.message && choice.message.content;
      if (!text || !text.trim()) return sendResponse({ error: 'Boş yanıt geldi. Tekrar dene.' });

      sendResponse({ text: text.trim() });
    }

    tryModel(0, 2);
    return true;
  }
});

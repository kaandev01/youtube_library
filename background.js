// background.js — youLIB v2

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── Kütüphane ──
  if (message.type === 'OPEN_LIBRARY') {
    chrome.tabs.create({ url: chrome.runtime.getURL('library.html') });
    return false;
  }

  // ── Supadata: YouTube Transcript ──
  if (message.type === 'SUPADATA_TRANSCRIPT') {
    const { supadataKey, videoId } = message;

    if (!supadataKey || !supadataKey.trim()) {
      sendResponse({ error: 'Supadata API Key girilmemiş.' });
      return false;
    }

    const url = `https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}&text=true`;

    fetch(url, {
      headers: { 'x-api-key': supadataKey.trim() }
    })
    .then(async (r) => {
      let data;
      try { data = await r.json(); } catch (_) { data = {}; }

      if (!r.ok) {
        const msg = data && (data.message || data.error) ? (data.message || data.error) : '';
        if (r.status === 401 || r.status === 403) return sendResponse({ error: 'Supadata API Key geçersiz. supadata.ai/dashboard adresinden kontrol et.' });
        if (r.status === 404) return sendResponse({ error: 'Bu video için transkript bulunamadı.' });
        if (r.status === 429) return sendResponse({ error: 'Supadata aylık limit doldu.' });
        return sendResponse({ error: msg || ('Supadata hatası HTTP ' + r.status) });
      }

      let text = '';
      if (typeof data.content === 'string') {
        text = data.content;
      } else if (Array.isArray(data.content)) {
        text = data.content.map(c => c.text || '').join(' ');
      } else if (data.transcript) {
        text = typeof data.transcript === 'string' ? data.transcript : '';
      }

      text = text.replace(/\s+/g, ' ').trim();
      if (!text || text.length < 80) {
        return sendResponse({ error: 'Transkript çok kısa veya boş geldi.' });
      }

      sendResponse({ text });
    })
    .catch(e => sendResponse({ error: 'Supadata bağlantı hatası: ' + (e.message || 'bilinmeyen') }));

    return true;
  }

  // ── Groq: AI Özeti / Analiz ──
  if (message.type === 'GROK_SUMMARY') {
    const { apiKey, prompt, maxTokens } = message;

    if (!apiKey || !apiKey.trim()) {
      sendResponse({ error: 'Groq API Key girilmemiş. Extension ikonuna tıkla ve key\'ini kaydet.' });
      return false;
    }

    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens || 4096,
        temperature: 0.7
      })
    })
    .then(async (r) => {
      let data;
      try { data = await r.json(); } catch (_) { data = {}; }

      if (!r.ok) {
        const apiMsg = data && data.error && data.error.message ? data.error.message : '';
        if (r.status === 400) return sendResponse({ error: 'Geçersiz istek. Groq API Key\'ini kontrol et.' });
        if (r.status === 401) return sendResponse({ error: 'Groq API Key tanınmadı. console.groq.com adresinden doğru key\'i kopyaladığından emin ol.' });
        if (r.status === 403) return sendResponse({ error: 'Groq API Key yetkisiz.' });
        if (r.status === 429) return sendResponse({ error: 'Groq istek limiti doldu. Birkaç saniye bekle.' });
        return sendResponse({ error: apiMsg || ('Sunucu hatası HTTP ' + r.status) });
      }

      const choice = data && data.choices && data.choices[0];
      if (!choice) return sendResponse({ error: 'Groq\'tan yanıt gelmedi. Tekrar dene.' });

      const finishReason = choice.finish_reason;
      if (finishReason && finishReason !== 'stop' && finishReason !== 'length') {
        return sendResponse({ error: 'İçerik oluşturulamadı (' + finishReason + '). Farklı bir video dene.' });
      }

      const text = choice.message && choice.message.content;
      if (!text || !text.trim()) return sendResponse({ error: 'Boş yanıt geldi. Tekrar dene.' });

      sendResponse({ text: text.trim() });
    })
    .catch(function(e) {
      sendResponse({ error: 'Groq bağlantı hatası: ' + (e.message || 'bilinmeyen') });
    });

    return true;
  }
});

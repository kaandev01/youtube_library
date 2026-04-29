# 📚 youLIB v3 — YouTube Kişisel Bilgi Kütüphanesi

YouTube videolarını AI özetiyle arşivle, klasörlere ayır, puanla, çoklu dil ve özet modu seçenekleriyle yönet.

## ✨ Özellikler

- **⚡ Hızlı Özet** — Ana fikir, 3 paragraf
- **◈ Derin Analiz** — 8 bölümlü kapsamlı analiz: temalar, kavram sözlüğü, kritik içgörüler, uygulanabilir adımlar
- **⏱ Zaman Haritası** — Transkript cümleleri bloklara bölünerek dakika dakika detaylı özet
- **✦ Kritik Anlar** — 5 kritik an, 3 sınavlık nokta, 4 aksiyon önerisi
- **Klasör Sistemi** — Video organizasyonu, özel klasörler
- **Çoklu Dil** — TR / EN / DE / FR / ES çıktı dili
- **Tema Sistemi** — Amber (siyah-sarı) ve Mono (açık) tema
- **Ücretsiz Transkript** — YouTube'un kendi altyazı sistemi, API key gerekmez

## 🚀 Kurulum

1. `chrome://extensions/` sayfasına git
2. **Geliştirici modu**nu etkinleştir
3. **Paketlenmemiş öğe yükle** → Bu klasörü seç

## 🔑 API Key

Tek bir key yeterli:

- **OpenRouter** (AI): [openrouter.ai/keys](https://openrouter.ai/keys) — Ücretsiz, kart gerekmez

> OpenRouter üzerinden otomatik model seçimi yapılır. Bir model meşgulse diğerine geçer.

## 📖 Kullanım

1. YouTube'da video aç
2. Sağdaki **Arşivle** butonuna tıkla
3. Özet türü ve dili seç
4. Klasöre ata
5. Oluştur → Kaydet

## 🔄 v3 Değişiklikleri

- **OpenRouter entegrasyonu** — Groq yerine 30+ ücretsiz modele erişim (gemma-4, llama-3.3 vb.)
- **Supadata kaldırıldı** — Transkript artık YouTube'un kendi sisteminden, limitsiz ve ücretsiz
- **Tek API key** — Eskiden 2 key (Groq + Supadata) gerekirken artık yalnızca OpenRouter key'i yeterli
- **Otomatik fallback** — Model limiti veya hata durumunda sıradaki modele otomatik geçiş
- **SPA navigasyon düzeltmesi** — Ana sayfadan video açınca buton kaybolmuyordu, düzeltildi
- **Önemli Anlar düzeltmesi** — JSON parse hatası giderildi, kartlar artık doğru görünüyor
- **Premium UI** — Özet kartları ikon + başlık + açıklama yapısıyla yenilendi
- **Derin Analiz güçlendirildi** — 8 bölümlü yapı: tema analizi, kavram sözlüğü, kritik içgörüler, uygulanabilir adımlar, yanlış bilinenler
- **Zaman Haritası yeniden yazıldı** — Transkript JavaScript'te bloklara bölünüyor, her bloğa sadece o dakikaların metni veriliyor; model artık tahmin yapmıyor

const CACHE = 'nurvakit-v5';
const KABUK = ['./', './index.html', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(KABUK)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API ve dış kaynaklar: her zaman ağdan (vakitler güncel kalsın)
  if (url.origin !== location.origin) return;
  // Kendi dosyalarımız: önce önbellek, yoksa ağ
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const kopya = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, kopya));
      return res;
    }))
  );
});

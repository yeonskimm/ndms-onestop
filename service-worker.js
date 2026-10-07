// 현장바로(옛 이름: 119 사고현장 확인) 서비스워커 (법ON 서비스워커 구조를 따름)
// - 앱 화면(index.html): 네트워크 우선. 3초 안에 응답이 없거나 오프라인이면 저장본을 띄우고, 새 화면은 뒤에서 받아 저장
//   저장본을 띄운 뒤 받은 새 화면이 저장본과 다르면 열린 화면에 알림 → 화면 쪽에서 업데이트 안내
// - 아이콘·manifest: 저장본 우선
// - 카카오 지도 등 다른 주소 요청은 건드리지 않음(지도는 인터넷 연결 필요)
// - 캐시 저장소는 yeonskimm.github.io 단위로 법ON(lawon-)·오늘의안전(onul-safety-)·노무길잡이(nomugil-)와 공유 → 삭제는 반드시 내 접두어(ndms-onestop-)만
// 이 파일·아이콘·manifest를 바꿀 때만 CACHE_NAME 숫자를 올림
const CACHE_NAME = 'ndms-onestop-v2';
const MY_CACHE = k => k.startsWith('ndms-onestop-');
const PAGE_KEY = './index.html';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './icon-180.png'];
const ASSET_PATHS = ASSETS.map(a => new URL(a, self.registration.scope).pathname);
const TIMEOUT_MS = 3000;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled([PAGE_KEY].concat(ASSETS).map(f => cache.add(f)))));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => MY_CACHE(k) && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const tagOf = r => r ? (r.headers.get('ETag') || r.headers.get('Last-Modified') || '') : '';
const offline = () => new Response('오프라인 상태입니다. 인터넷에 연결한 뒤 다시 열어 주세요.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
const notifyUpdated = () => self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => c.postMessage({ type: 'ONESTOP_UPDATED' })));

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    const cachedP = caches.open(CACHE_NAME).then(c => c.match(PAGE_KEY));
    let servedStale = false;
    // 공유로 열릴 때 붙는 ?text= 는 화면 주소만 다르므로 index.html 하나로 저장
    const net = fetch(new Request(new URL('./', self.registration.scope).href, { cache: 'no-cache', credentials: 'same-origin' }));
    const saved = net.then(res => {
      if (!res || !res.ok) return;
      const copy = res.clone();
      return cachedP.then(old => caches.open(CACHE_NAME).then(c => c.put(PAGE_KEY, copy)).then(() => {
        if (servedStale && tagOf(old) && tagOf(res) && tagOf(old) !== tagOf(res)) return notifyUpdated();
      }));
    }).catch(() => {});
    event.waitUntil(saved);
    event.respondWith(cachedP.then(cached => {
      if (!cached) return net.then(r => r.clone()).catch(offline);
      const late = new Promise(resolve => setTimeout(() => resolve(null), TIMEOUT_MS));
      return Promise.race([net.then(res => (res && res.ok) ? res.clone() : null, () => null), late])
        .then(res => { if (res) return res; servedStale = true; return cached; });
    }));
    return;
  }

  if (!url.search && ASSET_PATHS.indexOf(url.pathname) >= 0) {
    event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(req).then(hit => {
      const fresh = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || fresh.then(r => r || offline());
    })));
  }
});

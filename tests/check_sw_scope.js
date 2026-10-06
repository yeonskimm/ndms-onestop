// 서비스워커가 자기 캐시(ndms-onestop-)만 지우는지 실제로 돌려서 확인: node tests/check_sw_scope.js service-worker.js
// 같은 주소(yeonskimm.github.io)를 쓰는 법ON(lawon-, beopon-)·오늘의안전(onul-safety-)·노무길잡이(nomugil-) 캐시는 남아야 함
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(process.argv[2] || 'service-worker.js', 'utf8');
const store = new Set(['lawon-v7', 'beopon-v1', 'onul-safety-v99', 'nomugil-v4', 'ndms-onestop-v0', 'ndms-onestop-old']);
const handlers = {};
const self = {
  registration: { scope: 'https://yeonskimm.github.io/ndms-onestop/' },
  location: { origin: 'https://yeonskimm.github.io' },
  addEventListener: (t, f) => { handlers[t] = f; },
  skipWaiting: () => {}, clients: { claim: async () => {}, matchAll: async () => [] },
};
const caches = { keys: async () => [...store], delete: async k => store.delete(k), open: async () => ({ add: async () => {}, put: async () => {}, match: async () => undefined }) };
vm.runInNewContext(src, { self, caches, URL, Response: class {}, Request: class {}, fetch: async () => ({}), setTimeout, Promise, console });
let waited;
handlers.activate({ waitUntil: p => { waited = p; } });
waited.then(() => {
  const left = [...store].sort();
  const must = ['beopon-v1', 'lawon-v7', 'nomugil-v4', 'onul-safety-v99'];
  const bad = must.filter(k => !store.has(k));
  if (bad.length) { console.error('다른 앱 캐시를 지움:', bad); process.exit(1); }
  if (store.has('ndms-onestop-old') || store.has('ndms-onestop-v0')) { console.error('내 옛 캐시가 안 지워짐:', left); process.exit(1); }
  console.log('통과: 남은 캐시', left);
});

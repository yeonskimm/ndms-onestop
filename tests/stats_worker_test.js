// 이용자 수 집계 워커 시험(가짜 D1): node tests/stats_worker_test.js
// 하루 두 번 열어도 한 번만 셈, 다른 주소·잘못된 번호 거절, 비밀번호 5번 틀리면 잠금
const path = require('path');
let fail = 0; const ok = (m, c) => { console.log((c ? '통과 ' : '실패 ') + m); if (!c) fail++; };
function fakeDB() {
  const users = new Map(), visits = new Map();
  const run = (sql, a) => {
    if (sql.startsWith('INSERT OR IGNORE INTO users')) { if (!users.has(a[0])) users.set(a[0], { first_day: a[1], device: a[2] }); return []; }
    if (sql.startsWith('INSERT OR IGNORE INTO visits')) { const k = a[0] + '|' + a[1]; if (!visits.has(k)) visits.set(k, { day: a[0], device: a[2] }); return []; }
    if (sql === 'SELECT count(*) n FROM users') return [{ n: users.size }];
    if (sql === 'SELECT count(*) n FROM visits') return [{ n: visits.size }];
    const grp = (rows, key) => { const m = {}; rows.forEach(r => { m[r[key]] = (m[r[key]] || 0) + 1; }); return Object.keys(m).map(k => ({ [key === 'first_day' ? 'day' : key]: k, n: m[k] })); };
    if (sql.startsWith('SELECT day, count(*) n FROM visits WHERE')) return grp([...visits.values()].filter(v => v.day >= a[0]), 'day');
    if (sql.startsWith('SELECT first_day')) return grp([...users.values()].filter(v => v.first_day >= a[0]), 'first_day');
    if (sql.startsWith('SELECT device')) return grp([...users.values()], 'device');
    if (sql.startsWith('SELECT day, count(*) n FROM visits GROUP')) return grp([...visits.values()], 'day');
    throw new Error('모르는 SQL ' + sql);
  };
  const stmt = (sql, a = []) => ({ bind: (...b) => stmt(sql, b), all: async () => ({ results: run(sql, a) }), _run: () => run(sql, a) });
  return { prepare: sql => stmt(sql), batch: async l => l.map(s => s._run()) };
}
(async () => {
  const W = (await import('file://' + path.resolve(__dirname, '../tools/onestop-stats-worker.js'))).default;
  const env = { DB: fakeDB(), STATS_KEY: '2468' };
  const O = 'https://yeonskimm.github.io';
  const req = (p, b, h = {}) => new Request('https://onestop-stats.x.workers.dev' + p, { method: 'POST', headers: { Origin: O, ...h }, body: JSON.stringify(b) });
  const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  ok('첫 집계', (await W.fetch(req('/ping', { uid: A }, { 'User-Agent': 'Android' }), env)).status === 200);
  await W.fetch(req('/ping', { uid: A }), env);
  await W.fetch(req('/ping', { uid: B }, { 'User-Agent': 'iPhone' }), env);
  ok('다른 주소에서 온 집계 거절', (await W.fetch(new Request('https://x/ping', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: JSON.stringify({ uid: A }) }), env)).status === 403);
  ok('번호 형식 틀리면 거절', (await W.fetch(req('/ping', { uid: 'hello' }), env)).status === 400);
  const r = await W.fetch(req('/admin', { key: '2468' }), env), d = await r.json();
  ok('관리자: 누적 2대', d.total === 2);
  ok('관리자: 같은 날 두 번 열어도 연인원 2명', d.vt === 2);
  ok('관리자: 오늘 이용 2·신규 2', d.days.length === 1 && d.days[0].n === 2 && d.days[0].nw === 2);
  ok('관리자: 기기별', d.dev.Android === 1 && d.dev.iOS === 1);
  ok('관리자: CORS 허용 주소', r.headers.get('Access-Control-Allow-Origin') === O);
  const ip = { 'CF-Connecting-IP': '1.2.3.4' };
  for (let i = 0; i < 5; i++) await W.fetch(req('/admin', { key: '0000' }, ip), env);
  ok('비밀번호 5번 틀리면 잠금(맞는 번호도 429)', (await W.fetch(req('/admin', { key: '2468' }, ip), env)).status === 429);
  ok('/stats 비밀번호 없으면 거절', (await W.fetch(new Request('https://x/stats'), env)).status === 403);
  console.log(fail ? `실패 ${fail}건` : '모두 통과'); process.exit(fail ? 1 : 0);
})();

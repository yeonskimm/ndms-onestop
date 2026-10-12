// 현장바로 이용자 수 집계 — Cloudflare Worker(이름 onestop-stats) + D1(onestop-stats). 2026-10-12
// 법ON 집계 워커(lawon/tools/lawon-stats-worker.js)와 같은 구조. 법ON과 주소(yeonskimm.github.io)가 같아 워커·D1을 따로 둠(숫자 섞임 방지)
// 이 파일은 보관용(배포 사이트에 올라가지 않음). Cloudflare 워커 편집 화면에 붙여 넣어 씀
// 바인딩: D1 → 변수 이름 DB / 비밀값: STATS_KEY(통계 보기 비밀번호, 숫자)
// D1 표(콘솔에서 한 번 실행):
//   CREATE TABLE users(uid TEXT PRIMARY KEY, first_day TEXT, device TEXT) WITHOUT ROWID;
//   CREATE TABLE visits(day TEXT, uid TEXT, device TEXT, PRIMARY KEY(day,uid)) WITHOUT ROWID;
// 앱(index.html)은 하루 한 번 무작위 번호만 POST /ping. 같은 날 두 번째부터는 INSERT OR IGNORE라 쓰기 없음
// 통계: 앱 첫 화면 '현장바로' 로고를 3초 안에 5번 누르기(관리자 화면, POST /admin) 또는 https://onestop-stats.<계정>.workers.dev/stats?key=<STATS_KEY>
const OK = 'https://yeonskimm.github.io';
const FAIL = new Map();   // 비밀번호 틀린 횟수(IP별, 서버 메모리 — 재시작되면 초기화)
const kst = (off = 0) => new Date(Date.now() + 9 * 3600e3 - off * 86400e3).toISOString().slice(0, 10);
const json = (o, h) => new Response(JSON.stringify(o), { headers: { ...h, 'Content-Type': 'application/json' } });
async function body(req) { try { return JSON.parse(await req.text()); } catch (e) { return {}; } }

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': OK, 'Vary': 'Origin' };
    if (url.pathname === '/ping' && req.method === 'POST') {
      if (origin !== OK) return new Response('', { status: 403 });
      const b = await body(req), uid = String(b.uid || '');
      if (!/^[0-9a-f-]{32,40}$/i.test(uid)) return new Response('', { status: 400, headers: cors });
      const day = kst(), ua = req.headers.get('User-Agent') || '';
      const dev = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : 'PC';
      await env.DB.batch([
        env.DB.prepare('INSERT OR IGNORE INTO users VALUES(?1,?2,?3)').bind(uid, day, dev),
        env.DB.prepare('INSERT OR IGNORE INTO visits VALUES(?1,?2,?3)').bind(day, uid, dev)]);
      return json({ ok: true }, cors);
    }
    if (url.pathname === '/admin' && req.method === 'POST') {
      if (origin !== OK) return new Response('', { status: 403 });
      const ip = req.headers.get('CF-Connecting-IP') || '', now = Date.now(), f = FAIL.get(ip);
      if (f && f.n >= 5 && now - f.t < 600e3) return new Response('', { status: 429, headers: cors });   // 5번 틀리면 10분 잠금
      const b = await body(req);
      if (!env.STATS_KEY || String(b.key || '') !== env.STATS_KEY) {
        FAIL.set(ip, { n: (f && now - f.t < 600e3 ? f.n : 0) + 1, t: now }); if (FAIL.size > 500) FAIL.clear();
        return new Response('', { status: 403, headers: cors });
      }
      FAIL.delete(ip);
      const from = kst(40);
      const q = (s, ...a) => env.DB.prepare(s).bind(...a).all().then(r => r.results);
      const [t, vt, v, nw, dv] = await Promise.all([
        q('SELECT count(*) n FROM users'),
        q('SELECT count(*) n FROM visits'),
        q('SELECT day, count(*) n FROM visits WHERE day >= ?1 GROUP BY day', from),
        q('SELECT first_day day, count(*) n FROM users WHERE first_day >= ?1 GROUP BY first_day', from),
        q('SELECT device, count(*) n FROM users GROUP BY device')]);
      const m = {};
      v.forEach(x => { m[x.day] = { day: x.day, n: x.n, nw: 0 }; });
      nw.forEach(x => { (m[x.day] = m[x.day] || { day: x.day, n: 0, nw: 0 }).nw = x.n; });
      const dev = {}; dv.forEach(x => { dev[x.device] = x.n; });
      return json({ total: t[0].n, vt: vt[0].n, days: Object.values(m), dev }, cors);
    }
    if (url.pathname === '/stats') {
      if (!env.STATS_KEY || url.searchParams.get('key') !== env.STATS_KEY) return new Response('forbidden', { status: 403 });
      const q = s => env.DB.prepare(s).all().then(r => r.results);
      const [t, vt, d, v] = await Promise.all([
        q('SELECT count(*) n FROM users'),
        q('SELECT count(*) n FROM visits'),
        q('SELECT device, count(*) n FROM users GROUP BY device'),
        q('SELECT day, count(*) n FROM visits GROUP BY day ORDER BY day DESC LIMIT 30')]);
      const row = a => a.map(x => `<tr><td>${x.day || x.device}</td><td>${x.n}</td></tr>`).join('');
      return new Response(`<meta charset="utf-8"><meta name="viewport" content="width=device-width">
<h2>현장바로 누적 이용 기기 ${t[0].n}대 · 연인원 ${vt[0].n}명</h2><h3>기기별</h3><table>${row(d)}</table>
<h3>날짜별 이용자(최근 30일)</h3><table>${row(v)}</table>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response('not found', { status: 404 });
  }
};

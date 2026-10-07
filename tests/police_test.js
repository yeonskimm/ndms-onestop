// 경찰 관할 찾기 시험: node tests/police_test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\/ ===== POLICE-START[\s\S]*?\/\/ ===== POLICE-END =====/);
const mod = { exports: {} }; new Function('module', 'exports', m[0])(mod, mod.exports); const P = mod.exports;
let n = 0;
const t = (where, expect, opt) => {
  const r = P.find(where);
  const names = r.matches.map(o => o.u.name);
  assert.deepStrictEqual(names, expect, JSON.stringify(where) + ' → ' + names.join(','));
  if (opt && 'boundary' in opt) assert.strictEqual(r.boundary, opt.boundary, '경계 ' + JSON.stringify(where));
  if (opt && opt.stations) assert.deepStrictEqual(r.stations, opt.stations);
  if (opt && 'covered' in opt) assert.strictEqual(r.covered, opt.covered);
  if (opt && 'inf' in opt) assert.strictEqual(r.matches[0].inf, opt.inf);
  n++;
};
const DG = '대구광역시', GB = '경상북도';
// 중구: 숫자 없는 '남산동'이 남산1~4동에도 맞음, 일부 관할은 후보 여럿
t({ r1: DG, r2: '중구', b: '남산동', h: '남산3동' }, ['남산지구대'], { boundary: false, stations: ['대구중부경찰서'] });
t({ r1: DG, r2: '중구', b: '남산동', h: '남산동' }, ['남산지구대']);
t({ r1: DG, r2: '중구', b: '동인동1가', h: '동인동' }, ['동덕지구대'], { boundary: false });
t({ r1: DG, r2: '중구', b: '대봉동', h: '대봉2동' }, ['남산지구대', '동덕지구대'], { boundary: true });
t({ r1: DG, r2: '중구', b: '교동', h: '성내1동' }, ['중앙파출소', '동덕지구대'], { boundary: true });
t({ r1: DG, r2: '중구', b: '봉산동', h: '성내2동' }, ['중앙파출소', '서문지구대', '동덕지구대'], { boundary: true });
t({ r1: DG, r2: '중구', b: '대신동', h: '대신동' }, ['서문지구대']);
// 동구: 공산동은 법정동으로 나뉨
t({ r1: DG, r2: '동구', b: '내동', h: '공산동' }, ['팔공파출소'], { boundary: false });
t({ r1: DG, r2: '동구', b: '송정동', h: '공산동' }, ['공산파출소']);
t({ r1: DG, r2: '동구', b: '신암동', h: '신암4동' }, ['큰고개지구대']);
t({ r1: DG, r2: '동구', b: '동내동', h: '혁신동' }, ['동내혁신파출소']);
t({ r1: DG, r2: '동구', b: '숙천동', h: '안심3동' }, ['안심지구대'], { boundary: true });
t({ r1: DG, r2: '동구', b: '불로동', h: '불로봉무동' }, ['봉무불로파출소', '동촌지구대'], { boundary: true });
t({ r1: DG, r2: '동구', b: '지저동', h: '지저동' }, ['동촌지구대', '봉무불로파출소'], { boundary: true });
// 북구: 북부서·강북서
t({ r1: DG, r2: '북구', b: '노원동3가', h: '노원동' }, ['노원지구대'], { stations: ['대구북부경찰서'] });
t({ r1: DG, r2: '북구', b: '침산동', h: '침산2동' }, ['노원지구대', '고성지구대'], { boundary: true });
t({ r1: DG, r2: '북구', b: '읍내동', h: '읍내동' }, ['강북지구대'], { stations: ['대구강북경찰서'] });
t({ r1: DG, r2: '북구', b: '동천동', h: '동천동' }, ['동천지구대', '강북지구대'], { boundary: true });
t({ r1: DG, r2: '북구', b: '사수동', h: '관문동' }, ['관문파출소']);
t({ r1: DG, r2: '북구', b: '연경동', h: '무태조야동' }, ['무태파출소']);
// 수성구: 두산동 지번 207 기준
t({ r1: DG, r2: '수성구', b: '두산동', h: '두산동', lot: 100 }, ['상동지구대'], { boundary: false });
t({ r1: DG, r2: '수성구', b: '두산동', h: '두산동', lot: 500 }, ['지산지구대'], { boundary: false });
t({ r1: DG, r2: '수성구', b: '두산동', h: '두산동', lot: 207 }, ['상동지구대', '지산지구대'], { boundary: true });
t({ r1: DG, r2: '수성구', b: '두산동', h: '두산동' }, ['상동지구대', '지산지구대'], { boundary: true });
t({ r1: DG, r2: '수성구', b: '수성동2가', h: '수성2.3가동' }, ['범어지구대']);
t({ r1: DG, r2: '수성구', b: '수성동1가', h: '수성1가동' }, ['범어지구대']);
t({ r1: DG, r2: '수성구', b: '시지동', h: '고산1동' }, ['고산지구대']);
t({ r1: DG, r2: '수성구', b: '파동', h: '파동' }, ['파동파출소']);
// 군위
t({ r1: DG, r2: '군위군', b: '우보면', ri: '이화리', h: '우보면' }, ['효령파출소'], { stations: ['대구군위경찰서'] });
t({ r1: DG, r2: '군위군', b: '소보면', h: '소보면' }, ['중앙파출소']);
// 경북: 청도(공식), 경산·영천 읍면(추정), 시내 동(자료 없음)
t({ r1: GB, r2: '청도군', b: '풍각면', ri: '송서리', h: '풍각면' }, ['풍각파출소'], { inf: false, covered: true });
t({ r1: GB, r2: '청도군', b: '운문면', h: '운문면' }, ['운문치안센터']);
t({ r1: GB, r2: '청도군', b: '각북면', h: '각북면' }, [], { stations: ['청도경찰서'], covered: true });
t({ r1: GB, r2: '경산시', b: '진량읍', h: '진량읍' }, ['진량파출소'], { inf: true });
t({ r1: GB, r2: '경산시', b: '중방동', h: '중방동' }, [], { stations: ['경산경찰서'], covered: true });
t({ r1: GB, r2: '경산시', b: '남산면', h: '남산면' }, ['자인파출소'], { inf: false });
t({ r1: GB, r2: '경산시', b: '남천면', h: '남천면' }, ['서부지구대']);
t({ r1: GB, r2: '경산시', b: '옥곡동', h: '서부2동' }, ['서부지구대']);
t({ r1: GB, r2: '경산시', b: '사동', h: '서부1동' }, ['서부지구대']);
t({ r1: GB, r2: '영천시', b: '화북면', h: '화북면' }, ['화남파출소'], { inf: false });
t({ r1: GB, r2: '영천시', b: '자양면', h: '자양면' }, ['임고파출소']);
t({ r1: GB, r2: '영천시', b: '금호읍', h: '금호읍' }, ['금호파출소'], { inf: true });
// 같은 이름 '중앙파출소'가 다른 시군구 규칙에 섞이지 않음
t({ r1: GB, r2: '영천시', b: '완산동', h: '완산동' }, [], { stations: ['영천경찰서'] });
// 관할 밖·대구경북 밖
t({ r1: DG, r2: '달서구', b: '본동', h: '월성1동' }, [], { stations: [], covered: false });
t({ r1: '서울특별시', r2: '중구', b: '명동', h: '명동' }, []);
// 카카오 장소 이름·주소로 관서 찾기
assert.strictEqual(P.byPlace('대구수성경찰서 지산지구대', '대구 수성구 지산동 1').tel, '053-600-6315'); n++;
assert.strictEqual(P.byPlace('중앙파출소', '경북 청도군 청도읍 고수리').tel, '054-373-3112'); n++;
assert.strictEqual(P.byPlace('중앙파출소', '경북 경산시 중방동').tel, '053-816-0112'); n++;
assert.strictEqual(P.byPlace('중앙파출소', '서울 중구 명동'), null); n++;
assert.deepStrictEqual(P.byPlace('영천경찰서 임고파출소', '경북 영천시 임고면').tels, ['054-335-7112', '054-335-1675']); n++;
// 자료 점검: 번호 형식, 같은 경찰서 안 이름 중복 없음
const seen = {};
P.UNITS.forEach(u => {
  u.tels.forEach(x => assert.ok(/^0\d{1,2}-\d{3,4}-\d{4}$/.test(x), u.name + ' 번호 ' + x));
  const k = u.station + u.name; assert.ok(!seen[k], '중복 ' + k); seen[k] = 1;
  assert.ok(u.g, u.name + ' 시군구');
});
console.log(n + '개 통과');

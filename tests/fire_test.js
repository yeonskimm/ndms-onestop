// 소방 관할 찾기 시험: node tests/fire_test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\/ ===== FIRE-START[\s\S]*?\/\/ ===== FIRE-END =====/);
const mod = { exports: {} }; new Function('module', 'exports', m[0])(mod, mod.exports); const F = mod.exports;
let n = 0;
const t = (where, expect, opt) => {
  const r = F.find(where);
  const names = r.matches.map(o => o.u.name);
  assert.deepStrictEqual(names, expect, JSON.stringify(where) + ' → ' + names.join(','));
  if (opt && 'boundary' in opt) assert.strictEqual(r.boundary, opt.boundary, '경계 ' + JSON.stringify(where));
  if (opt && opt.stations) assert.deepStrictEqual(r.stations, opt.stations);
  n++;
};
const DG = '대구광역시', GB = '경상북도';
// 대구: 법정동·행정동 섞인 표기
t({ r1: DG, r2: '중구', b: '동인동1가', h: '동인동' }, ['삼덕119안전센터'], { boundary: false, stations: ['대구중부소방서'] });
t({ r1: DG, r2: '중구', b: '서성로1가', h: '성내2동' }, ['서문로119안전센터']);
t({ r1: DG, r2: '중구', b: '남성로', h: '성내2동' }, ['서문로119안전센터']);
t({ r1: DG, r2: '중구', b: '남산동', h: '남산1동' }, ['명덕119안전센터']);
t({ r1: DG, r2: '중구', b: '남산동', h: '남산3동' }, ['남산119안전센터']);
t({ r1: DG, r2: '중구', b: '교동', h: '성내1동' }, ['삼덕119안전센터', '교동119지역대']);
t({ r1: DG, r2: '남구', b: '대명동', h: '대명2동' }, ['명덕119안전센터']);
t({ r1: DG, r2: '남구', b: '대명동', h: '대명5동' }, ['성명119안전센터', '대명119지역대']);
t({ r1: DG, r2: '동구', b: '동내동', h: '안심3동' }, ['안심119안전센터']);
t({ r1: DG, r2: '동구', b: '내동', h: '공산동' }, ['공산119안전센터']);
t({ r1: DG, r2: '북구', b: '노원동3가', h: '노원동' }, ['노원119안전센터']);
t({ r1: DG, r2: '서구', b: '원대동1가', h: '원대동' }, ['비산119안전센터']);
// 지번 범위(수성구 지산1동 910~1073-21)
t({ r1: DG, r2: '수성구', b: '지산동', h: '지산1동', lot: 950 }, ['황금119안전센터']);
t({ r1: DG, r2: '수성구', b: '지산동', h: '지산1동', lot: 500 }, ['범물119안전센터']);
t({ r1: DG, r2: '수성구', b: '지산동', h: '지산1동', lot: 1073 }, ['황금119안전센터'], { boundary: true });
// 리 단위 예외
t({ r1: DG, r2: '달성군', b: '논공읍', ri: '금포리', h: '논공읍' }, ['옥포119안전센터']);
t({ r1: DG, r2: '달성군', b: '논공읍', ri: '북리', h: '논공읍' }, ['논공119안전센터']);
t({ r1: DG, r2: '달성군', b: '다사읍', ri: '죽곡리', h: '다사읍' }, ['다사119안전센터'], { stations: ['대구강서소방서'] });
t({ r1: DG, r2: '달성군', b: '다사읍', ri: '매곡리', h: '다사읍' }, ['매곡119안전센터']);
t({ r1: DG, r2: '달성군', b: '하빈면', ri: '동곡리', h: '하빈면' }, ['매곡119안전센터']);
t({ r1: DG, r2: '달성군', b: '하빈면', ri: '현내리', h: '하빈면' }, ['매곡119안전센터', '하빈119지역대']);
t({ r1: DG, r2: '달성군', b: '가창면', ri: '용계리', h: '가창면' }, ['가창119안전센터'], { stations: ['대구수성소방서'] });
t({ r1: DG, r2: '달서구', b: '호산동', h: '신당동' }, ['다사119안전센터']);
t({ r1: DG, r2: '군위군', b: '부계면', ri: '남산리', h: '부계면' }, ['의흥119안전센터', '군위119출장소', '부계119지역대']);
// 경북
t({ r1: GB, r2: '청도군', b: '풍각면', ri: '송서리', h: '풍각면' }, ['풍각119안전센터'], { stations: ['청도소방서'] });
t({ r1: GB, r2: '청도군', b: '청도읍', ri: '부야리', h: '청도읍' }, ['청도119안전센터']);
t({ r1: GB, r2: '고령군', b: '다산면', h: '다산면' }, ['다산119안전센터']);
t({ r1: GB, r2: '고령군', b: '개진면', h: '개진면' }, ['대가야119안전센터', '개진119지역대']);
t({ r1: GB, r2: '칠곡군', b: '왜관읍', ri: '금남리', h: '왜관읍' }, ['왜관119안전센터']);
t({ r1: GB, r2: '칠곡군', b: '왜관읍', ri: '왜관리', h: '왜관읍' }, ['기산119안전센터']);
t({ r1: GB, r2: '구미시', b: '양호동', h: '양포동' }, ['원평119안전센터', '옥계119안전센터'], { boundary: true });
t({ r1: GB, r2: '구미시', b: '산동읍', ri: '봉산리', h: '산동읍' }, ['옥계119안전센터']);
t({ r1: GB, r2: '포항시 북구', b: '흥해읍', ri: '성곡리', h: '흥해읍' }, ['흥해119안전센터'], { stations: ['포항북부소방서'] });
t({ r1: GB, r2: '포항시 남구', b: '연일읍', ri: '생지리', h: '연일읍' }, ['연일119안전센터'], { stations: ['포항남부소방서'] });
t({ r1: GB, r2: '울릉군', b: '북면', ri: '천부리', h: '북면' }, ['울릉119안전센터', '북면119지역대']);
t({ r1: GB, r2: '울진군', b: '북면', ri: '부구리', h: '북면' }, ['북면119안전센터']);
t({ r1: GB, r2: '경주시', b: '강동면', ri: '양동리', h: '강동면' }, ['안강119안전센터', '양동119지역대']);
t({ r1: GB, r2: '경주시', b: '동천동', h: '동천동' }, ['황오119안전센터']);
t({ r1: GB, r2: '상주시', b: '사벌국면', ri: '화달리', h: '사벌국면' }, ['만산119안전센터']);
t({ r1: GB, r2: '영천시', b: '화남면', ri: '삼창리', h: '화남면' }, ['동부119안전센터', '화남119지역대'], { stations: ['영천소방서'] });
// 관할표에 없는 동 → 시군구로 소방서만
t({ r1: GB, r2: '청도군', b: '없는면', h: '없는면' }, [], { stations: ['청도소방서'] });
t({ r1: DG, r2: '달성군', b: '없는읍', h: '' }, [], { stations: ['대구수성소방서', '대구달성소방서', '대구강서소방서'] });
// 대구·경북 밖
const out = F.find({ r1: '서울특별시', r2: '중구', b: '명동', h: '명동' }); assert.strictEqual(out.sido, null); n++;
// 자료 점검: 단위 수, 이름 중복
const cnt = { C: 0, J: 0, O: 0 }; F.UNITS.forEach(u => cnt[u.type]++);
console.log('단위 수', cnt);
assert.strictEqual(F.UNITS.filter(u => u.sido === '경북' && u.type === 'C').length, 105);  // 경북 소방기구 현황표의 119안전센터(105)와 일치해야 함
  assert.strictEqual(new Set(F.UNITS.filter(u => u.sido === '경북').map(u => u.station)).size, 22);
// 가까운 센터 목록: 카카오 장소 이름·주소로 정리표 번호 찾기 (같은 이름은 주소로 구분)
const kp = (name, addr) => { const r = F.knownByPlace(name, addr); n++; return r && r.tel; };
assert.strictEqual(kp('노원119안전센터', '대구 북구 노원동3가 176-4'), '053-350-5750');
assert.strictEqual(kp('대구북부소방서 노원119안전센터', '대구 북구 노원동3가 176-4'), '053-350-5750');
assert.strictEqual(kp('금호119안전센터', '대구 북구 팔달동 1'), '053-607-5970');      // 대구강북 금호
assert.strictEqual(kp('금호119안전센터', '경북 영천시 금호읍 1'), '054-334-0119');    // 영천 금호
assert.strictEqual(kp('중앙119안전센터', '경북 포항시 북구 1'), null);                 // 관할 밖 같은 이름 → 정리표 안 씀
assert.strictEqual(kp('비산119안전센터', '대구 서구 비산동 1'), null);                 // 정리표에 없음 → 카카오 번호로
assert.strictEqual(kp('노원119안전센터', ''), null);                                   // 주소 없으면 판단 안 함
// 시도 119종합상황실
assert.strictEqual(F.ctrl('대구광역시', '중구').tel, '053-119');
assert.strictEqual(F.ctrl('경상북도', '청도군').tel, '054-119');
assert.strictEqual(F.ctrl('대구광역시', '군위군').tel, '053-119');
assert.ok(F.ctrl('대구광역시', '군위군').note.includes('054'));
assert.strictEqual(F.ctrl('경상북도', '경산시').tel, '054-119');
assert.ok(F.ctrl('경상북도', '경산시').note.includes('053'));
assert.strictEqual(F.ctrl('대구광역시', '수성구').note, '');
assert.strictEqual(F.ctrl('서울특별시', '중구').tel, '02-119');
assert.ok(F.ctrl('서울특별시', '중구').note.includes('🔵'));
assert.strictEqual(F.ctrl('강원특별자치도', '춘천시').tel, '033-119');
assert.strictEqual(F.ctrl('전북특별자치도', '전주시').tel, '063-119');
assert.strictEqual(F.ctrl('경상남도', '창원시').tel, '055-119');
assert.strictEqual(F.ctrl('', ''), null);
n += 13;

// 소방청 전국 안전센터 표(2026.7.1.)
assert.ok(F.NAT.length >= 1140, '전국 표 ' + F.NAT.length);
F.NAT.forEach(x => assert.ok(/^0\d{1,2}-\d{3,4}-\d{4}$/.test(x.tel), x.ce + ' 번호 ' + x.tel));
// 정리표에 없는 성주: 소방청 자료로 표시
let ti = F.telInfo('경북', '성주소방서', '성주119안전센터');
assert.strictEqual(ti.tel, '054-933-0119'); assert.strictEqual(ti.src, F.NAT_SRC);
// 같은 이름(동부119안전센터): 소방서로 구분
assert.strictEqual(F.nat('경북', '경주소방서', '동부119안전센터').st, '경주');
assert.strictEqual(F.nat('경북', '영천소방서', '동부119안전센터').st, '영천');
// 정리표가 있으면 정리표 우선, 소방청 번호가 다르면 메모
ti = F.telInfo('대구', '대구수성소방서', '범물119안전센터');
assert.strictEqual(ti.tel, '053-607-3822'); assert.ok(ti.note.includes('053-607-3820'), ti.note);
ti = F.telInfo('경북', '경산소방서', '압량119안전센터');
assert.strictEqual(ti.tel, '053-813-1119'); assert.ok(!ti.note.includes('소방청'), ti.note);
// 지역대는 소방청 자료 없음
assert.strictEqual(F.telInfo('경북', '성주소방서', '초전119지역대').tel, '');
// 카카오 장소로 찾기: 소방서 이름 붙은 표기, 다른 시도 같은 이름 구분
assert.strictEqual(F.placeInfo('성주소방서 성주119안전센터', '경북 성주군 성주읍 경산리 1').tel, '054-933-0119');
assert.strictEqual(F.placeInfo('성주119안전센터', '경상북도 성주군 성주읍').tel, '054-933-0119');
assert.strictEqual(F.placeInfo('개포119안전센터', '서울 강남구 개포동 1').tel, '02-6981-7593');
assert.strictEqual(F.placeInfo('개포119안전센터', '부산 해운대구 우동 1'), null);
assert.strictEqual(F.placeInfo('성주119지역대', '경북 성주군'), null);
assert.strictEqual(F.sidoKey('전남광주통합특별시'), '전남광주'); assert.strictEqual(F.sidoKey('광주광역시'), '전남광주');
n += 16;
console.log(`${n}개 통과`);

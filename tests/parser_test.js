// 119 메시지 파서 단위테스트: node tests/parser_test.js
// index.html 안의 PARSER-START ~ PARSER-END 부분만 꺼내 실행(실제 앱 코드와 같은 코드를 시험)
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\/ ===== PARSER-START[\s\S]*?\/\/ ===== PARSER-END =====/);
const mod = { exports: {} };
new Function('module', 'exports', m[0])(mod, mod.exports);
const P = mod.exports;
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok', name); };

// 시험용 문장(실제 메시지 형식, 번지·내용은 바꿈)
const A = `[부상-상황전파 1보] 구급
- 발생일시 : 2026-01-05 10:20:00
- 사업장명 : 파악불가
- 사고위치 : 경상북도 가상군 가상읍 시험리 123-4  
- 사고내용 : 작업 중 떨어짐(1.5m, 의식 있음, 50대 남성)
- 기타사항 : 
- 피해현황 : 부상 1명
- 기상 : 기온: 20.0℃ 강수: 0.0mm 풍속: 1.0m/s 습도: 50.0%`;
const B = `[부상-상황전파 1보] 구급
- 발생일시 : 2026-01-06 03:30:00
- 사업장명 : 파악불가
- 사고위치 : 대구광역시 가상구 시험동3가 999 
- 사고내용 : 작업 차량과 승용차량이 부딪히는 교통사고 발생(가상ic 방향)
- 기타사항 : 
- 피해현황 : 부상 1명
- 기상 : 기온: 10.0℃ 강수: 0.0mm 풍속: 0.0m/s 습도: 60.0%`;

t('A 기본 항목', () => {
  const x = P.parseAll(A)[0];
  assert.equal(x.header.kind, '부상'); assert.equal(x.header.no, 1); assert.equal(x.header.disp, '구급');
  assert.equal(x.date.disp, '2026.01.05. 10:20');
  assert.equal(x.addr.clean, '경상북도 가상군 가상읍 시험리 123-4');   // 끝 공백 제거
  assert.equal(x.addr.sido, '경북');
  assert.equal(x.biz.type, 'none');
  assert.equal(x.etc, '');
  assert.equal(x.damage, '부상 1명');
  assert.deepEqual(x.det, { height: '1.5m', cons: '의식 있음', person: '50대 남성' });
  assert.equal(x.traffic, false);
  assert.equal(x.weather.items.length, 4);
  assert.deepEqual(x.weather.items[0], ['기온', '20.0℃']);
});
t('B 교통사고·동N가', () => {
  const x = P.parseAll(B)[0];
  assert.equal(x.addr.clean, '대구광역시 가상구 시험동3가 999');
  assert.equal(x.addr.noLot, '대구광역시 가상구 시험동3가');
  assert.equal(x.traffic, true);
  assert.equal(x.det.height, undefined);   // 'IC' 표기 등에서 높이 잘못 뽑지 않음
});
t('두 건 한꺼번에', () => {
  const l = P.parseAll(A + '\n\n\n' + B);
  assert.equal(l.length, 2);
});
t('1보·2보 묶기', () => {
  const A2 = A.replace('1보', '2보').replace('의식 있음', '의식 저하');
  const l = P.parseAll(A + '\n' + A2);
  assert.equal(l.length, 1); assert.deepEqual(l[0].nos, [1, 2]); assert.equal(l[0].det.cons, '의식 저하');
});
t('사업장명 종류', () => {
  const c = s => P.classify(s);
  assert.equal(c('파악불가').type, 'none');
  assert.equal(c('').type, 'none');
  assert.equal(c('ㅇㅇ산업').type, 'company');
  const ap = c('ㅇㅇ아파트 101동');
  assert.equal(ap.type, 'place'); assert.equal(ap.q, 'ㅇㅇ아파트');
  assert.equal(c('ㅇㅇ아파트 101동 1203호').q, 'ㅇㅇ아파트');
  assert.equal(c('ㅇㅇ아파트 관리사무소').type, 'company');
  assert.equal(c('ㅇㅇ건설 ㅇㅇ아파트 신축현장').type, 'site');
  assert.equal(c('(주)ㅇㅇ').q, 'ㅇㅇ');
  assert.equal(c('부산식당').type, 'unknown');   // '산'만으로 업체 판단 안 함
});
t('주소 다듬기', () => {
  assert.equal(P.cleanAddr('경북 영천시 금노동 396-4번지').clean, '경북 영천시 금노동 396-4');
  assert.equal(P.cleanAddr('경북 가상군 ㅇㅇ면 ㅇㅇ리 산12').clean, '경북 가상군 ㅇㅇ면 ㅇㅇ리 산 12');
  const a = P.cleanAddr('대구 달서구 성서공단로 123 (ㅇㅇ공장) 앞 도로');
  assert.equal(a.clean, '대구 달서구 성서공단로 123'); assert.equal(a.road, true);
  assert.deepEqual(a.notes, ['ㅇㅇ공장', '앞 도로']);
});
t('주소 일치 판단', () => {
  assert.equal(P.matchLevel('경북 가상군 가상읍 시험리 123-4', '', '경상북도 가상군 가상읍 시험리 123-4', ''), 'exact');
  assert.equal(P.matchLevel('경북 가상군 가상읍 시험리 123-7', '', '경북 가상군 가상읍 시험리 123-4', ''), 'lot');
  assert.equal(P.matchLevel('경북 가상군 가상읍 시험리 124', '', '경북 가상군 가상읍 시험리 123-4', ''), '');
});
t('형식이 조금 다른 경우', () => {
  const x = P.parseAll('[사망-상황전파 2보]\n사고장소: 대구 서구 ㅇㅇ동 12\n사고내용 : 끼임\n(심정지 상태 이송)')[0];
  assert.equal(x.header.kind, '사망'); assert.equal(x.header.no, 2);
  assert.equal(x.addr.clean, '대구 서구 ㅇㅇ동 12');
  assert.ok(x.det.cpr);   // 다음 줄 이어붙이기
  assert.equal(P.parseAll('아무 말').filter(v => v.ok).length, 0);
});
console.log(`\n${n}개 통과`);

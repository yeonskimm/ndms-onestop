# 휴대폰 화면 흐름 시험(가짜 카카오 SDK 사용): python3 tests/ui_test.py
import pathlib, sys, json
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
MOCK = (ROOT / 'tests' / 'kakao_mock.js').read_text(encoding='utf-8')
A = """[부상-상황전파 1보] 구급
- 발생일시 : 2026-01-05 10:20:00
- 사업장명 : ㅇㅇ산업
- 사고위치 : 경상북도 가상군 가상읍 시험리 123-4
- 사고내용 : 작업 중 떨어짐(1.5m, 의식 있음, 50대 남성)
- 기타사항 :
- 피해현황 : 부상 1명
- 기상 : 기온: 20.0℃ 강수: 0.0mm 풍속: 1.0m/s 습도: 50.0%"""
B = A.replace('ㅇㅇ산업', 'ㅇㅇ아파트 101동').replace('2026-01-05 10:20', '2026-01-07 09:10')
shots = ROOT.parent / 'shots'; shots.mkdir(exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                        user_agent='Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36')
    ctx.route('https://dapi.kakao.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=MOCK))
    pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ROOT / 'index.html').as_uri())
    pg.screenshot(path=str(shots / '1_start_nokey.png'))
    assert pg.is_visible('#keyWarn')
    # 키 없이 분석 → 지도 없음 안내
    pg.fill('#raw', A); pg.click('#bGo'); pg.wait_for_timeout(200)
    assert pg.is_visible('#sDet'); assert '지도 표시 불가' in pg.inner_text('#mapMsg')
    pg.click('#sDet [data-back]'); pg.wait_for_timeout(150)
    assert pg.is_visible('#sIn')
    # 키 넣기
    pg.click('#hSet'); pg.fill('#kKey', '0123456789abcdef0123456789abcdef'); pg.click('#kSave'); pg.wait_for_timeout(300)
    assert not pg.is_visible('#shSet'); assert not pg.is_visible('#keyWarn')
    # 두 건 → 목록
    pg.fill('#raw', A + '\n\n' + B); pg.click('#bGo'); pg.wait_for_timeout(150)
    assert pg.is_visible('#sList'); assert pg.locator('#listBody .card').count() == 2
    pg.screenshot(path=str(shots / '2_list.png'))
    pg.locator('#listBody .card').nth(0).click(); pg.wait_for_timeout(400)
    assert pg.is_visible('#sDet')
    dist = pg.inner_text('#dist'); lv = pg.get_attribute('#hinge', 'data-lv')
    print('거리', dist, lv, 'viewpoint', pg.evaluate('window.__vp'))
    assert dist.endswith('m') and lv in ('near', 'mid', 'far')
    pg.screenshot(path=str(shots / '3_detail.png'))
    # 사업장 찾기
    pg.click('#bBiz'); pg.wait_for_timeout(300)
    assert pg.is_visible('#shBiz'); assert '주소 일치' in pg.inner_text('#bizBody')
    pg.screenshot(path=str(shots / '4_biz.png'))
    # 휴대폰 뒤로(=history.back) → 창 닫힘 → 현장 → 목록 → 첫 화면
    pg.go_back(); pg.wait_for_timeout(150); assert not pg.is_visible('#shBiz') and pg.is_visible('#sDet')
    pg.click('#bInfo'); pg.wait_for_timeout(150)
    assert '보고용 내용' in pg.inner_text('#infoBody'); assert '🔵 확인 필요' in pg.inner_text('#repPre')
    pg.screenshot(path=str(shots / '5_info.png'), full_page=False)
    pg.go_back(); pg.wait_for_timeout(150); assert pg.is_visible('#sDet')
    pg.go_back(); pg.wait_for_timeout(150); assert pg.is_visible('#sList') and not pg.is_visible('#sDet')
    # 장소형(아파트) 안내
    pg.locator('#listBody .card').nth(1).click(); pg.wait_for_timeout(400)
    pg.click('#bBiz'); pg.wait_for_timeout(300)
    t = pg.inner_text('#bizBody'); assert '관리사무소' in t and '건물' in t
    pg.go_back(); pg.wait_for_timeout(120); pg.go_back(); pg.wait_for_timeout(120); pg.go_back(); pg.wait_for_timeout(150)
    assert pg.is_visible('#sIn'), '첫 화면 복귀'
    # 로드뷰 없음
    pg.evaluate('window.__noRv=true'); pg.fill('#raw', A); pg.click('#bGo'); pg.wait_for_timeout(400)
    assert '로드뷰 없음' in pg.inner_text('#rvMsg') and pg.inner_text('#dist') == '없음'
    pg.screenshot(path=str(shots / '6_norv.png'))
    pg.click('#sDet [data-back]'); pg.wait_for_timeout(150)
    # 주소 못 찾음
    pg.evaluate('window.__noRv=false'); pg.fill('#raw', A.replace('경상북도 가상군 가상읍 시험리 123-4', '없는주소 1')); pg.click('#bGo'); pg.wait_for_timeout(400)
    assert '위치 확인 불가' in pg.inner_text('#mapMsg') and '오류' not in pg.inner_text('#mapMsg')
    pg.click('#sDet [data-back]'); pg.wait_for_timeout(150)
    # 카카오 오류(사용량 초과 등)는 주소 문제와 구분해 표시
    pg.fill('#raw', A.replace('경상북도 가상군 가상읍 시험리 123-4','오류주소 1')); pg.click('#bGo'); pg.wait_for_timeout(400)
    assert '서버 오류' in pg.inner_text('#mapMsg'), pg.inner_text('#mapMsg')
    pg.click('#sDet [data-back]'); pg.wait_for_timeout(150)
    # 최근 기록 표시
    assert pg.is_visible('#recent')
    pg.screenshot(path=str(shots / '7_start_recent.png'), full_page=True)
    # 공유로 열기(?text=)
    pg.goto((ROOT / 'index.html').as_uri() + '?text=' + __import__('urllib.parse').parse.quote(A)); pg.wait_for_timeout(500)
    assert pg.is_visible('#sDet'), '공유 텍스트 자동 분석'
    b.close()
print('오류', errs)
assert not errs
print('UI 시험 통과')

# ── 네이버 지도 연결 시험 ──
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
                        user_agent='Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36')
    ctx.route('https://dapi.kakao.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=MOCK))
    seen = []
    ctx.route('https://m.search.naver.com/**', lambda r: (seen.append(r.request.url), r.fulfill(status=200, content_type='text/html', body='<p>naver</p>')))
    pg = ctx.new_page(); navs = []
    pg.on('framenavigated', lambda f: navs.append(f.url))
    pg.on('console', lambda m: None)
    pg.goto((ROOT / 'index.html').as_uri())
    pg.evaluate("localStorage.setItem('ndms-onestop.kakaoKey','0123456789abcdef0123456789abcdef')")
    pg.reload(); pg.fill('#raw', A); pg.click('#bGo'); pg.wait_for_timeout(500)
    q = pg.get_attribute('#lNaver', 'data-naver')
    assert q == '경상북도 가상군 가상읍 시험리 123-4' or q.startswith('경'), q
    # nmap:// 이동 시도는 브라우저가 막으므로 오류 무시, 1.5초 뒤 네이버 검색으로 넘어가야 함(앱 없음 상황)
    try: pg.click('#lNaver')
    except Exception: pass
    pg.wait_for_timeout(2200)
    print('네이버 대체 이동:', seen[:1])
    assert seen and 'query=' in seen[0]
    b.close()
print('네이버 시험 통과')

# ── 최근 기록에 사고내용이 남지 않는지(A안) ──
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto((ROOT / 'index.html').as_uri())
    # 이전 판 형식(원문 전체)이 남아 있던 경우 → 열면 줄어들어야 함
    import json as _j
    pg.evaluate("v => localStorage.setItem('ndms-onestop.last', v)", _j.dumps({'t': 9e15, 'raw': A}))
    pg.reload(); pg.wait_for_timeout(150)
    st = pg.evaluate("localStorage.getItem('ndms-onestop.last')")
    assert '떨어짐' not in st and '50대' not in st and '부상 1명' not in st and '시험리 123-4' in st, st
    pg.evaluate("localStorage.clear()"); pg.reload()
    pg.fill('#raw', A); pg.click('#bGo'); pg.wait_for_timeout(200)
    st = pg.evaluate("localStorage.getItem('ndms-onestop.last')")
    assert '떨어짐' not in st and '50대' not in st and '기온' not in st, st
    assert '2026-01-05 10:20' in st and 'ㅇㅇ산업' in st
    pg.go_back(); pg.wait_for_timeout(150)
    assert pg.is_visible('#recent') and '시험리 123-4' in pg.inner_text('#recent')
    pg.locator('#recent .card').first.click(); pg.wait_for_timeout(200)
    assert pg.is_visible('#sDet')
    b.close()
print('최근 기록 시험 통과')


# ── 관할 소방 ──
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True,
                        user_agent='Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36')
    ctx.route('https://dapi.kakao.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=MOCK))
    pg = ctx.new_page(); errs2 = []; pg.on('pageerror', lambda e: errs2.append(str(e)))
    pg.goto((ROOT / 'index.html').as_uri())
    pg.evaluate("localStorage.setItem('ndms-onestop.kakaoKey','0123456789abcdef0123456789abcdef')"); pg.reload()
    pg.fill('#raw', A); pg.click('#bGo'); pg.wait_for_timeout(500)
    pg.click('#bFire'); pg.wait_for_timeout(500)
    t = pg.inner_text('#fireBody')
    assert '풍각119안전센터' in t and '청도소방서' in t and '054-000-1191' in t and '054-000-1190' in t, t
    assert '가상1119안전센터' in t, t
    assert t.index('경북 119종합상황실') < t.index('풍각119안전센터') and '054-119' in t and '053-119' not in t, t
    assert pg.get_attribute('#fireBody .unit.ctrl a.tel', 'href') == 'tel:054119'
    pg.screenshot(path=str(ROOT.parent / 'shots' / 'fire.png'))
    pg.go_back(); pg.wait_for_timeout(150)
    pg.click('#bInfo'); pg.wait_for_timeout(150)
    assert '관할 소방(관할표 기준): 청도소방서 풍각119안전센터' in pg.inner_text('#repPre')
    pg.go_back(); pg.wait_for_timeout(150); pg.go_back(); pg.wait_for_timeout(150)
    # 금천(카카오에 없음) → 연락처 정리표 번호로 표시, 대구·경북 밖 → 관할표 없음
    pg.evaluate("""window.__region=[{region_type:'B',region_1depth_name:'경상북도',region_2depth_name:'청도군',region_3depth_name:'금천면',region_4depth_name:'동곡리'},{region_type:'H',region_1depth_name:'경상북도',region_2depth_name:'청도군',region_3depth_name:'금천면'}]""")
    pg.fill('#raw', A.replace('2026-01-05 10:20', '2026-01-09 11:00')); pg.click('#bGo'); pg.wait_for_timeout(500)
    pg.click('#bFire'); pg.wait_for_timeout(500)
    t = pg.inner_text('#fireBody'); assert '금천119안전센터' in t and '054-372-3119' in t and '정리표' in t, t
    pg.go_back(); pg.wait_for_timeout(150); pg.go_back(); pg.wait_for_timeout(150)
    pg.evaluate("""window.__region=[{region_type:'B',region_1depth_name:'서울특별시',region_2depth_name:'중구',region_3depth_name:'명동',region_4depth_name:''}]""")
    pg.fill('#raw', A.replace('2026-01-05 10:20', '2026-01-10 11:00')); pg.click('#bGo'); pg.wait_for_timeout(500)
    pg.click('#bFire'); pg.wait_for_timeout(500)
    t = pg.inner_text('#fireBody'); assert '대구·경북 외' in t and '서울 119종합상황실' in t and '02-119' in t, t
    b.close()
    assert not errs2, errs2
print('관할 소방 시험 통과')


# ── 관할 경찰 ──
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, is_mobile=True, has_touch=True,
                        user_agent='Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36')
    ctx.route('https://dapi.kakao.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=MOCK))
    pg = ctx.new_page(); errs3 = []; pg.on('pageerror', lambda e: errs3.append(str(e)))
    pg.goto((ROOT / 'index.html').as_uri())
    pg.evaluate("localStorage.setItem('ndms-onestop.kakaoKey','0123456789abcdef0123456789abcdef')"); pg.reload()
    pg.fill('#raw', A); pg.click('#bGo'); pg.wait_for_timeout(500)
    # 하단 버튼 6개가 한 줄에 들어가고 글자가 넘치지 않음
    over = pg.evaluate("[...document.querySelectorAll('.dbar > *')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.offsetHeight > 70).map(e => e.textContent)")
    assert not over, over
    pg.screenshot(path=str(ROOT.parent / 'shots' / 'dbar6.png'))
    pg.click('#bPol'); pg.wait_for_timeout(500)
    t = pg.inner_text('#polBody')
    assert '풍각파출소' in t and '054-372-2112' in t and '청도경찰서' in t, t
    assert '인근 지구대·파출소' in t and '카카오 등록 번호 상이: 054-000-3112' in t and '가상지구대' in t, t
    assert t.index('풍각파출소') < t.index('인근 지구대')
    assert '가상119안전센터' not in t, '경찰 목록에 소방 시설 섞임'
    pg.screenshot(path=str(ROOT.parent / 'shots' / 'police.png'), full_page=True)
    pg.go_back(); pg.wait_for_timeout(150)
    pg.click('#bInfo'); pg.wait_for_timeout(150)
    assert '관할 경찰(관할표 기준): 청도경찰서 풍각파출소' in pg.inner_text('#repPre')
    pg.go_back(); pg.wait_for_timeout(150); pg.go_back(); pg.wait_for_timeout(150)
    # 대구 경계 지역(동천동: 동천지구대 전역 + 강북지구대 일부) → 후보 2곳
    pg.evaluate("""window.__region=[{region_type:'B',region_1depth_name:'대구광역시',region_2depth_name:'북구',region_3depth_name:'동천동',region_4depth_name:''},{region_type:'H',region_1depth_name:'대구광역시',region_2depth_name:'북구',region_3depth_name:'동천동'}]""")
    pg.fill('#raw', A.replace('2026-01-05 10:20', '2026-01-11 11:00')); pg.click('#bGo'); pg.wait_for_timeout(500)
    pg.click('#bPol'); pg.wait_for_timeout(500)
    t = pg.inner_text('#polBody'); assert '동천지구대' in t and '강북지구대' in t and '후보 2곳' in t and '일부 관할' in t, t
    pg.screenshot(path=str(ROOT.parent / 'shots' / 'police2.png'), full_page=True)
    pg.go_back(); pg.wait_for_timeout(150); pg.go_back(); pg.wait_for_timeout(150)
    # 관할 자료 없는 동(경산 시내)
    pg.evaluate("""window.__region=[{region_type:'B',region_1depth_name:'경상북도',region_2depth_name:'경산시',region_3depth_name:'계양동',region_4depth_name:''},{region_type:'H',region_1depth_name:'경상북도',region_2depth_name:'경산시',region_3depth_name:'동부동'}]""")
    pg.fill('#raw', A.replace('2026-01-05 10:20', '2026-01-12 11:00')); pg.click('#bGo'); pg.wait_for_timeout(500)
    pg.click('#bPol'); pg.wait_for_timeout(500)
    t = pg.inner_text('#polBody'); assert '관할 자료 미확보' in t and '경산경찰서' in t, t
    b.close()
    assert not errs3, errs3
print('관할 경찰 시험 통과')

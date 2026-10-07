// 시험용 가짜 카카오 지도 SDK(화면 흐름 확인용). 실제 배포에는 쓰지 않음
window.kakao = { maps: (function () {
  function LatLng(a, b) { this.a = a; this.b = b; } LatLng.prototype.getLat = function () { return this.a; }; LatLng.prototype.getLng = function () { return this.b; };
  var listeners = [];
  function Map(el, o) { this.el = el; this.c = o.center; this.lv = o.level; el.style.background = 'repeating-linear-gradient(45deg,#E3E7EB 0 12px,#EEF1F3 12px 24px)'; el.innerHTML = '<div style="position:absolute;left:8px;bottom:8px;font:12px sans-serif;color:#555">가짜 지도</div>'; this.ovl = document.createElement('div'); this.ovl.style.cssText = 'position:absolute;left:50%;top:50%'; el.appendChild(this.ovl); }
  Map.prototype = { addOverlayMapTypeId() {}, removeOverlayMapTypeId() {}, setMapTypeId() {}, relayout() {}, setLevel(l) { this.lv = l; }, getLevel() { return this.lv; }, setCenter(c) { this.c = c; }, setBounds() { this.lv = 2; }, getCenter() { return this.c; } };
  function Roadview(el) { this.el = el; el.style.background = 'linear-gradient(#9DB7D3,#C9D6E2 55%,#8E8F84 55%)'; el.innerHTML = '<div style="position:absolute;left:8px;bottom:8px;font:12px sans-serif;color:#222">가짜 로드뷰</div>'; }
  Roadview.prototype = { relayout() {}, setPanoId(id, p) { var s = this; s.pos = new LatLng(p.getLat() + 0.0002, p.getLng() + 0.0001); setTimeout(function () { listeners.forEach(function (l) { if (l.t === s && (l.e === 'init')) l.f(); }); }, 30); }, getPosition() { return this.pos; }, setViewpoint(v) { this.vp = v; window.__vp = v; } };
  function RoadviewClient() {} RoadviewClient.prototype.getNearestPanoId = function (p, r, cb) { setTimeout(function () { cb(window.__noRv ? null : 1234); }, 10); };
  var K = 400000; // 화면 배치용: 0.0001도 ≈ 40px
  function px(m, p) { return { x: (p.getLng() - m.c.getLng()) * K, y: -(p.getLat() - m.c.getLat()) * K }; }
  function CustomOverlay(o) { this.o = o; this.p = o.position; }
  CustomOverlay.prototype = { setMap(m) { this.m = m; if (!m) { if (this.o.content.parentNode) this.o.content.parentNode.removeChild(this.o.content); return; } if (!this.o.content.parentNode) m.ovl.appendChild(this.o.content); this.draw(); }, setPosition(p) { this.p = p; this.draw(); },
    draw() { if (!this.m || !this.p) return; var q = px(this.m, this.p); this.o.content.style.position = 'absolute'; this.o.content.style.left = q.x + 'px'; this.o.content.style.top = q.y + 'px'; } };
  function Polyline() { this.el = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.el.setAttribute('style', 'position:absolute;left:0;top:0;overflow:visible;width:1px;height:1px'); }
  Polyline.prototype = { setPath(a) { this.a = a; this.draw(); }, setMap(m) { this.m = m; if (m && !this.el.parentNode) m.ovl.insertBefore(this.el, m.ovl.firstChild); if (!m && this.el.parentNode) this.el.parentNode.removeChild(this.el); this.draw(); },
    draw() { if (!this.m || !this.a) return; var p = px(this.m, this.a[0]), q = px(this.m, this.a[1]); this.el.innerHTML = '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '" stroke="#1D6ED8" stroke-width="3" stroke-dasharray="6 5"/>'; } };
  function LatLngBounds() {} LatLngBounds.prototype.extend = function () {};
  var Status = { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' };
  function Geocoder() {}
  Geocoder.prototype.addressSearch = function (q, cb) { setTimeout(function () {
    if (/없는주소/.test(q)) return cb([], Status.ZERO_RESULT);
    if (/오류주소/.test(q)) return cb([], Status.ERROR);
    cb([{ x: '128.73', y: '35.65', address_type: 'REGION_ADDR', address: { address_name: q.replace('경상북도', '경북').replace('대구광역시', '대구') }, road_address: { address_name: '경북 가상군 가상읍 시험로 12' } }], Status.OK); }, 10); };
  Geocoder.prototype.coord2Address = function (x, y, cb) { cb([], Status.ZERO_RESULT); };
  Geocoder.prototype.coord2RegionCode = function (x, y, cb) { setTimeout(function () { cb(window.__region || [
    { region_type: 'B', region_1depth_name: '경상북도', region_2depth_name: '청도군', region_3depth_name: '풍각면', region_4depth_name: '송서리' },
    { region_type: 'H', region_1depth_name: '경상북도', region_2depth_name: '청도군', region_3depth_name: '풍각면', region_4depth_name: '' }], Status.OK); }, 10); };
  function Places() {}
  Places.prototype.keywordSearch = function (q, cb) { setTimeout(function () {
    if (/없는주소/.test(q)) return cb([], Status.ZERO_RESULT);
    if (/오류주소/.test(q)) return cb([], Status.ERROR);
    if (q === '119안전센터') return cb([1, 2, 3].map(function (i) { return { id: 'n' + i, place_name: '가상' + i + '119안전센터', phone: '054-000-90' + i + '0', address_name: '경북 가상군', distance: String(i * 1500), place_url: '' }; }), Status.OK);
    // 실제 카카오처럼 소방 시설이 섞여 나오는 경우(걸러져야 함)
    if (q === '지구대') return cb([{ id: 'p1', place_name: '청도경찰서 가상지구대', phone: '054-000-2112', address_name: '경북 청도군 가상면', distance: '3200', place_url: '' },
      { id: 'f9', place_name: '가상119안전센터', phone: '', address_name: '경북 청도군 가상면', distance: '1200', category_name: '사회,공공기관 > 행정기관 > 소방서 > 119안전센터', place_url: '' }], Status.OK);
    if (q === '파출소') return cb([{ id: 'p2', place_name: '청도경찰서 풍각파출소', phone: '054-000-3112', address_name: '경북 청도군 풍각면 송서리', distance: '900', place_url: '' }], Status.OK);
    if (/119안전센터|119지역대|119출장소|소방서/.test(q)) {
      var last = q.split(' ').pop();
      if (/금천|무태/.test(q)) return cb([], Status.ZERO_RESULT);
      // 점검 시험용: 주소에 관할 시군구 이름을 모두 넣어 지역 조건을 통과시킴
      var addr = '경북 청도군 풍각면 (시험: 중구 수성구 동구 북구 군위군 경산시 영천시 청도군)';
      return cb([{ id: 'f' + last, place_name: (/소방서/.test(last) ? '' : '청도소방서 ') + last, phone: /부계/.test(q) ? '' : (/소방서/.test(last) ? '054-000-1190' : '054-000-1191'), address_name: addr, distance: '2300', place_url: '' }], Status.OK);
    }
    if (/관리사무소/.test(q)) return cb([{ id: '9', place_name: 'ㅇㅇ아파트 관리사무소', phone: '054-000-1111', address_name: '경북 가상군 가상읍 시험리 123-4', road_address_name: '', distance: '35', category_name: '부동산 > 관리사무소', place_url: 'https://place.map.kakao.com/9' }], Status.OK);
    if (/아파트/.test(q)) return cb([{ id: '8', place_name: 'ㅇㅇ아파트', phone: '', address_name: '경북 가상군 가상읍 시험리 123-4', road_address_name: '', distance: '10', category_name: '부동산 > 아파트', place_url: '' }], Status.OK);
    if (/시험동3가|가상구/.test(q)) return cb([], Status.ZERO_RESULT);
    cb([{ id: '1', place_name: 'ㅇㅇ산업', phone: '054-000-0000', address_name: '경북 가상군 가상읍 시험리 123-4', road_address_name: '', distance: '12', category_name: '산업 > 제조', place_url: 'https://place.map.kakao.com/1' },
        { id: '2', place_name: '△△기계', phone: '', address_name: '경북 가상군 가상읍 시험리 130', road_address_name: '', distance: '140', category_name: '', place_url: '' }], Status.OK); }, 10); };
  return { load: function (f) { f(); }, LatLng: LatLng, Map: Map, Roadview: Roadview, RoadviewClient: RoadviewClient, CustomOverlay: CustomOverlay, Polyline: Polyline, LatLngBounds: LatLngBounds,
    MapTypeId: { ROADMAP: 1, HYBRID: 2, ROADVIEW: 3 }, event: { addListener: function (t, e, f) { listeners.push({ t: t, e: e, f: f }); } },
    services: { Geocoder: Geocoder, Places: Places, Status: Status, SortBy: { DISTANCE: 'd' } } };
})() };

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
  function Places() {}
  Places.prototype.keywordSearch = function (q, cb) { setTimeout(function () {
    if (/없는주소/.test(q)) return cb([], Status.ZERO_RESULT);
    if (/오류주소/.test(q)) return cb([], Status.ERROR);
    if (/관리사무소/.test(q)) return cb([{ id: '9', place_name: 'ㅇㅇ아파트 관리사무소', phone: '054-000-1111', address_name: '경북 가상군 가상읍 시험리 123-4', road_address_name: '', distance: '35', category_name: '부동산 > 관리사무소', place_url: 'https://place.map.kakao.com/9' }], Status.OK);
    if (/아파트/.test(q)) return cb([{ id: '8', place_name: 'ㅇㅇ아파트', phone: '', address_name: '경북 가상군 가상읍 시험리 123-4', road_address_name: '', distance: '10', category_name: '부동산 > 아파트', place_url: '' }], Status.OK);
    if (/시험동3가|가상구/.test(q)) return cb([], Status.ZERO_RESULT);
    cb([{ id: '1', place_name: 'ㅇㅇ산업', phone: '054-000-0000', address_name: '경북 가상군 가상읍 시험리 123-4', road_address_name: '', distance: '12', category_name: '산업 > 제조', place_url: 'https://place.map.kakao.com/1' },
        { id: '2', place_name: '△△기계', phone: '', address_name: '경북 가상군 가상읍 시험리 130', road_address_name: '', distance: '140', category_name: '', place_url: '' }], Status.OK); }, 10); };
  return { load: function (f) { f(); }, LatLng: LatLng, Map: Map, Roadview: Roadview, RoadviewClient: RoadviewClient, CustomOverlay: CustomOverlay, Polyline: Polyline, LatLngBounds: LatLngBounds,
    MapTypeId: { ROADMAP: 1, HYBRID: 2, ROADVIEW: 3 }, event: { addListener: function (t, e, f) { listeners.push({ t: t, e: e, f: f }); } },
    services: { Geocoder: Geocoder, Places: Places, Status: Status, SortBy: { DISTANCE: 'd' } } };
})() };

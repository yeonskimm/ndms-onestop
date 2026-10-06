// 저장소의 index.html에 실제 카카오 키가 들어가지 않았는지 확인: node tests/check_key_placeholder.js index.html
// (실제 키는 배포 때 GitHub 비밀값으로만 넣음)
const fs = require('fs');
const s = fs.readFileSync(process.argv[2] || 'index.html', 'utf8');
const m = s.match(/var DEFAULT_KEY = '([^']*)'/);
if (!m) { console.error('DEFAULT_KEY 줄이 없음'); process.exit(1); }
if (m[1] !== '__KAKAO_JS_KEY__') { console.error('저장소에 실제 키 같은 값이 들어 있음 → 자리표시 __KAKAO_JS_KEY__ 로 되돌리세요'); process.exit(1); }
console.log('통과: 자리표시만 있음');

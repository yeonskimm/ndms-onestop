# 경찰청 누리집에서 지구대·파출소 연락처 페이지를 찾아 저장(자료 수집용)
import re, sys, os, urllib.request, urllib.parse, http.cookiejar, time
base, start, out, maxn = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
os.makedirs(out, exist_ok=True)
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36')]
KEY = re.compile(r'지구대|파출소|연락처|전화번호|조직|부서|관서|찾아오시는|오시는')
seen, q, n, log = set(), [(u, 'seed', 1) for u in sys.argv[5:]] + [(start, 'start', 0)], 0, open(os.path.join(out, '_log.txt'), 'w')
while q and n < maxn:
    url, why, d = q.pop(0)
    if url in seen: continue
    seen.add(url)
    t = None
    for k in range(4):
        try:
            r = op.open(url, timeout=25); b = r.read(); ct = r.headers.get_content_charset() or 'utf-8'
            t = b.decode(ct, 'replace'); break
        except Exception as e:
            err = e; time.sleep(5 * (k + 1))
    if t is None:
        log.write('ERR %s %s\n' % (url, err)); log.flush(); continue
    n += 1
    fn = '%04d.html' % n
    open(os.path.join(out, fn), 'w', encoding='utf-8').write('<!-- ' + url + ' -->\n' + t)
    log.write('%s %s d%d %s\n' % (fn, url, d, why))
    m = re.search(r'location\.href\s*=\s*"([^"]+)"', t)
    if m and len(t) < 2000: q.insert(0, (urllib.parse.urljoin(url, m.group(1)), 'redirect', d))
    if d >= 4: continue
    for a in re.finditer(r'<a\b[^>]*href="([^"#]+)"[^>]*>(.*?)</a>', t, re.S):
        h, txt = a.group(1), re.sub(r'<[^>]+>|\s+', ' ', a.group(2)).strip()
        if h.startswith('javascript') or h.startswith('mailto'): continue
        u = urllib.parse.urljoin(url, h)
        if base not in u: continue
        if KEY.search(txt) or KEY.search(urllib.parse.unquote(u)) or (d == 0 and re.search('경찰서', txt)):
            q.append((u, txt[:30], d + 1))
    time.sleep(2.5)
log.close()

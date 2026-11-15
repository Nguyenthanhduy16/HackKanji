#!/usr/bin/env python3
"""n2build.py — build the JLPT N2 past-exam app data from the Google Drive folder.

Website use (NhaiKanji, see docs/JLPT-PAST-PAPERS.md) — run from the repository root:
  python3 scripts/jlpt/n2build.py list                 # Drive folders; "MỚI" = not built yet
  python3 scripts/jlpt/n2build.py fetch [TAG ...]      # download exam/script/mp3 + answer PDF into .local/jlpt-work/
  python3 scripts/jlpt/n2build.py build --web [TAG ...]
        # writes public/jlpt/n2/exams/TAG.json, images and audio/TAG.mp3 (the original mp3, copied),
        # validates question counts against the answer PDF, updates the indexes.
Artifact use (claude.ai page with an asset store): build without --web cuts audio into <=20 MB mp4 pieces,
then `link TAG blobs.txt` writes the uploaded /_blob/ urls. Env N2_WORK / N2_OUT override the folders.
Requirements: Python 3.10+, `pip install pymupdf pillow`, ffmpeg (libx264 only for non-web builds).
The generated content is copyrighted exam material: keep it out of the public repository.
"""
import os, sys, re, json, glob, io, math, subprocess, html, collections, unicodedata, hashlib
import pymupdf
from PIL import Image

ROOT_FOLDER = "1Gh1A9KASgurEu1-EEYswxyTN7f8ABz-9"   # Drive: "N2" folder with one sub-folder per exam
WEB = "--web" in sys.argv
if WEB: sys.argv.remove("--web")
WORK = os.environ.get("N2_WORK", ".local/jlpt-work" if WEB else "work")   # downloads + intermediate files
OUT = os.environ.get("N2_OUT", "public/jlpt/n2" if WEB else "out")        # generated content
LEVEL = os.environ.get("N2_LEVEL", "N2")
UA = ["-A", "Mozilla/5.0"]

def sh(cmd, **kw): return subprocess.run(cmd, capture_output=True, text=True, **kw)

# ----------------------------------------------------------------- Drive
def drive_list(folder_id):
    h = sh(["curl", "-sS", "-L"] + UA + [f"https://drive.google.com/embeddedfolderview?id={folder_id}"]).stdout
    return [(m.group(1), html.unescape(m.group(2))) for m in
            re.finditer(r'id="entry-([^"]+)".*?<div class="flip-entry-title">(.*?)</div>', h, re.S)]
def drive_get(fid, out):
    r = sh(["curl", "-sS", "-L"] + UA + [f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t", "-o", out, "-w", "%{http_code}"])
    if r.stdout.strip() != "200": raise SystemExit(f"download failed {fid} -> {out}: {r.stdout} {r.stderr}")
def tag_of(name):
    m = re.search(r'(\d{1,2})\s*[-.]\s*(\d{4})', name)
    return f"{m.group(2)}-{int(m.group(1)):02d}" if m else None
def tag_label(tag): y, m = tag.split("-"); return f"{int(m)}/{y}"

# ----------------------------------------------------------------- PDF -> text rows (furigana dropped, underlines kept)
def extract(path):
  doc=pymupdf.open(path)
  cnt=collections.Counter()
  for p in doc:
    for b in p.get_text("dict")["blocks"]:
      for l in b.get("lines",[]):
        for s in l["spans"]: cnt[round(s["size"],1)]+=len(s["text"].strip())
  main=cnt.most_common(1)[0][0]; thr=main*0.72
  pages=[]
  for pi,p in enumerate(doc):
    chars=[]
    for b in p.get_text("rawdict")["blocks"]:
      for l in b.get("lines",[]):
        if l["dir"][0]<0.9: continue
        for s in l["spans"]:
          if s["size"]<thr: continue
          for c in s["chars"]:
            x0,y0,x1,y1=c["bbox"]; chars.append([x0,x1,c["origin"][1],c["c"],s["size"]])
    rects=[]
    for d in p.get_drawings():
      for it in d["items"]:
        if it[0]=="re": r=it[1]
        elif it[0]=="l": r=pymupdf.Rect(it[1],it[2]); r.y1=max(r.y1,r.y0+0.1)
        else: continue
        if r.height<=1.8 and r.width>=5: rects.append((r.x0,r.x1,(r.y0+r.y1)/2))
    # rows by baseline
    chars.sort(key=lambda c:(c[2],c[0]))
    rows=[]
    for c in chars:
      if rows and abs(rows[-1]["y"]-c[2])<3.5: rows[-1]["c"].append(c)
      else: rows.append({"y":c[2],"c":[c]})
    # merge rows whose baselines close (sorted ensures)
    used=set()
    for r in rows:
      r["c"].sort(key=lambda c:c[0])
      fs=max(c[4] for c in r["c"])
      ul=[(i,R) for i,R in enumerate(rects) if r["y"]-1<=R[2]<=r["y"]+fs*0.55]
      marks=[False]*len(r["c"]); blanks=[]
      for i,R in ul:
        hit=[k for k,c in enumerate(r["c"]) if c[3].strip() and (c[0]+c[1])/2>R[0] and (c[0]+c[1])/2<R[1]]
        if hit:
          if all(re.fullmatch(r'[0-9０-９]',r["c"][k][3]) for k in hit): continue
          for k in hit: marks[k]=True
          used.add(i)
        elif R[1]-R[0]>14: blanks.append(R); used.add(i)
      # merge adjacent blank segments
      blanks.sort(); mb=[]
      for B in blanks:
        if mb and B[0]-mb[-1][1]<3: mb[-1]=(mb[-1][0],max(B[1],mb[-1][1]),B[2])
        else: mb.append(B)
      items=[(c[0],c[1],c[3],marks[k]) for k,c in enumerate(r["c"])]+[(B[0],B[1],"\x00",False) for B in mb if B[1]-B[0]>14]
      items.sort(key=lambda t:t[0])
      s="";prev=None;inu=False
      for x0,x1,ch,m in items:
        if prev is not None and x0-prev>fs*0.9 and not s.endswith(" "): s+=" "
        if m and not inu: s+="<u>";inu=True
        if not m and inu and ch.strip(): s+="</u>";inu=False
        s+="[_]" if ch=="\x00" else ch
        prev=x1
      if inu: s+="</u>"
      s=re.sub(r'(</u>)(\s*)<u>',r'\2',s)
      s=re.sub(r'<u>(\s*)</u>',r'\1',s)
      s=re.sub(r'[ 　]+',' ',s).strip()
      if s: r["t"]=s
    pages.append([{"y":round(r["y"],1),"x":round(r["c"][0][0]),"x1":round(r["c"][-1][1]),"fs":round(max(c[4] for c in r["c"]),1),"t":r["t"]} for r in rows if r.get("t")])
  return pages

# ----------------------------------------------------------------- rows -> mondai/questions

FW = str.maketrans("０１２３４５６７８９", "0123456789")
def nk(s): return s.translate(FW)

def plain(t): return re.sub(r'</?u>', '', t)

SEC = {"文字・語彙": "goi", "文字語彙": "goi", "文法": "bun", "読解": "dok", "聴解": "listen"}

def is_header_row(r, pagew=595):
    t = plain(r["t"])
    if re.fullmatch(r'(JLPT\s*[・ ]?\s*)?N2\s*[・ ]?\s*\d{1,2}\s*/\s*\d{4}', t.replace('・', ' ').strip()): return True
    if re.fullmatch(r'\d{1,2}', t.strip()) and r["x"] > 250: return True  # page number
    return False

def sec_of(t):
    s = re.sub(r'[\s.。．]', '', plain(t))
    return SEC.get(s)

OPT_RE = r'(?:^|(?<=\s))[{d}{f}](?=\s|$)'
def find_label(t, k, start=0):
    f = "０１２３４５６７８９"[k]
    m = re.compile(r'(?:^|(?<=[\s(（]))[%d%s](?=[\s　]|$)' % (k, f)).search(t, start)
    return m

def split_options(t, first):
    """t starts with label `first`. returns list of (label, text)."""
    out = []
    k = first
    m = find_label(t, k)
    if not m or m.start() > 1: return None
    pos = m.end()
    while True:
        nxt = find_label(t, k + 1, pos) if k < 4 else None
        if nxt:
            out.append((k, t[pos:nxt.start()].strip()))
            pos = nxt.end(); k += 1
        else:
            out.append((k, t[pos:].strip())); break
    return out

NOTLAB = r'(?:[0-9０-９])'
def opt_tokens(t):
    res = []
    for m in re.finditer(r'[1-4１-４]', t):
        i = m.start(); ch = t[i]; fw = ch in "１２３４"
        prev = t[i-1] if i > 0 else " "
        nxt = t[i+1] if i+1 < len(t) else " "
        if prev.isdigit() or nxt.isdigit() or prev in "０１２３４５６７８９": continue
        if not fw:
            if prev.isascii() and not prev.isspace() and i > 0: continue
            if not nxt.isspace(): continue
        if prev in "<>/[_": continue
        if re.match(NOTLAB, t[i+1:]) and i > 0: continue
        if re.match(r'^\s*$', t[i+1:]) : continue
        k = int(nk(ch))
        if res and k <= res[-1][1]: continue
        if res and not t[res[-1][0]+1:i].strip(): continue
        res.append((i, k))
    return res
def assign(toks, t):
    out = []
    for j, (i, k) in enumerate(toks):
        end = toks[j+1][0] if j+1 < len(toks) else len(t)
        out.append((k, t[i+1:end].strip()))
    return out

def classify(sec, no, instr, opts):
    s = plain(instr)
    if sec == "goi":
        if "読み方" in s: return "yomi"
        if "漢字" in s and "書" in s: return "hyouki"
        if "意味が最も近い" in s or "意味がもっとも近い" in s: return "iikae"
        if "使い方" in s: return "youhou"
        if no == 3: return "gokeisei"
        return "bunmyaku"
    if sec == "bun":
        if "★" in s: return "narabe"
        if "文章全体" in s or "文章" in s and "全体" in s: return "bunshou"
        return "keishiki"
    if sec == "dok":
        return {10: "tanbun", 11: "chuubun", 12: "tougou", 13: "shuchou", 14: "jouhou"}.get(no, "dok%d" % no)
    return "other"

def para_html(rows):
    """rows: list of row dicts -> html paragraphs"""
    if not rows: return ""
    xs = sorted(r["x"] for r in rows)
    base = xs[len(xs) // 4]
    right = sorted(r["x1"] for r in rows)[int(len(rows) * 0.8)] if len(rows) > 2 else max(r["x1"] for r in rows)
    out = []; cur = ""; prev = None
    for r in rows:
        t = r["t"]; fs = r.get("fs", 11)
        newp = False; br = False
        p = plain(t)
        if prev is None: newp = True
        elif re.match(r'^[（(]注', p) or re.match(r'^[（(][0-9０-９]+[）)]$', p) or re.fullmatch(r'[AＡBＢ]', p.strip()): newp = True
        elif r["x"] > base + fs * 0.6: newp = True
        elif prev["x1"] < right - fs * 2.2: br = True
        if newp:
            if cur: out.append(cur)
            cur = t
        elif br:
            cur += "<br>" + t
        else:
            if re.search(r'[A-Za-z0-9,.]$', plain(cur)) and re.match(r'[A-Za-z0-9]', p): cur += " "
            cur += t
        prev = r
    if cur: out.append(cur)
    res = []
    for c in out:
        pc = plain(c)
        if re.match(r'^[（(]注', pc): res.append('<p class="note">%s</p>' % c)
        elif re.fullmatch(r'[（(][0-9０-９]+[）)]|[AＡBＢ]', pc.strip()): res.append('<p class="label">%s</p>' % c)
        else: res.append('<p>%s</p>' % c)
    return "".join(res)

def tidy(t):
    t = re.sub(r'_*★_*', '[★]', t) if re.search(r'_★|★_', t) else t
    t = re.sub(r'_{3,}', '[_]', t)
    t = t.replace("<u>★ </u>", "[★]").replace("<u>★</u>", "[★]").replace("<u> ★ </u>", "[★]")
    t = re.sub(r'\[_\]\s*\.', '[_]', t)
    t = re.sub(r'(\[_\]|\[★\])\s*(?=(\[_\]|\[★\]))', r'\1 ', t)
    t = re.sub(r'\(\s*\)|（\s*）', '（　　）', t)
    return t.strip()

def parse(rows_path, answers):
    pages = json.load(open(rows_path, encoding="utf-8"))
    rows = []
    for pi, pg in enumerate(pages):
        for r in pg:
            if is_header_row(r): continue
            r = dict(r); r["page"] = pi; rows.append(r)
    sec = None; mondai = []; cur_m = None; cur_q = None; buf = []
    expect = 1; maxq = max(answers) if answers else 0
    instr_open = False
    problems = []
    def close_q():
        nonlocal cur_q
        cur_q = None
    def flush_tail():
        nonlocal buf
        if cur_m is not None and buf and cur_m["qs"]:
            cur_m.setdefault("groups", []).append(para_html(buf))
            gi = len(cur_m["groups"]) - 1
            for q in cur_m["qs"]:
                if q["g"] == -1: q["g"] = gi
            buf = []
    off = 0
    for r in rows:
        t = r["t"]
        t = re.sub(r'^<u>\s*([0-9０-９]{1,2})[.．a]?\s*</u>\s*', r'\1 ', t).strip()
        t = re.sub(r'^<u>([0-9０-９]{1,2})\s+', r'\1 <u>', t)
        r["t"] = t
        p = plain(t).strip()
        s = sec_of(t)
        if s:
            flush_tail()
            sec = s
            if s == "listen": break
            continue
        if sec is None: continue
        m = re.match(r'^(?:問題|題題|間題|問\s*題)\s*([0-9０-９]+)\s*(.*)$', p)
        if m and int(nk(m.group(1))) <= 15 and (cur_m is None or int(nk(m.group(1))) != cur_m["no"]):
            close_q(); flush_tail(); off = 0
            no = int(nk(m.group(1)))
            instr = re.sub(r'^(?:問題|題題|間題|問\s*題)\s*[0-9０-９]+\s*', '', t)
            cur_m = {"sec": sec, "no": no, "instr": instr, "qs": [], "pages": [r["page"]]}
            mondai.append(cur_m); buf = []
            instr_open = not plain(instr).rstrip().endswith("。")
            continue
        if cur_m is None: continue
        if r["page"] not in cur_m["pages"]: cur_m["pages"].append(r["page"])
        if instr_open:
            cur_m["instr"] += t; instr_open = not p.endswith("。"); continue
        cloze = "全体" in plain(cur_m["instr"])
        toks = opt_tokens(t)
        is_opt = bool(toks) and toks[0][0] == 0
        qm = re.match(r'^([0-9０-９]{1,2})[.．]?(?:\s+(.*)|)$', t) or re.match(r'^([0-9０-９]{1,2})(\[_\].*|\s*（.*|<u>.*)$', t)
        qn = int(nk(qm.group(1))) if qm else -99
        if qm and not cur_m["qs"] and expect <= maxq and qn != expect and -3 <= qn - expect <= -1 and (qm.group(2) or "").strip():
            off = expect - qn
        qstart = bool(qm) and qn + off == expect and expect <= maxq
        if qstart and cloze:
            rest = (qm.group(2) or "").strip()
            qstart = bool(re.fullmatch(r'[。.．\s]*', rest)) or bool(re.match(r'^[1１]\s', rest))
        if qstart and not cloze and cur_q is None and cur_m["sec"]!="dok" and False: pass
        if cur_q is not None and cur_q["filled"] < 4:
            if is_opt:
                cur_q["lr"] = (r["page"], r["y"], r["x"], r.get("fs", 11))
                for k, txt in assign(toks, t):
                    slot = k if cur_q["o"][k-1] is None else next((i+1 for i in range(4) if cur_q["o"][i] is None), None)
                    if slot is None: break
                    cur_q["o"][slot-1] = txt; cur_q["filled"] += 1; cur_q["last"] = slot
                continue
            if qstart and cur_q["filled"] > 0:
                problems.append(("cut", cur_q["n"]))
            elif cur_q["filled"] > 0:
                cur_q["o"][cur_q["last"]-1] += t; continue
            else:
                if cur_q["q"] and (re.match(r'^[A-ZＡ-Ｚ]\s*[「:：]', p) or re.match(r'^\S{1,6}\s*「', p) or p.startswith("（") and plain(cur_q["q"]).rstrip().endswith("）")):
                    cur_q["q"] += "<br>" + t
                else:
                    cur_q["q"] += t
                continue
        lr = cur_q.get("lr") if cur_q is not None else None
        if (not qstart and lr and lr[0] == r["page"] and 0 < r["y"] - lr[1] < lr[3] * 2.0 and r["x"] > lr[2] + 4 and not is_opt):
            cur_q["o"][cur_q["last"]-1] += t; cur_q["lr"] = (r["page"], r["y"], lr[2], lr[3]); continue
        if qstart:
            if cloze and qm.group(2) and re.match(r'^[1１]\s', qm.group(2).strip()):
                rest_t = qm.group(2).strip()
            else:
                rest_t = None
            if rest_t is None and cloze: qm = None
            q = {"n": expect, "q": "" if cloze else (qm.group(2) or "").strip(), "o": [None]*4, "filled": 0, "last": 1}
            if buf:
                cur_m.setdefault("groups", []).append(para_html(buf)); buf = []
            q["g"] = len(cur_m.get("groups", [])) - 1 if cur_m.get("groups") else -1
            cur_m["qs"].append(q); cur_q = q; expect += 1
            if rest_t:
                for k, txt in assign(opt_tokens(rest_t), rest_t):
                    q["o"][k-1] = txt; q["filled"] += 1; q["last"] = k
            continue
        # otherwise passage text
        cur_q = None
        buf.append(r)
    flush_tail()
    out = []
    for m in mondai:
        if not m["qs"]: continue
        for q in m["qs"]:
            q["q"] = tidy(q["q"]); q["o"] = [tidy(o or "") for o in q["o"]]; q.pop("filled",None); q.pop("last",None)
            q["a"] = answers.get(q["n"])
            if len(q["o"]) != 4 or any(not o for o in q["o"]): problems.append(("opts", q["n"], q["o"]))
            if q["a"] is None: problems.append(("noans", q["n"]))
            q.pop("ox", None)
        m["type"] = classify(m["sec"], m["no"], m["instr"], m["qs"][0]["o"])
        m["instr"] = tidy(m["instr"])
        out.append(m)
    got = [q["n"] for m in out for q in m["qs"]]
    if got != list(range(1, maxq + 1)): problems.append(("missing", [n for n in range(1, maxq + 1) if n not in got]))
    return out, problems


# ----------------------------------------------------------------- answer PDF ("ĐÁP ÁN JLPT N2 ...pdf", one exam per page)
def parse_answer_pdf(path):
    """returns {tag: {"main": {n: ans}, "listen": {mondai_no: [[label, ans], ...]}}}"""
    d = pymupdf.open(path); out = {}
    N = lambda s: unicodedata.normalize('NFKC', s)
    for p in d:
        ws = p.get_text("words")
        hdr = [w for w in ws if re.match(r'\d{1,2}/\d{4}', w[4])]
        if not hdr: continue
        mo, yr = hdr[0][4].split('/'); tag = f"{yr}-{int(mo):02d}"
        chs = [w[1] for w in ws if '聴解' in w[4]]; ch = min(chs) if chs else 1e9
        # language knowledge + reading: header number with answer right below
        nums = [(N(w[4]), (w[0]+w[2])/2, w[1]) for w in ws if w[1] < ch and re.fullmatch(r'[0-9]+', N(w[4]))]
        main = {}
        for t, cx, y in nums:
            below = [a for a in nums if abs(a[1]-cx) < 8 and 10 < a[2]-y < 22 and a[0] in '1234' and len(a[0]) == 1]
            if below: main[int(t)] = int(below[0][0])
        # listening: numbering restarts per mondai; mondai labels １–５ sit left of each grid
        labels = [(int(N(w[4])), w[0], w[1]) for w in ws if w[1] > ch and w[4] in '１２３４５' and (w[0] < 70 or 290 < w[0] < 310)]
        W = [(N(w[4]), (w[0]+w[2])/2, w[1], w[0]) for w in ws if ch < w[1] < p.rect.height-80]
        lnums = [(t, cx, y) for t, cx, y, x0 in W if re.fullmatch(r'\d{1,2}', t) and x0 > 75 and not (290 < x0 < 310)]
        res = {}
        for t, cx, y in lnums:
            below = [a for a in lnums if abs(a[1]-cx) < 8 and 10 < a[2]-y < 22 and a[0] in '1234']
            split = [a for a in lnums if 10 < a[2]-y < 22 and a[0] in '1234' and 12 < abs(a[1]-cx) < 26]
            if below: cells = [(t, below[0])]
            elif len(split) == 2 and not any(abs(b[1]-cx) < 8 for b in lnums if 10 < b[2]-y < 22):
                s2 = sorted(split, key=lambda a: a[1]); cells = [(t+'-1', s2[0]), (t+'-2', s2[1])]
            else: continue
            for lab, a in cells:
                block = 0 if a[1] < 290 else 1
                cand = [l for l in labels if (l[1] < 290) == (block == 0)]
                if not cand: continue
                m = min(cand, key=lambda l: abs(l[2]-a[2]))[0]
                res.setdefault(m, []).append((lab, int(a[0]), a[2], a[1]))
        listen = {}
        for m, v in sorted(res.items()):
            v.sort(key=lambda r: (r[2], r[3])); seq = []; exp = 1
            for lab, a, _, _ in v:
                base = int(lab.split('-')[0])
                if base == exp or (base == exp-1 and lab.endswith('-2') and seq and seq[-1][0].endswith('-1')):
                    seq.append([lab, a]); exp = base+1 if not lab.endswith('-1') else base
            listen[m] = seq
        out[tag] = {"main": main, "listen": listen}
    return out

# ----------------------------------------------------------------- exam json (文字・語彙・文法・読解)
GOI_DEF = {
 1: "＿＿＿の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。",
 2: "＿＿＿の言葉を漢字で書くとき、最もよいものを、1・2・3・4から一つ選びなさい。",
 3: "（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
 4: "（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
 5: "＿＿＿の言葉に意味が最も近いものを、1・2・3・4から一つ選びなさい。",
 6: "次の言葉の使い方として最もよいものを、1・2・3・4から一つ選びなさい。",
 7: "次の文の（　　）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
 8: "次の文の ★ に入る最もよいものを、1・2・3・4から一つ選びなさい。"}
TYPE = {1:"yomi",2:"hyouki",3:"gokeisei",4:"bunmyaku",5:"iikae",6:"youhou",7:"keishiki",8:"narabe",9:"bunshou",
        10:"tanbun",11:"chuubun",12:"tougou",13:"shuchou",14:"jouhou"}
# Hand fixes for typos in the community PDFs: (tag, question) -> 4 options
FIX = {
 ("2018-07",50): ["道路","ある道路","その道路","こんな道路"],
 ("2018-07",51): ["ご存じだ","ご存じのようだ","ご存じだろうか","ご存じなのだろう"],
 ("2023-12",24): ["同じ会社の人","同じアパートの人","同じ出身地の人","同じクラスの人"],
}
_SAN = re.compile(r'<(?!/?(?:u|p|br|b)(?: class="(?:note|label)")?>)')
def san(s): return _SAN.sub('&lt;', s.replace('&', '&amp;')) if s else s
def boxify(h, nums):
    for n in nums:
        s = str(n)
        h = re.sub(r'[(（]\s*%s\s*[)）]' % s, '[%s]' % s, h)
        h = re.sub(r'「\s*%s\s*」' % s, '[%s]' % s, h)
        h = re.sub(r'(?:(?<=^)|(?<=[\s。、」>]))[.．]?\s*%s\s*[.．]?(?=[\s。、<]|$)' % s, '[%s]' % s, h)
    return re.sub(r'\s*(\[\d+\])\s*', r'\1', h)
def render_pages(doc, pages, dpi, gray, q, fn, clip_x=None):
    ims = []
    for pi in pages:
        p = doc[pi]; clip = pymupdf.Rect(clip_x[0], 0, clip_x[1], p.rect.height) if clip_x else None
        pix = p.get_pixmap(dpi=dpi, colorspace=pymupdf.csGRAY if gray else pymupdf.csRGB, clip=clip)
        ims.append(Image.open(io.BytesIO(pix.tobytes("png"))))
    w = max(i.width for i in ims); h = sum(i.height for i in ims)
    can = Image.new("L" if gray else "RGB", (w, h), 255 if gray else (255, 255, 255)); y = 0
    for i in ims: can.paste(i, (0, y)); y += i.height
    can.save(fn, "JPEG", quality=q, optimize=True, progressive=True)
    return w, h

def build_main(tag, rows_path, pdf, ans):
    A = ans["main"]; total = max(A)
    ms, probs = parse(rows_path, A)
    goi_sizes = [5,5,5,7,5,5] if total == 75 else [5,5,3,7,5,5]
    goi_q = [q for m in ms if m["sec"] == "goi" for q in m["qs"]]
    if len(goi_q) != sum(goi_sizes): probs.append(("goi-count", len(goi_q), sum(goi_sizes)))
    new = []; k = 0
    for no, sz in enumerate(goi_sizes, 1):
        qs = goi_q[k:k+sz]; k += sz
        for q in qs: q["g"] = -1
        new.append({"sec": "goi", "no": no, "instr": GOI_DEF[no], "qs": qs, "groups": []})
    for m in ms:
        if m["sec"] == "goi": continue
        if m["no"] in (7, 8): m["instr"] = GOI_DEF[m["no"]]
        new.append(m)
    doc = pymupdf.open(pdf); out_m = []
    os.makedirs(f"{OUT}/img", exist_ok=True)
    for m in new:
        t = TYPE.get(m["no"], "other"); nums = [q["n"] for q in m["qs"]]
        groups = m.get("groups") or []
        if t == "bunshou":
            groups = [boxify("".join(groups), nums)] if groups else []
            m["instr"] = boxify(m["instr"], nums)
            for q in m["qs"]: q["g"] = 0 if groups else -1
        qs = []
        for q in m["qs"]:
            o = FIX.get((tag, q["n"]), q["o"])
            if len(o) != 4 or not all(o): probs.append(("options", q["n"], o))
            qs.append({"n": q["n"], "q": san(q["q"]), "o": [san(x) for x in o], "a": q["a"], "g": q.get("g", -1)})
            if m["sec"] == "dok" and qs[-1]["g"] < 0: probs.append(("no-passage", q["n"]))
        mm = {"no": m["no"], "sec": m["sec"], "type": t, "instr": san(m["instr"]), "groups": [san(g) for g in groups], "qs": qs}
        if t == "jouhou":   # tables scramble as text: keep page images (150 dpi)
            mm["img"] = []
            for pi in m.get("pages", []):
                fn = f"img/{tag}-p{pi+1}.jpg"
                doc[pi].get_pixmap(dpi=150).save(f"{OUT}/{fn}", jpg_quality=78); mm["img"].append(fn)
        out_m.append(mm)
    got = [q["n"] for m in out_m for q in m["qs"]]
    if got != list(range(1, total+1)): probs.append(("numbering", [n for n in range(1, total+1) if n not in got]))
    return out_m, [p for p in probs if p[0] != "cut" and (tag, p[1] if len(p) > 1 else None) not in FIX]

# ----------------------------------------------------------------- listening (聴解)
CROP_DPI = 220
def build_listen(tag, rows, pdf, script_pdf, lans):
    doc = pymupdf.open(pdf)
    pl = lambda t: re.sub(r'<[^>]+>', '', t).translate(str.maketrans("０１２３４５６７８９", "0123456789")).strip()
    start = next((pi for pi, pg in enumerate(rows) if any(re.sub(r'<[^>]+>|[\s.]', '', r['t']) == '聴解' for r in pg)), None)
    if start is None: raise SystemExit(f"{tag}: no 聴解 page found in exam PDF")
    marks = []; foot = {}; xs = []
    for pi in range(start, len(doc)):
        ph = doc[pi].rect.height
        for r in rows[pi]:
            t = pl(r['t']); fs = r.get('fs', 11)
            if re.fullmatch(r'\d{1,2}', t) and r['y'] > ph-90: foot[pi] = r['y']-fs-4; continue
            if re.search(r'N2\s*\d{1,2}\s*/\s*\d{4}', t): continue
            xs += [r['x'], r.get('x1', r['x'])]
            for kind, pat in (('M', r'^問題\s*([1-5])(?!\d)'), ('B', r'^(\d{1,2})\s*番'), ('Q', r'^質問\s*([12])'), ('E', r'^例')):
                mm = re.match(pat, t)
                if mm: marks.append((kind, int(mm.group(1)) if kind != 'E' else 0, pi, r['y']-fs*1.75)); break
    # include drawn pictures in the horizontal extent
    for pi in range(start, len(doc)):
        for b in doc[pi].get_text("dict")["blocks"]:
            if b.get("type") == 1: xs += [b["bbox"][0], b["bbox"][2]]
        for d in doc[pi].get_drawings():
            r = d["rect"]
            if r.width > 30 and r.height > 30: xs += [r.x0, r.x1]
    pw = doc[start].rect.width
    x0 = max(0, min(xs)-10); x1 = min(pw, max(xs)+12)
    def segs_for(i):
        _, _, pi, yt = marks[i]; segs = []
        nxt = marks[i+1] if i+1 < len(marks) else None
        p = pi; y0 = yt
        while True:
            end_here = nxt and nxt[2] == p
            if end_here: yend = nxt[3]-2
            else:
                body = [r for r in rows[p] if r['y'] > y0 and r['y'] < foot.get(p, 9e9)]
                yend = foot.get(p, doc[p].rect.height-40) if nxt else (max(r['y'] for r in body)+8 if body else y0)
                # pictures below the last text line
                for b in doc[p].get_text("dict")["blocks"]:
                    if b.get("type") == 1 and b["bbox"][1] >= y0: yend = max(yend, min(b["bbox"][3]+6, foot.get(p, 9e9)))
            if yend-y0 > 4: segs.append((p, y0, yend))
            if end_here or p+1 >= len(doc) or p-pi >= 1: break
            p += 1; y0 = 58
            if not nxt:
                body = [r for r in rows[p] if 58 < r['y'] < foot.get(p, 9e9)]
                if body: segs.append((p, y0, max(r['y'] for r in body)+8))
                break
        return segs
    boxes = {}; mon = 0; base = None
    for i, (k, v, pi, yt) in enumerate(marks):
        if k == 'M': mon = v; continue
        if k == 'B' and mon in (1, 2, 5):
            s = segs_for(i)
            if mon == 5 and i+1 < len(marks) and marks[i+1][0] == 'Q': base = (v, s); continue
            boxes[f"{mon}-{v}"] = s
        if k == 'Q' and mon == 5 and base:
            boxes[f"5-{base[0]}-{v}"] = base[1] + segs_for(i)
    # render every segment once into a sprite (sharp: 220 dpi, trimmed to content width)
    seg_list = []; key_segs = {}
    for key, segs in boxes.items():
        key_segs[key] = []
        for sg in segs:
            if sg not in seg_list: seg_list.append(sg)
            key_segs[key].append(seg_list.index(sg))
    ims = []; ypos = []; y = 0
    for p, a, b in seg_list:
        pix = doc[p].get_pixmap(dpi=CROP_DPI, clip=pymupdf.Rect(x0, a, x1, b))
        im = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB"); ims.append(im); ypos.append((y, y+im.height)); y += im.height
    os.makedirs(f"{OUT}/listen", exist_ok=True)
    W = max(i.width for i in ims) if ims else 1
    can = Image.new("RGB", (W, max(y, 1)), (255, 255, 255))
    for im, (a, _) in zip(ims, ypos): can.paste(im, (0, a))
    qfn = f"listen/{tag}-q.jpg"; can.save(f"{OUT}/{qfn}", "JPEG", quality=80, optimize=True, progressive=True)
    crops = {k: [list(ypos[i]) for i in v] for k, v in key_segs.items()}
    sd = pymupdf.open(script_pdf)
    scw, sch = render_pages(sd, range(len(sd)), 120, True, 60, f"{OUT}/listen/{tag}-script.jpg")
    mondai = [{"no": int(no), "ans": lans[no]} for no in sorted(lans, key=int)]
    miss = [f"{m['no']}-{lab}" for m in mondai if m["no"] in (1, 2) for lab, _ in m["ans"] if f"{m['no']}-{lab}" not in crops]
    return {"q": qfn, "qW": W, "qH": max(y, 1), "crops": crops, "sc": f"listen/{tag}-script.jpg", "scW": scw, "scH": sch,
            "mondai": mondai}, miss

def build_audio(tag, mp3, seg=1200):
    """Cut the mp3 into <=20 MB mp4 pieces (asset store accepts mp4 video): a 16x16 still video track + the audio.
    Audio <=100 kbps is copied bit-for-bit, higher bitrates become 96 kbps AAC (same quality for speech)."""
    pr = json.loads(sh(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=bit_rate:format=duration', '-of', 'json', mp3]).stdout)
    br = float(pr['streams'][0].get('bit_rate') or 128000); dur = float(pr['format']['duration'])
    copy = br <= 100000; res = []
    os.makedirs(f"{WORK}/audio-out", exist_ok=True)
    for i in range(math.ceil(dur/seg)):
        out = f"{WORK}/audio-out/{tag}-{i+1}.mp4"
        a = ['-c:a', 'copy'] if copy else ['-c:a', 'aac', '-b:a', '96k']
        r = sh(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=16x16:r=1', '-ss', str(i*seg), '-t', str(seg), '-i', mp3,
                '-map', '0:v', '-map', '1:a:0', '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-r', '1'] + a + ['-shortest', '-movflags', '+faststart', out])
        if r.returncode: raise SystemExit(r.stderr)
        d = float(json.loads(sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', out]).stdout)['format']['duration'])
        res.append({"file": out, "d": round(d, 3), "size": os.path.getsize(out)})
    return res

# ----------------------------------------------------------------- commands
def find_files(tag):
    d = f"{WORK}/{tag}"
    return {k: (glob.glob(f"{d}/{k}.*") or [None])[0] for k in ("exam", "script", "audio")}
def cmd_list():
    have = set(json.load(open(f"{OUT}/exams/index.json"))["tags"]) if os.path.exists(f"{OUT}/exams/index.json") else set()
    for fid, name in drive_list(ROOT_FOLDER):
        t = tag_of(name); print(f"{t or '-':8} {'(có rồi)' if t in have else ('MỚI' if t else '')}  {name}")
def cmd_fetch(tags):
    entries = drive_list(ROOT_FOLDER)
    ans = [e for e in entries if e[1].lower().endswith('.pdf') and 'đáp án' in e[1].lower()]
    os.makedirs(WORK, exist_ok=True)
    if ans: drive_get(ans[0][0], f"{WORK}/answers.pdf"); print("answers:", ans[0][1])
    for fid, name in entries:
        t = tag_of(name)
        if not t or name.lower().endswith('.pdf') or (tags and t not in tags): continue
        os.makedirs(f"{WORK}/{t}", exist_ok=True)
        files = drive_list(fid)
        pdfs = [f for f in files if f[1].lower().endswith('.pdf')]
        sc = [f for f in pdfs if 'script' in f[1].lower()]; ex = [f for f in pdfs if f not in sc]
        mp3 = [f for f in files if f[1].lower().endswith('.mp3')]
        for kind, lst, ext in (("exam", ex, "pdf"), ("script", sc, "pdf"), ("audio", mp3, "mp3")):
            if lst: drive_get(lst[0][0], f"{WORK}/{t}/{kind}.{ext}"); print(t, kind, "<-", lst[0][1])
            else: print(t, kind, "MISSING in Drive folder", name)
def cmd_build(tags):
    allans = parse_answer_pdf(f"{WORK}/answers.pdf")
    tags = tags or sorted(t for t in os.listdir(WORK) if re.fullmatch(r'\d{4}-\d{2}', t))
    os.makedirs(f"{OUT}/exams", exist_ok=True); ok_all = True
    for tag in tags:
        f = find_files(tag)
        if tag not in allans: print(tag, "NO ANSWERS in answer PDF yet"); ok_all = False; continue
        rows = extract(f["exam"]); rp = f"{WORK}/{tag}/rows.json"; json.dump(rows, open(rp, "w"), ensure_ascii=False)
        A = allans[tag]
        mondai, probs = build_main(tag, rp, f["exam"], A)
        prev = json.load(open(f"{OUT}/exams/{tag}.json")) if os.path.exists(f"{OUT}/exams/{tag}.json") else {}
        exam = {"tag": tag, "label": tag_label(tag), "mondai": mondai}
        if f["script"] and A["listen"]:
            L, miss = build_listen(tag, rows, f["exam"], f["script"], {str(k): v for k, v in A["listen"].items()})
            if miss: probs.append(("listen-crops-missing", miss))
            L["chunks"] = (prev.get("listen") or {}).get("chunks", [])
            if WEB and f["audio"]:
                # website: serve the original mp3 unchanged (range requests make seeking work)
                os.makedirs(f"{OUT}/audio", exist_ok=True)
                import shutil; shutil.copyfile(f["audio"], f"{OUT}/audio/{tag}.mp3")
                d = float(json.loads(sh(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', f["audio"]]).stdout)['format']['duration'])
                L["chunks"] = [{"u": f"audio/{tag}.mp3", "d": round(d, 3)}]
            elif f["audio"] and not L["chunks"]:
                pieces = build_audio(tag, f["audio"])
                json.dump(pieces, open(f"{WORK}/{tag}/audio-pieces.json", "w"))
                print(tag, "audio pieces to upload as assets:", [p["file"] for p in pieces])
            L["dur"] = round(sum(c["d"] for c in L["chunks"])) if L["chunks"] else None
            exam["listen"] = L
        json.dump(exam, open(f"{OUT}/exams/{tag}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        n = sum(len(m["qs"]) for m in mondai); nl = sum(len(m["ans"]) for m in (exam.get("listen") or {}).get("mondai", []))
        print(f"{tag}: {n} câu + {nl} câu nghe", "OK" if not probs else f"CHECK {probs[:8]}"); ok_all &= not probs
    cmd_index(); return ok_all
def cmd_link(tag, blobs_file):
    """blobs_file: lines '<blob id or /_blob/url> <size>' in the same order as audio-pieces.json"""
    pieces = json.load(open(f"{WORK}/{tag}/audio-pieces.json"))
    bl = [l.split() for l in open(blobs_file) if l.strip()]
    assert len(bl) == len(pieces), "count mismatch"
    ex = json.load(open(f"{OUT}/exams/{tag}.json"))
    ch = []
    for p, (b, s) in zip(pieces, bl):
        assert int(s) == p["size"], f"size mismatch {p['file']}"
        ch.append({"u": b if b.startswith("/_blob/") else "/_blob/"+b, "d": p["d"]})
    ex["listen"]["chunks"] = ch; ex["listen"]["dur"] = round(sum(c["d"] for c in ch))
    json.dump(ex, open(f"{OUT}/exams/{tag}.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(tag, "linked", len(ch), "audio pieces")
def cmd_index():
    """Union of the tags already in out/exams/index.json (download the live one first) and the exam files present."""
    ip = f"{OUT}/exams/index.json"
    have = set(json.load(open(ip))["tags"]) if os.path.exists(ip) else set()
    tags = sorted(have | {os.path.basename(f)[:-5] for f in glob.glob(f"{OUT}/exams/*.json") if re.fullmatch(r'\d{4}-\d{2}', os.path.basename(f)[:-5])})
    json.dump({"tags": tags, "built": __import__("datetime").date.today().isoformat()}, open(f"{OUT}/exams/index.json", "w"))
    if WEB:   # top-level list of levels the site offers: public/jlpt/index.json
        top = os.path.join(os.path.dirname(OUT.rstrip("/")), "index.json")
        lv = set(json.load(open(top))["levels"]) if os.path.exists(top) else set()
        lv.add(LEVEL.upper()); json.dump({"levels": sorted(lv)}, open(top, "w"))
    print("index:", len(tags), "exams")

if __name__ == "__main__":
    a = sys.argv[1:] or ["help"]
    if a[0] == "list": cmd_list()
    elif a[0] == "fetch": cmd_fetch(a[1:])
    elif a[0] == "build": sys.exit(0 if cmd_build(a[1:]) else 1)
    elif a[0] == "link": cmd_link(a[1], a[2])
    elif a[0] == "index": cmd_index()
    else: print(__doc__)

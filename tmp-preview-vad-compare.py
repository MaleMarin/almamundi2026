#!/usr/bin/env python3
"""Comparador local 100-conceptos vs NRC-VAD vs Plan B. No commitear léxicos."""

from __future__ import annotations

import csv
import json
import math
import re
import sys
import zlib
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LEX = ROOT / "tmp-lexicons"
OUT = ROOT / "tmp-vad-compare"
sys.path.insert(0, str(LEX / "_py"))

SIZE = 1360
BG = (247, 244, 238)
MIN_W, MAX_W = 6, 14
WIDE_MIN, WIDE_MAX = 15, 18


def fold(raw: str) -> str:
    s = raw.lower()
    repl = str.maketrans(
        "áàäâéèëêíìïîóòöôúùüûñç",
        "aaaaeeeeiiiioooouuuunc",
    )
    s = s.translate(repl)
    s = re.sub(r"[^a-z\s-]", " ", s)
    s = re.sub(r"[-]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def seed_fn(s: str) -> int:
    h = 0
    for ch in s:
        h = (np_imul32(31, h) + ord(ch)) & 0xFFFFFFFF
        if h >= 0x80000000:
            h -= 0x100000000
    return abs(h)


def np_imul32(a: int, b: int) -> int:
    a = ctypes_i32(a)
    b = ctypes_i32(b)
    return ctypes_i32(a * b)


def ctypes_i32(n: int) -> int:
    n = n & 0xFFFFFFFF
    return n - 0x100000000 if n >= 0x80000000 else n


def seeded_rnd(seed: int, i: int) -> float:
    x = math.sin(seed + i) * 10000
    return x - math.floor(x)


def scale19(x: float) -> float:
    return max(0.0, min(1.0, (float(x) - 1.0) / 8.0))


def _norm_story(vals: list[float]) -> list[float]:
    if not vals:
        return []
    lo, hi = min(vals), max(vals)
    if hi - lo < 0.04:
        return [0.5] * len(vals)
    return [(x - lo) / (hi - lo) for x in vals]


def _wrap_hue(h: float) -> float:
    return (h % 360.0 + 360.0) % 360.0


SAT_MIN, SAT_MAX = 45.0, 95.0
LIGHT_MIN, LIGHT_MAX = 20.0, 85.0
FEW_WORDS = 5
CLEAN_HUES = [
    0, 12, 24, 36, 50, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228,
    240, 252, 264, 276, 288, 300, 312, 324, 336, 348,
]
BLACK_RGB = (0, 0, 0)
NEGATIVE_V_MAX = 0.40


def hue_family(h: float) -> int:
    hh = _wrap_hue(h)
    if hh >= 348 or hh < 70:
        return 0
    if hh < 174:
        return 1
    if hh < 258:
        return 2
    return 3


def assign_irregular_widths(rows: list[dict], S: int) -> None:
    n = len(rows)
    scores = []
    for i, r in enumerate(rows):
        ext = abs(float(r.get("v_rel", 0.5)) - 0.5)
        scores.append((ext + min(int(r.get("count", 1)), 4) * 0.08, i))
    scores.sort(reverse=True)
    wide_n = 1
    wide_idx = {i for _, i in scores[:wide_n]}
    for i, r in enumerate(rows):
        rnd = seeded_rnd(S, 110 + i)
        if i in wide_idx:
            r["width"] = WIDE_MIN + int(rnd * (WIDE_MAX - WIDE_MIN + 1))
        else:
            r["width"] = MIN_W + int(rnd * (MAX_W - MIN_W + 1))


def group_by_family(rows: list[dict]) -> list[dict]:
    buckets: list[list[dict]] = [[], [], [], []]
    for r in rows:
        if r.get("accent") == "black":
            continue
        buckets[hue_family(float(r.get("h", 0)))].append(r)
    for fi, b in enumerate(buckets):
        b.sort(key=lambda u: (float(u.get("l", 50)), -float(u.get("h", 0))))
        if len(b) > 2:
            mid = len(b) // 2
            left, right = b[:mid], b[mid:][::-1]
            mixed: list[dict] = []
            for i in range(max(len(left), len(right))):
                if i < len(left):
                    mixed.append(left[i])
                if i < len(right):
                    mixed.append(right[i])
            buckets[fi] = mixed
    out: list[dict] = []
    for fam in range(4):
        out.extend(buckets[fam])
    return out


def compose_stripe_layout(units: list[dict], story_id: str, size: int) -> list[dict]:
    blacks = [u for u in units if u.get("accent") == "black"][:2]
    chromatic = [u for u in units if u.get("accent") != "black"]
    grouped = group_by_family(chromatic)
    if not grouped and not blacks:
        return []
    cycle = grouped if grouped else chromatic
    tiled: list[dict] = []
    x = 0
    i = 0
    while x < size and i < 800 and cycle:
        u = cycle[i % len(cycle)]
        w = max(MIN_W, min(MAX_W, int(u.get("width") or MIN_W)))
        if x + w > size:
            rem = size - x
            if rem < MIN_W and tiled:
                tiled[-1]["width"] += rem
                break
            w = rem
        if w <= 0:
            break
        tiled.append({**u, "width": w})
        x += w
        i += 1

    if not blacks:
        return tiled

    n_hits = max(1, max(int(u.get("n_hits", 1)) for u in units))
    inserts: list[tuple[int, dict]] = []
    for b in blacks:
        frac = float(b.get("order_i", 0)) / max(1, n_hits - 1) if n_hits > 1 else 0.35
        frac = min(0.92, max(0.06, frac))
        target = int(frac * size)
        bw = max(MIN_W, min(MAX_W, int(b.get("width") or 8)))
        inserts.append((target, {**b, "width": bw}))
    inserts.sort(key=lambda t: t[0], reverse=True)

    for target, band in inserts:
        acc = 0
        pos = len(tiled)
        for j, u in enumerate(tiled):
            acc += int(u["width"])
            if acc >= target:
                pos = j + 1
                break
        steal = band["width"]
        for j in range(len(tiled) - 1, -1, -1):
            if steal <= 0:
                break
            if tiled[j].get("accent") == "black":
                continue
            can = int(tiled[j]["width"]) - MIN_W
            if can <= 0:
                continue
            take = min(can, steal)
            tiled[j]["width"] = int(tiled[j]["width"]) - take
            steal -= take
        tiled.insert(min(pos, len(tiled)), band)

    x = 0
    fitted: list[dict] = []
    for u in tiled:
        if x >= size:
            break
        w = int(u["width"])
        if x + w > size:
            rem = size - x
            if rem < MIN_W and fitted:
                fitted[-1]["width"] += rem
                break
            w = rem
        if w <= 0:
            break
        fitted.append({**u, "width": w})
        x += w
    return fitted


def story_center_hue(v_mean: float, a_mean: float) -> float:
    return _wrap_hue(math.degrees(math.atan2(a_mean - 0.5, v_mean - 0.5)))


def _hue_sep(a: float, b: float) -> float:
    d = abs(a - b) % 360.0
    return 360.0 - d if d > 180.0 else d


def snap_hue(h: float, l: float | None = None) -> float:
    hue = _wrap_hue(h)
    q = min(CLEAN_HUES, key=lambda c: _hue_sep(hue, c))
    if l is not None and 32.0 < l < 72.0 and 60.0 <= q <= 96.0:
        q = 50.0 if q < 78.0 else 120.0
    return q


def neighbor_hues(base: float, extra: int = 2) -> list[float]:
    i0 = CLEAN_HUES.index(snap_hue(base))
    n = len(CLEAN_HUES)
    out = [float(CLEAN_HUES[i0])]
    for k in range(1, extra + 1):
        out.append(float(CLEAN_HUES[(i0 + k) % n]))
        out.append(float(CLEAN_HUES[(i0 - k) % n]))
    return out


def vad_to_hsl(
    v_rel: float,
    a_abs: float,
    d_rel: float,
    a_rel: float,
    center: float,
) -> tuple[float, float, float]:
    spread = (v_rel - 0.5) * 200.0
    wobble = (a_rel - 0.5) * 80.0 + (d_rel - 0.5) * 40.0
    raw_h = _wrap_hue(center + spread + wobble)
    l = LIGHT_MIN + max(0.0, min(1.0, a_rel)) * (LIGHT_MAX - LIGHT_MIN)
    s = SAT_MIN + max(0.0, min(1.0, d_rel)) * (SAT_MAX - SAT_MIN)
    s = SAT_MIN + round((s - SAT_MIN) / 10.0) * 10.0
    l = LIGHT_MIN + round((l - LIGHT_MIN) / 8.0) * 8.0
    s = max(SAT_MIN, min(SAT_MAX, s))
    l = max(LIGHT_MIN, min(LIGHT_MAX, l))
    h = snap_hue(raw_h, l)
    return h, s, l


def _circular_span(hues: list[float]) -> float:
    if len(hues) <= 1:
        return 0.0
    s = sorted(_wrap_hue(h) for h in hues)
    gap = s[0] + 360.0 - s[-1]
    for i in range(1, len(s)):
        gap = max(gap, s[i] - s[i - 1])
    return 360.0 - gap


def ensure_hue_spread(rows: list[dict], center: float, min_span: float = 180.0) -> None:
    chrom = [r for r in rows if r.get("accent") != "black"]
    if len(chrom) < 2:
        return
    hues = [float(r["h"]) for r in chrom]
    if _circular_span(hues) >= min_span:
        return
    ranked = sorted(range(len(chrom)), key=lambda i: float(chrom[i].get("v_rel", 0.5)))
    n = max(1, len(ranked) - 1)
    for k, i in enumerate(ranked):
        l = float(chrom[i]["l"])
        chrom[i]["h"] = snap_hue(center + (k / n - 0.5) * 220.0, l)


def hsl_to_rgb(h: float, s: float, l: float) -> tuple[int, int, int]:
    s /= 100.0
    l /= 100.0
    c = (1 - abs(2 * l - 1)) * s
    hp = ((h % 360) + 360) % 360 / 60.0
    x = c * (1 - abs(hp % 2 - 1))
    m = l - c / 2
    if hp < 1:
        r, g, b = c, x, 0.0
    elif hp < 2:
        r, g, b = x, c, 0.0
    elif hp < 3:
        r, g, b = 0.0, c, x
    elif hp < 4:
        r, g, b = 0.0, x, c
    elif hp < 5:
        r, g, b = x, 0.0, c
    else:
        r, g, b = c, 0.0, x
    return (
        int(round((r + m) * 255)),
        int(round((g + m) * 255)),
        int(round((b + m) * 255)),
    )


def hex_to_rgb(hx: str) -> tuple[int, int, int]:
    h = hx.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def tokenize(text: str) -> list[str]:
    folded = fold(text)
    if not folded:
        return []
    return [w for w in folded.split(" ") if len(w) > 1]


def ols_fit(rows: list[tuple[float, float, float]]) -> list[float]:
    """D ~ 1 + V + A + V*A + V^2. Devuelve 5 coeficientes."""
    n = len(rows)
    xtx = [[0.0] * 5 for _ in range(5)]
    xty = [0.0] * 5
    for v, a, d in rows:
        x = [1.0, v, a, v * a, v * v]
        for i in range(5):
            xty[i] += x[i] * d
            for j in range(5):
                xtx[i][j] += x[i] * x[j]
    return solve(xtx, xty)


def solve(a: list[list[float]], b: list[float]) -> list[float]:
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for i in range(n):
        piv = max(range(i, n), key=lambda r: abs(m[r][i]))
        m[i], m[piv] = m[piv], m[i]
        div = m[i][i] or 1e-12
        for j in range(i, n + 1):
            m[i][j] /= div
        for r in range(n):
            if r == i:
                continue
            f = m[r][i]
            for j in range(i, n + 1):
                m[r][j] -= f * m[i][j]
    return [m[i][n] for i in range(n)]


def predict_d(coef: list[float], v: float, a: float) -> float:
    return coef[0] + coef[1] * v + coef[2] * a + coef[3] * v * a + coef[4] * v * v


def metrics(rows: list[tuple[float, float, float]], coef: list[float]) -> dict:
    ys = [d for _, _, d in rows]
    yhat = [predict_d(coef, v, a) for v, a, _ in rows]
    mean = sum(ys) / len(ys)
    ss_tot = sum((y - mean) ** 2 for y in ys) or 1e-12
    ss_res = sum((y - yh) ** 2 for y, yh in zip(ys, yhat))
    rmse = math.sqrt(ss_res / len(ys))
    return {"r2": 1 - ss_res / ss_tot, "rmse": rmse, "n": len(ys)}


def pearson(xs: list[float], ys: list[float]) -> float:
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = math.sqrt(sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys)) or 1e-12
    return num / den


class Lex:
    def __init__(self) -> None:
        self.words: dict[str, tuple[float, float, float]] = {}
        self.phrases: dict[str, tuple[float, float, float]] = {}
        self.max_phrase = 1

    def add(self, key: str, vad: tuple[float, float, float]) -> None:
        k = fold(key)
        if not k:
            return
        parts = k.split(" ")
        target = self.phrases if len(parts) > 1 else self.words
        if k in target:
            old = target[k]
            target[k] = ((old[0] + vad[0]) / 2, (old[1] + vad[1]) / 2, (old[2] + vad[2]) / 2)
        else:
            target[k] = vad
        if len(parts) > self.max_phrase:
            self.max_phrase = len(parts)

    def lookup_seq(self, tokens: list[str]) -> tuple[list[dict], int]:
        order: list[str] = []
        counts: dict[str, int] = {}
        vads: dict[str, tuple[float, float, float]] = {}
        painted = 0
        i = 0
        while i < len(tokens):
            hit = None
            consumed = 1
            for n in range(min(self.max_phrase, len(tokens) - i), 1, -1):
                phrase = " ".join(tokens[i : i + n])
                if phrase in self.phrases:
                    hit = (phrase, self.phrases[phrase])
                    consumed = n
                    break
            if hit is None and tokens[i] in self.words:
                hit = (tokens[i], self.words[tokens[i]])
                consumed = 1
            if hit:
                key, vad = hit
                if key not in counts:
                    order.append(key)
                    vads[key] = vad
                counts[key] = counts.get(key, 0) + 1
                painted += consumed
                i += consumed
            else:
                i += 1
        hits = [
            {"word": k, "count": counts[k], "v": vads[k][0], "a": vads[k][1], "d": vads[k][2]}
            for k in order
        ]
        return hits, painted


def load_nrc(path: Path, word_col: int | None) -> Lex:
    lex = Lex()
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    start = 0
    if lines and lines[0].lower().startswith("english"):
        start = 1
    for line in lines[start:]:
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        try:
            v, a, d = float(parts[1]), float(parts[2]), float(parts[3])
        except ValueError:
            continue
        if word_col is None:
            lex.add(parts[0], (v, a, d))
        else:
            if len(parts) <= word_col:
                continue
            lex.add(parts[word_col], (v, a, d))
    return lex


def load_stadthagen(path: Path, coef: list[float]) -> Lex:
    lex = Lex()
    raw = path.read_text(encoding="latin-1")
    reader = csv.DictReader(raw.splitlines())
    for row in reader:
        w = (row.get("Word") or "").strip()
        if not w:
            continue
        try:
            vm = float(row["ValenceMean"])
            am = float(row["ArousalMean"])
        except (KeyError, ValueError):
            continue
        v, a = scale19(vm), scale19(am)
        d = max(0.0, min(1.0, predict_d(coef, v, a)))
        lex.add(w, (v, a, d))
    return lex


def load_redondo_rows(path: Path) -> list[tuple[str, float, float, float]]:
    rows = []
    text = path.read_text(encoding="latin-1")
    for i, line in enumerate(text.splitlines()):
        if i == 0:
            continue
        p = line.split("\t")
        if len(p) < 9:
            continue
        try:
            rows.append((p[2], float(p[3]), float(p[5]), float(p[7])))
        except ValueError:
            continue
    return rows


def load_warriner_rows(path: Path) -> list[tuple[str, float, float, float]]:
    rows = []
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                rows.append(
                    (
                        row["Word"],
                        float(row["V.Mean.Sum"]),
                        float(row["A.Mean.Sum"]),
                        float(row["D.Mean.Sum"]),
                    )
                )
            except (KeyError, ValueError):
                continue
    return rows


def load_soares(path: Path) -> Lex:
    import xlrd

    lex = Lex()
    wb = xlrd.open_workbook(str(path))
    sh = wb.sheet_by_name("ANEW_all")
    for r in range(1, sh.nrows):
        w = str(sh.cell_value(r, 2)).strip()
        if not w:
            continue
        v, a, d = scale19(sh.cell_value(r, 3)), scale19(sh.cell_value(r, 5)), scale19(sh.cell_value(r, 7))
        lex.add(w, (v, a, d))
    return lex


def load_warriner_lex(path: Path) -> Lex:
    lex = Lex()
    for w, v, a, d in load_warriner_rows(path):
        lex.add(w, (scale19(v), scale19(a), scale19(d)))
    return lex


def load_concepts() -> tuple[dict[int, tuple[str, str]], list[tuple[int, list[str]]]]:
    concepts: dict[int, tuple[str, str]] = {}
    src = (ROOT / "lib/huella/resonance-concepts.ts").read_text(encoding="utf-8")
    for m in re.finditer(r"id:\s*(\d+),\s*name:\s*'([^']+)',\s*hex:\s*'([^']+)'", src):
        concepts[int(m.group(1))] = (m.group(2), m.group(3))
    lex_src = (ROOT / "lib/huella/resonance-lexicon.ts").read_text(encoding="utf-8")
    entries = []
    for m in re.finditer(r"id:\s*(\d+),\s*words:\s*\[([^\]]+)\]", lex_src):
        words = [fold(w) for w in re.findall(r"'([^']+)'", m.group(2))]
        entries.append((int(m.group(1)), [w for w in words if w]))
    return concepts, entries


def extract_concepts(text: str, concepts, entries) -> tuple[list[dict], int]:
    phrase = {}
    word = {}
    max_p = 1
    for cid, words in entries:
        for w in words:
            parts = w.split(" ")
            if len(parts) > 1:
                phrase[w] = cid
                max_p = max(max_p, len(parts))
            elif w not in word:
                word[w] = cid
    tokens = tokenize(text)
    order = []
    counts = {}
    painted = 0
    i = 0
    while i < len(tokens):
        hit = None
        consumed = 1
        for n in range(min(max_p, len(tokens) - i), 1, -1):
            p = " ".join(tokens[i : i + n])
            if p in phrase:
                hit = phrase[p]
                consumed = n
                break
        if hit is None and tokens[i] in word:
            hit = word[tokens[i]]
        if hit is not None:
            if hit not in counts:
                order.append(hit)
            counts[hit] = counts.get(hit, 0) + 1
            painted += consumed
            i += consumed
        else:
            i += 1
    out = []
    for cid in order:
        name, hx = concepts[cid]
        out.append({"word": name, "count": counts[cid], "hex": hx})
    return out, painted


def write_png(path: Path, w: int, h: int, rgba: bytearray) -> None:
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)
        raw.extend(rgba[y * stride : (y + 1) * stride])
    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return len(data).to_bytes(4, "big") + tag + data + crc.to_bytes(4, "big")
    ihdr = w.to_bytes(4, "big") + h.to_bytes(4, "big") + bytes([8, 6, 0, 0, 0])
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 6)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def fill_rect(px: bytearray, W: int, H: int, x: int, y: int, w: int, h: int, rgb: tuple[int, int, int]) -> None:
    x0, y0 = max(0, int(x)), max(0, int(y))
    x1, y1 = min(W, int(x) + int(w)), min(H, int(y) + int(h))
    r, g, b = int(rgb[0]), int(rgb[1]), int(rgb[2])
    for yy in range(y0, y1):
        i = (yy * W + x0) * 4
        for _ in range(x0, x1):
            px[i] = r
            px[i + 1] = g
            px[i + 2] = b
            px[i + 3] = 255
            i += 4


def _hue(rgb: tuple[int, int, int]) -> float:
    return rgb_to_hsl(*rgb)[0]


def _hue_dist(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return 360 - d if d > 180 else d


def _vivid(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    h, s, l = rgb_to_hsl(*rgb)
    s = max(0.6, min(0.95, s))
    l = max(0.28, min(0.62, l))
    if s < 0.22 and l > 0.62:
        s, l = 0.72, 0.48
    return hsl_to_rgb(h, s * 100, l * 100)


def _order_contrast(units: list[dict]) -> list[dict]:
    if len(units) <= 2:
        return units
    leftover = list(units)
    out = [leftover.pop(0)]
    while leftover:
        prev = _hue(out[-1]["rgb"])
        leftover.sort(key=lambda u: -_hue_dist(_hue(u["rgb"]), prev))
        out.append(leftover.pop(0))
    return out


def _drip(px: bytearray, size: int, x: int, y0: int, w: int, drip_h: int, rgb: tuple[int, int, int], S: int, key: int) -> None:
    cy = y0
    left = drip_h
    cw = float(w) * (0.78 + seeded_rnd(S, key) * 0.2)
    step = 0
    while left > 0 and cw >= 3 and step < 6:
        seg = max(6, int(left * (0.28 + seeded_rnd(S, key + step * 11) * 0.22)))
        h = min(seg, left)
        wobble = (seeded_rnd(S, key + step * 13) - 0.5) * w * 0.16
        dx = max(x, min(x + w - cw, x + (w - cw) / 2 + wobble))
        fill_rect(px, size, size, int(dx), cy, max(3, int(round(cw))), h, rgb)
        cy += h
        left -= h
        cw = max(3.0, cw * (0.62 + seeded_rnd(S, key + step * 17) * 0.18))
        step += 1
    if seeded_rnd(S, key + 99) > 0.62 and drip_h > 40:
        drop_w = max(3, int(w * 0.22))
        drop_h = max(5, int(6 + seeded_rnd(S, key + 103) * 10))
        drop_x = int(x + (w - drop_w) / 2)
        fill_rect(px, size, size, drop_x, min(y0 + drip_h - drop_h, cy + 3), drop_w, drop_h, rgb)


def draw_stripes(units: list[dict], story_id: str, size: int = SIZE) -> bytearray:
    px = bytearray(size * size * 4)
    fill_rect(px, size, size, 0, 0, size, size, BG)
    if not units:
        return px
    S = seed_fn(story_id)
    rows = [{**u} for u in units]
    assign_irregular_widths(rows, S)
    laid = compose_stripe_layout(rows, story_id, size)
    x = 0
    for u in laid:
        w = int(round(u["width"]))
        if w <= 0 or x >= size:
            break
        xi = int(x)
        if xi + w > size:
            w = size - xi
        fill_rect(px, size, size, xi, 0, w, size, u["rgb"])
        x = xi + w
    return px


def rgb_to_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    rr, gg, bb = r / 255, g / 255, b / 255
    mx, mn = max(rr, gg, bb), min(rr, gg, bb)
    l = (mx + mn) / 2
    if mx == mn:
        return 0.0, 0.0, l
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == rr:
        h = ((gg - bb) / d + (6 if gg < bb else 0)) / 6
    elif mx == gg:
        h = ((bb - rr) / d + 2) / 6
    else:
        h = ((rr - gg) / d + 4) / 6
    return h * 360, s, l


def units_from_vad(hits: list[dict]) -> list[dict]:
    if not hits:
        return []
    vs = [h["v"] for h in hits]
    aas = [h["a"] for h in hits]
    ds = [h["d"] for h in hits]
    v_rel = _norm_story(vs)
    a_rel = _norm_story(aas)
    d_rel = _norm_story(ds)
    center = story_center_hue(sum(vs) / len(vs), sum(aas) / len(aas))
    rows = []
    for i, h in enumerate(hits):
        hh, ss, ll = vad_to_hsl(v_rel[i], h["a"], d_rel[i], a_rel[i], center)
        rows.append(
            {
                "count": h["count"],
                "width": MIN_W,
                "word": h["word"],
                "h": hh,
                "s": ss,
                "l": ll,
                "accent": None,
                "v_rel": v_rel[i],
                "v_abs": h["v"],
                "order_i": i,
                "n_hits": len(hits),
            }
        )

    if hits:
        i_min = min(range(len(vs)), key=lambda i: vs[i])
        if vs[i_min] < NEGATIVE_V_MAX:
            rows[i_min]["accent"] = "black"
            rows[i_min]["h"] = 0
            rows[i_min]["s"] = 0
            rows[i_min]["l"] = 0

    ensure_hue_spread(rows, center, 180.0)

    if len(hits) <= FEW_WORDS:
        expanded = []
        seen: set[int] = set()
        for row in rows:
            if row.get("accent") == "black":
                expanded.append(row)
                continue
            h0 = int(row["h"])
            if h0 not in seen:
                seen.add(h0)
                expanded.append(row)
        n_need = 8
        i = 0
        chrom_src = [r for r in rows if r.get("accent") != "black"] or rows
        while len(seen) < n_need and i < 40:
            t = i / max(1, n_need - 1)
            l = LIGHT_MIN + t * (LIGHT_MAX - LIGHT_MIN)
            s = SAT_MIN + ((i * 3) % 6) / 5.0 * (SAT_MAX - SAT_MIN)
            hh = snap_hue(center + (t - 0.5) * 220.0, l)
            key = int(hh)
            if key not in seen:
                seen.add(key)
                src = chrom_src[i % len(chrom_src)]
                expanded.append({**src, "h": hh, "s": s, "l": l, "accent": None, "word": src.get("word", "")})
            i += 1
        rows = expanded

    key_rgb: dict[tuple[int, int, int], tuple[int, int, int]] = {}
    out = []
    for row in rows:
        if row.get("accent") == "black":
            rgb = BLACK_RGB
        else:
            key = (int(row["h"]), int(round(row["s"])), int(round(row["l"])))
            if key not in key_rgb:
                key_rgb[key] = hsl_to_rgb(row["h"], row["s"], row["l"])
            rgb = key_rgb[key]
        out.append({**row, "rgb": rgb})
    return out


def units_from_concepts(hits: list[dict]) -> list[dict]:
    return [{"count": h["count"], "rgb": hex_to_rgb(h["hex"]), "word": h["word"]} for h in hits]


def coverage(tokens: list[str], painted_keys: set[str], is_concept: bool, hits: list[dict]) -> tuple[int, int, float]:
    if is_concept:
        # tokens that belong to a hit: approximate by summing counts
        painted = sum(h["count"] for h in hits)
    else:
        painted = 0
        i = 0
        # recount with same matcher is already in hits counts
        painted = sum(h["count"] for h in hits)
    n = len(tokens)
    return painted, n, (painted / n * 100 if n else 0.0)


STORIES = [
    {
        "slug": "01-muerte-padre",
        "lang": "es",
        "title": "La última tarde de mi padre",
        "id": "preview-padre-001",
        "text": "Mi padre se murió un martes de marzo, en la misma cama donde yo nací. El funeral fue en el pueblo: luto, vecinos, el olor a tierra mojada. Yo tenía rabia y también miedo de quedarme solo. En el duelo nadie sabe qué decir. Extraño su voz cuando pedía café. Esa muerte no se va.",
    },
    {
        "slug": "02-infancia-playa",
        "lang": "es",
        "title": "Veranos en la orilla",
        "id": "preview-playa-002",
        "text": "De chico pasaba la infancia en la playa de mis abuelos. El sol, la arena, las olas del mar, la risa de mis hermanos. Mi madre nos gritaba desde la orilla y nosotros corríamos felices, con la alegría de no tener escuela. Aún siento la brisa y el sabor a sal. Era un verano eterno.",
    },
    {
        "slug": "03-migracion-exilio",
        "lang": "es",
        "title": "Me fui y no pude volver",
        "id": "preview-exilio-003",
        "text": "Emigré a los veinte. Cruzar la frontera con una maleta y el miedo en la boca. El exilio no es un viaje: es quedarse sin casa, sin idioma de todos los días, sin el barrio. Soy inmigrante y a veces desterrado. Extraño el pueblo. Un día quiero el regreso, aunque la aduana me trate como a un extraño.",
    },
    {
        "slug": "04-musica-abuela",
        "lang": "es",
        "title": "La guitarra de mi abuela",
        "id": "preview-abuela-004",
        "text": "Mi abuela cantaba en la cocina. Una canción vieja, la misma melodía cada tarde, mientras el guiso. Yo aprendí música en su regazo: guitarra desafinada, palmas, esa voz. Cuando ella se fue, la casa se quedó sin canto. Aún pongo su disco y bailo un poco, como si ella estuviera.",
    },
    {
        "slug": "05-dos-lineas",
        "lang": "es",
        "title": "Dos líneas",
        "id": "preview-corto-005",
        "text": "Te extraño esta noche.\nNada más.",
    },
    {
        "slug": "06-pt-morte-pai",
        "lang": "pt",
        "title": "A última tarde do meu pai",
        "id": "preview-pt-pai-006",
        "text": "Meu pai morreu numa terça-feira de março, na mesma cama onde eu nasci. O funeral foi no povoado: luto, vizinhos, cheiro de terra molhada. Eu tinha raiva e também medo de ficar sozinho. No luto ninguém sabe o que dizer. Sinto saudade da voz dele pedindo café. Essa morte não vai embora.",
    },
    {
        "slug": "07-pt-infancia-praia",
        "lang": "pt",
        "title": "Verões na praia",
        "id": "preview-pt-praia-007",
        "text": "Quando era criança passava o verão na praia dos meus avós. O sol, a areia, as ondas do mar, o riso dos meus irmãos. Minha mãe gritava da beira e a gente corria feliz, com a alegria de não ter escola. Ainda sinto a brisa e o gosto de sal. Era um verão eterno.",
    },
    {
        "slug": "08-en-father-death",
        "lang": "en",
        "title": "The last afternoon of my father",
        "id": "preview-en-father-008",
        "text": "My father died on a Tuesday in March, in the same bed where I was born. The funeral was in the village: mourning, neighbors, the smell of wet earth. I felt rage and also fear of being left alone. In grief nobody knows what to say. I miss his voice asking for coffee. That death does not leave.",
    },
    {
        "slug": "09-en-childhood-beach",
        "lang": "en",
        "title": "Summers on the shore",
        "id": "preview-en-beach-009",
        "text": "As a child I spent my childhood at my grandparents' beach. The sun, the sand, the waves of the sea, my brothers' laughter. My mother shouted from the shore and we ran happy, with the joy of having no school. I still feel the breeze and the taste of salt. It was an endless summer.",
    },
]


def hstack(images: list[bytearray], size: int, gap: int = 16) -> tuple[bytearray, int, int]:
    n = len(images)
    W = size * n + gap * (n + 1)
    H = size + 48
    px = bytearray(W * H * 4)
    fill_rect(px, W, H, 0, 0, W, H, (255, 255, 255))
    x = gap
    for im in images:
        for y in range(size):
            src = y * size * 4
            dst = ((y + 36) * W + x) * 4
            px[dst : dst + size * 4] = im[src : src + size * 4]
        x += size + gap
    return px, W, H


def main() -> None:
    OUT.mkdir(exist_ok=True)
    redondo = load_redondo_rows(LEX / "Redondo-BRM-2007" / "Redondo(2007).txt")
    warr = load_warriner_rows(LEX / "warriner.csv")
    red_scaled = [(scale19(v), scale19(a), scale19(d)) for _, v, a, d in redondo]
    war_scaled = [(scale19(v), scale19(a), scale19(d)) for _, v, a, d in warr]
    coef = ols_fit(red_scaled)
    # 5-fold like holdout: last 20%
    cut = int(len(red_scaled) * 0.8)
    coef_cv = ols_fit(red_scaled[:cut])
    fit_info = {
        "formula": "D = b0 + b1*V + b2*A + b3*V*A + b4*V^2  (V,A,D en 0–1)",
        "coef_redondo": coef,
        "redondo_train": metrics(red_scaled, coef),
        "redondo_holdout20": metrics(red_scaled[cut:], coef_cv),
        "warriner_transfer": metrics(war_scaled, coef),
        "corr_V_D_redondo": pearson([v for v, _, _ in red_scaled], [d for _, _, d in red_scaled]),
        "corr_A_D_redondo": pearson([a for _, a, _ in red_scaled], [d for _, _, d in red_scaled]),
        "corr_V_D_warriner": pearson([v for v, _, _ in war_scaled], [d for _, _, d in war_scaled]),
    }

    nrc = {
        "es": load_nrc(LEX / "NRC-VAD-Lexicon/OneFilePerLanguage/Spanish-NRC-VAD-Lexicon.txt", 4),
        "pt": load_nrc(LEX / "NRC-VAD-Lexicon/OneFilePerLanguage/Portuguese-NRC-VAD-Lexicon.txt", 4),
        "en": load_nrc(LEX / "NRC-VAD-Lexicon/NRC-VAD-Lexicon.txt", None),
    }
    native = {
        "es": load_stadthagen(LEX / "stadthagen.csv", coef),
        "pt": load_soares(LEX / "soares.xls"),
        "en": load_warriner_lex(LEX / "warriner.csv"),
    }
    concepts, entries = load_concepts()

    report = {"dominance_model": fit_info, "lexicon_sizes": {
        "nrc_es": len(nrc["es"].words),
        "nrc_pt": len(nrc["pt"].words),
        "nrc_en": len(nrc["en"].words),
        "stadthagen": len(native["es"].words),
        "soares": len(native["pt"].words),
        "warriner": len(native["en"].words),
    }, "stories": []}

    for story in STORIES:
        tokens = tokenize(story["text"])
        lang = story["lang"]
        c_hits, c_painted = extract_concepts(story["text"], concepts, entries)
        n_hits, n_painted = nrc[lang].lookup_seq(tokens)
        b_hits, b_painted = native[lang].lookup_seq(tokens)

        panels = []
        row = {"slug": story["slug"], "lang": lang, "title": story["title"], "tokens": len(tokens), "systems": {}}
        for key, hits, painted in (("concepts", c_hits, c_painted), ("nrc", n_hits, n_painted), ("native", b_hits, b_painted)):
            ntok = len(tokens)
            pct = painted / ntok * 100 if ntok else 0.0
            units = units_from_concepts(hits) if key == "concepts" else units_from_vad(hits)
            im = draw_stripes(units, story["id"])
            fname = f"{story['slug']}-{key}.png"
            write_png(OUT / fname, SIZE, SIZE, im)
            panels.append(im)
            row["systems"][key] = {
                "painted_tokens": painted,
                "tokens": ntok,
                "coverage_pct": round(pct, 1),
                "stripes": len(hits),
                "file": fname,
                "hits": hits[:20],
            }
        sheet, W, H = hstack(panels, SIZE)
        write_png(OUT / f"{story['slug']}-trio.png", W, H, sheet)
        report["stories"].append(row)

    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"dominance_model": fit_info, "lexicon_sizes": report["lexicon_sizes"],
                      "summary": [
                          {
                              "slug": s["slug"],
                              "lang": s["lang"],
                              "tokens": s["tokens"],
                              "concepts": (s["systems"]["concepts"]["coverage_pct"], s["systems"]["concepts"]["stripes"]),
                              "nrc": (s["systems"]["nrc"]["coverage_pct"], s["systems"]["nrc"]["stripes"]),
                              "native": (s["systems"]["native"]["coverage_pct"], s["systems"]["native"]["stripes"]),
                          }
                          for s in report["stories"]
                      ]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

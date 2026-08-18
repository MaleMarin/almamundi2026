#!/usr/bin/env python3
"""NRC-VAD filtrado + lematizado (spaCy). Prototipo local, sin commit."""

from __future__ import annotations

import importlib.util
import json
import sys
import warnings
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LEX = ROOT / "tmp-lexicons"
OUT = ROOT / "tmp-vad-compare" / "lemma"
sys.path.insert(0, str(LEX / "_py"))

warnings.filterwarnings("ignore", category=UserWarning)

spec = importlib.util.spec_from_file_location("vadcmp", ROOT / "tmp-preview-vad-compare.py")
vad = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vad)

def fold_adv(raw: str) -> str:
    s = raw.lower().replace("ã", "a").replace("õ", "o").replace("â", "a").replace("ê", "e").replace("ô", "o")
    return vad.fold(s)


KEEP_POS = {"NOUN", "PROPN", "VERB", "ADJ", "ADV"}
# Adverbios que no son de modo (grado, negación, tiempo, discurso).
NON_MANNER_ADV = {
    # es
    "no", "si", "sí", "ya", "aun", "aún", "tambien", "también", "tampoco",
    "muy", "mas", "más", "menos", "tan", "tanto", "casi", "apenas",
    "ahora", "hoy", "ayer", "manana", "mañana", "siempre", "nunca", "jamas",
    "jamás", "luego",     "despues", "después", "antes", "entonces", "aqui", "quando", "cuando",
    "aquí", "alli", "allí", "ahi", "ahí", "asi", "así", "solo", "sólo",
    "solamente", "incluso", "ademas", "además", "quizas", "quizá", "quiza",
    "acaso", "todavia", "todavía",
    # pt
    "nao", "não", "ja", "já", "ainda", "tambem", "também", "tampouco",
    "muito", "mais", "menos", "tao", "tão", "quase", "agora", "hoje",
    "ontem", "amanha", "amanhã", "sempre", "nunca", "jamais", "depois",
    "antes", "entao", "então", "aqui", "ali", "la", "lá", "assim", "so",
    "só", "somente", "alem", "além", "talvez",
    # en
    "not", "n't", "also", "too", "very", "more", "most", "less", "least",
    "so", "just", "only", "even", "already", "still", "yet", "now", "then",
    "here", "there", "always", "never", "ever", "often", "sometimes",
    "today", "yesterday", "tomorrow", "quite", "rather", "almost",
}

MODELS = {
    "es": "es_core_news_sm",
    "pt": "pt_core_news_sm",
    "en": "en_core_web_sm",
}


def is_content(tok) -> bool:
    if tok.pos_ not in KEEP_POS:
        return False
    if tok.pos_ == "VERB" and tok.dep_ == "aux":
        return False
    if tok.pos_ == "ADV" and fold_adv(tok.lemma_) in NON_MANNER_ADV:
        return False
    if tok.pos_ == "ADV" and fold_adv(tok.text) in NON_MANNER_ADV:
        return False
    if len(vad.fold(tok.lemma_ or tok.text)) < 2:
        return False
    return True


def content_items(nlp, text: str) -> list[dict]:
    doc = nlp(text)
    items = []
    for tok in doc:
        if not tok.is_alpha:
            continue
        if not is_content(tok):
            continue
        items.append(
            {
                "text": tok.text,
                "lemma": tok.lemma_,
                "pos": tok.pos_,
                "fold_lemma": vad.fold(tok.lemma_),
                "fold_text": vad.fold(tok.text),
            }
        )
    return items


def nrc_lookup(lex: vad.Lex, items: list[dict]) -> tuple[list[dict], list[dict], int]:
    order: list[str] = []
    counts: dict[str, int] = {}
    vads: dict[str, tuple[float, float, float]] = {}
    painted_items: list[dict] = []
    missed: list[dict] = []
    for it in items:
        hit = None
        key = None
        for cand in (it["fold_lemma"], it["fold_text"]):
            if cand in lex.words:
                hit = lex.words[cand]
                key = cand
                break
        if hit is None:
            missed.append(it)
            continue
        if key not in counts:
            order.append(key)
            vads[key] = hit
        counts[key] = counts.get(key, 0) + 1
        painted_items.append({**it, "key": key})
    hits = [
        {
            "word": k,
            "count": counts[k],
            "v": vads[k][0],
            "a": vads[k][1],
            "d": vads[k][2],
        }
        for k in order
    ]
    return hits, missed, len(painted_items)


def concept_on_content(items: list[dict], concepts, entries) -> tuple[list[dict], int]:
    phrase = {}
    word = {}
    for cid, words in entries:
        for w in words:
            parts = w.split(" ")
            if len(parts) > 1:
                phrase[w] = cid
            elif w not in word:
                word[w] = cid
    order = []
    counts = {}
    painted = 0
    for it in items:
        cid = word.get(it["fold_lemma"]) or word.get(it["fold_text"])
        if cid is None:
            continue
        if cid not in counts:
            order.append(cid)
        counts[cid] = counts.get(cid, 0) + 1
        painted += 1
    hits = []
    for cid in order:
        name, hx = concepts[cid]
        hits.append({"word": name, "count": counts[cid], "hex": hx})
    return hits, painted


def main() -> None:
    import es_core_news_sm
    import pt_core_news_sm
    import en_core_web_sm

    OUT.mkdir(parents=True, exist_ok=True)
    nlps = {
        "es": es_core_news_sm.load(),
        "pt": pt_core_news_sm.load(),
        "en": en_core_web_sm.load(),
    }
    nrc = {
        "es": vad.load_nrc(LEX / "NRC-VAD-Lexicon/OneFilePerLanguage/Spanish-NRC-VAD-Lexicon.txt", 4),
        "pt": vad.load_nrc(LEX / "NRC-VAD-Lexicon/OneFilePerLanguage/Portuguese-NRC-VAD-Lexicon.txt", 4),
        "en": vad.load_nrc(LEX / "NRC-VAD-Lexicon/NRC-VAD-Lexicon.txt", None),
    }
    concepts, entries = vad.load_concepts()

    report = {"stories": []}
    for story in vad.STORIES:
        lang = story["lang"]
        items = content_items(nlps[lang], story["text"])
        n_hits, missed, n_painted = nrc_lookup(nrc[lang], items)
        ntok = len(items)
        pct = n_painted / ntok * 100 if ntok else 0.0

        nrc_im = vad.draw_stripes(vad.units_from_vad(n_hits), story["id"])
        nrc_name = f"{story['slug']}-nrc.png"
        vad.write_png(OUT / nrc_name, vad.SIZE, vad.SIZE, nrc_im)

        row = {
            "slug": story["slug"],
            "lang": lang,
            "title": story["title"],
            "content_words": ntok,
            "content_pos": [{"t": i["text"], "lemma": i["lemma"], "pos": i["pos"]} for i in items],
            "nrc": {
                "painted": n_painted,
                "coverage_pct": round(pct, 1),
                "stripes": len(n_hits),
                "file": nrc_name,
                "hits": n_hits,
                "missed": [{"t": m["text"], "lemma": m["lemma"], "pos": m["pos"]} for m in missed],
            },
        }

        if lang == "es":
            c_hits, c_painted = concept_on_content(items, concepts, entries)
            c_pct = c_painted / ntok * 100 if ntok else 0.0
            c_im = vad.draw_stripes(vad.units_from_concepts(c_hits), story["id"])
            c_name = f"{story['slug']}-concepts.png"
            vad.write_png(OUT / c_name, vad.SIZE, vad.SIZE, c_im)
            duo, W, H = vad.hstack([c_im, nrc_im], vad.SIZE)
            vad.write_png(OUT / f"{story['slug']}-duo.png", W, H, duo)
            row["concepts"] = {
                "painted": c_painted,
                "coverage_pct": round(c_pct, 1),
                "stripes": len(c_hits),
                "file": c_name,
                "hits": c_hits,
            }

        report["stories"].append(row)

    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = []
    for s in report["stories"]:
        rec = {
            "slug": s["slug"],
            "lang": s["lang"],
            "content": s["content_words"],
            "nrc": (s["nrc"]["coverage_pct"], s["nrc"]["stripes"], s["nrc"]["missed"]),
        }
        if "concepts" in s:
            rec["concepts"] = (s["concepts"]["coverage_pct"], s["concepts"]["stripes"])
        summary.append(rec)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

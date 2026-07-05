import re


HESITATION_TERMS = {"maybe", "probably", "i think", "not sure", "kind of", "sort of"}


def score_confidence(answer):
    text = (answer or "").strip()
    words = re.findall(r"[A-Za-z]+", text)
    if not words:
        return 0.0

    score = 7.0
    lower_text = text.lower()
    hesitation_hits = sum(1 for term in HESITATION_TERMS if term in lower_text)
    score -= hesitation_hits * 0.8
    if len(words) < 15:
        score -= 1.5
    if re.search(r"\b(definitely|clearly|specifically|for example)\b", lower_text):
        score += 0.8
    if text.endswith(".") or text.endswith("!"):
        score += 0.3

    return round(max(0.0, min(10.0, score)), 1)

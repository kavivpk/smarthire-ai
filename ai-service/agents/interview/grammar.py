import re


def score_grammar(answer):
    text = (answer or "").strip()
    if not text:
        return 0.0

    sentences = [s for s in re.split(r"[.!?]+", text) if s.strip()]
    words = re.findall(r"[A-Za-z]+", text)
    if not words:
        return 1.0

    score = 8.0
    if text[0].islower():
        score -= 0.8
    if sentences and len(words) / len(sentences) > 32:
        score -= 0.8
    if re.search(r"\b(i|im|dont|cant|wont|isnt|doesnt)\b", text):
        score -= 0.7
    if len(re.findall(r"\s{2,}", text)) > 0:
        score -= 0.4
    if not re.search(r"[.!?]$", text):
        score -= 0.3
    if len(words) < 12:
        score -= 1.0

    return round(max(0.0, min(10.0, score)), 1)

import re


STRUCTURE_TERMS = {
    "first",
    "second",
    "because",
    "therefore",
    "for example",
    "in short",
    "however",
    "also",
}


def score_communication(answer):
    text = (answer or "").strip()
    words = re.findall(r"[A-Za-z]+", text)
    if not words:
        return 0.0

    score = 4.0
    word_count = len(words)
    if word_count >= 25:
        score += 2.0
    elif word_count >= 12:
        score += 1.0

    lower_text = text.lower()
    if any(term in lower_text for term in STRUCTURE_TERMS):
        score += 1.5
    if 8 <= (word_count / max(1, len(re.split(r"[.!?]+", text)))) <= 28:
        score += 1.0
    if "," in text or "." in text:
        score += 0.8
    if word_count > 90:
        score -= 0.5

    return round(max(0.0, min(10.0, score)), 1)

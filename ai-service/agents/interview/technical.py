import re

from .keyword_match import score_keyword_match


TECHNICAL_SIGNALS = {
    "state",
    "component",
    "function",
    "object",
    "class",
    "database",
    "query",
    "api",
    "async",
    "memory",
    "complexity",
    "render",
    "scope",
    "server",
    "client",
}


def score_technical_accuracy(question, answer, keywords=None, expected_answer=None):
    text = (answer or "").strip()
    words = re.findall(r"[A-Za-z]+", text.lower())
    if not words:
        return 0.0

    keyword_result = score_keyword_match(answer, keywords)
    score = 3.0 + (keyword_result["score"] * 0.45)

    technical_hits = len({word for word in words if word in TECHNICAL_SIGNALS})
    score += min(2.0, technical_hits * 0.4)

    if expected_answer:
        expected_terms = set(re.findall(r"[A-Za-z]{4,}", expected_answer.lower()))
        answer_terms = set(re.findall(r"[A-Za-z]{4,}", text.lower()))
        if expected_terms:
            overlap = len(expected_terms & answer_terms) / len(expected_terms)
            score += min(2.0, overlap * 2.0)

    if len(words) < 12:
        score -= 1.0

    return round(max(0.0, min(10.0, score)), 1)

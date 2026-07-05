import re


def normalize_terms(values):
    if not values:
        return []
    terms = []
    for value in values:
        if isinstance(value, str) and value.strip():
            terms.append(value.strip().lower())
    return terms


def score_keyword_match(answer, keywords):
    terms = normalize_terms(keywords)
    if not terms:
        return {"score": 5.0, "percentage": 50, "matched": [], "missing": []}

    answer_text = (answer or "").lower()
    matched = []
    for term in terms:
        pattern = r"\b" + re.escape(term).replace(r"\ ", r"\s+") + r"\b"
        if re.search(pattern, answer_text):
            matched.append(term)

    percentage = round((len(matched) / len(terms)) * 100)
    score = round(percentage / 10, 1)
    missing = [term for term in terms if term not in matched]
    return {"score": score, "percentage": percentage, "matched": matched, "missing": missing}

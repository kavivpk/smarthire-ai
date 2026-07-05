def build_feedback(scores, keyword_result):
    overall = scores["overallScore"]
    missing = keyword_result.get("missing", [])
    matched = keyword_result.get("matched", [])

    if overall >= 8:
        feedback = "Strong answer with clear coverage of the main technical points."
    elif overall >= 6:
        feedback = "Good attempt, but the answer can be more complete and structured."
    elif overall >= 4:
        feedback = "The answer shows partial understanding and needs more technical detail."
    else:
        feedback = "The answer is too limited and needs stronger conceptual explanation."

    if missing:
        feedback += f" Consider mentioning: {', '.join(missing[:3])}."

    strength = "Clear communication" if scores["communicationScore"] >= 7 else "Basic understanding"
    if matched:
        strength = f"Covered key terms: {', '.join(matched[:3])}"

    weakness = "Needs more technical depth"
    if scores["grammarScore"] < 6:
        weakness = "Grammar and sentence clarity need improvement"
    elif scores["confidenceScore"] < 6:
        weakness = "Answer sounds uncertain and should be more confident"
    elif missing:
        weakness = f"Missing key points: {', '.join(missing[:3])}"

    if overall >= 8:
        recommendation = "Proceed to harder scenario-based questions."
    elif overall >= 6:
        recommendation = "Revise the missing concepts and practice concise examples."
    else:
        recommendation = "Review fundamentals before attempting advanced interview questions."

    return {
        "feedback": feedback,
        "strength": strength,
        "weakness": weakness,
        "recommendation": recommendation,
    }

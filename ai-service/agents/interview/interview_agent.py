from .communication import score_communication
from .confidence import score_confidence
from .feedback import build_feedback
from .grammar import score_grammar
from .keyword_match import score_keyword_match
from .technical import score_technical_accuracy


def evaluate_answer(payload):
    question = payload.get("question", "")
    answer = payload.get("answer", "")
    keywords = payload.get("keywords") or []
    expected_answer = payload.get("expectedAnswer") or payload.get("expected_answer")

    keyword_result = score_keyword_match(answer, keywords)
    technical_score = score_technical_accuracy(question, answer, keywords, expected_answer)
    communication_score = score_communication(answer)
    grammar_score = score_grammar(answer)
    confidence_score = score_confidence(answer)
    keyword_score = keyword_result["score"]

    overall = round(
        technical_score * 0.35
        + communication_score * 0.2
        + grammar_score * 0.15
        + confidence_score * 0.15
        + keyword_score * 0.15,
        1,
    )

    scores = {
        "technicalScore": technical_score,
        "communicationScore": communication_score,
        "grammarScore": grammar_score,
        "confidenceScore": confidence_score,
        "keywordScore": keyword_score,
        "keywordMatch": keyword_result["percentage"],
        "overallScore": overall,
    }

    feedback = build_feedback(scores, keyword_result)
    return {
        **scores,
        **feedback,
        "matchedKeywords": keyword_result["matched"],
        "missingKeywords": keyword_result["missing"],
    }

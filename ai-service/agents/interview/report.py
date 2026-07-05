def build_summary(evaluations):
    if not evaluations:
        return {
            "overallScore": 0,
            "averageTechnical": 0,
            "averageCommunication": 0,
            "averageGrammar": 0,
            "averageConfidence": 0,
            "strongestSkill": "N/A",
            "weakestSkill": "N/A",
            "recommendations": ["Complete an interview to generate a summary."],
        }

    def avg(key):
        return round(sum(item.get(key, 0) for item in evaluations) / len(evaluations), 1)

    dimensions = {
        "Technical": avg("technicalScore"),
        "Communication": avg("communicationScore"),
        "Grammar": avg("grammarScore"),
        "Confidence": avg("confidenceScore"),
        "Keyword Match": avg("keywordScore"),
    }

    strongest = max(dimensions, key=dimensions.get)
    weakest = min(dimensions, key=dimensions.get)
    overall = avg("overallScore")

    recommendations = []
    if dimensions["Technical"] < 7:
        recommendations.append("Review technical fundamentals and include concrete examples.")
    if dimensions["Communication"] < 7:
        recommendations.append("Use a short structure: definition, explanation, example, tradeoff.")
    if dimensions["Confidence"] < 7:
        recommendations.append("Practice direct answers with fewer hesitant phrases.")
    if not recommendations:
        recommendations.append("Continue with advanced interview practice.")

    return {
        "overallScore": overall,
        "averageTechnical": dimensions["Technical"],
        "averageCommunication": dimensions["Communication"],
        "averageGrammar": dimensions["Grammar"],
        "averageConfidence": dimensions["Confidence"],
        "strongestSkill": strongest,
        "weakestSkill": weakest,
        "recommendations": recommendations,
    }

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import pandas as pd

# Training data — sample dataset
def create_training_data():
    data = {
        'cgpa': [9.2, 8.5, 7.8, 6.5, 5.9, 8.9, 7.2, 9.5, 6.8, 8.1,
                 7.5, 9.0, 6.2, 8.7, 7.0, 9.3, 6.9, 8.3, 7.6, 5.5,
                 8.8, 7.3, 9.1, 6.4, 8.0, 7.7, 9.4, 6.1, 8.6, 7.4],
        'skills_count': [12, 9, 7, 4, 3, 11, 6, 14, 5, 8,
                         7, 12, 3, 10, 5, 13, 4, 9, 7, 2,
                         11, 6, 13, 3, 8, 7, 14, 3, 10, 6],
        'projects': [4, 3, 2, 1, 1, 4, 2, 5, 1, 3,
                     2, 4, 1, 3, 1, 5, 1, 3, 2, 0,
                     4, 2, 5, 1, 3, 2, 5, 0, 3, 2],
        'internships': [2, 1, 1, 0, 0, 2, 1, 3, 0, 1,
                        1, 2, 0, 2, 0, 3, 0, 1, 1, 0,
                        2, 1, 3, 0, 1, 1, 3, 0, 2, 1],
        'backlogs': [0, 0, 1, 2, 3, 0, 1, 0, 2, 0,
                     1, 0, 3, 0, 2, 0, 2, 0, 1, 4,
                     0, 1, 0, 3, 0, 1, 0, 3, 0, 1],
        'communication': [9, 8, 7, 5, 4, 9, 6, 10, 5, 7,
                          7, 9, 4, 8, 5, 10, 5, 8, 7, 3,
                          9, 6, 10, 4, 7, 7, 10, 4, 8, 6],
        'technical_score': [90, 78, 65, 50, 40, 88, 60, 95, 52, 72,
                            65, 88, 38, 80, 55, 92, 48, 75, 68, 30,
                            85, 62, 91, 42, 70, 67, 94, 35, 80, 60],
        'placed': [1, 1, 1, 0, 0, 1, 0, 1, 0, 1,
                   1, 1, 0, 1, 0, 1, 0, 1, 1, 0,
                   1, 0, 1, 0, 1, 1, 1, 0, 1, 0]
    }
    return pd.DataFrame(data)

# Train model
def train_model():
    df = create_training_data()
    X = df[['cgpa', 'skills_count', 'projects', 'internships',
            'backlogs', 'communication', 'technical_score']]
    y = df['placed']

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    return model

# Global model
model = train_model()

def predict_placement(data: dict) -> dict:
    skills_count = len(data.get('skills', []))

    features = np.array([[
        data['cgpa'],
        skills_count,
        data['projects'],
        data['internships'],
        data['backlogs'],
        data['communication'],
        data['technical_score']
    ]])

    # Predict
    probability = model.predict_proba(features)[0]
    placed_prob = round(probability[1] * 100, 1)
    not_placed_prob = round(probability[0] * 100, 1)

    # Company tier prediction
    if placed_prob >= 80:
        company_tier = "Product Based (Google, Amazon, Microsoft)"
        tier_color = "green"
    elif placed_prob >= 60:
        company_tier = "Service Based (TCS, Infosys, Wipro)"
        tier_color = "blue"
    elif placed_prob >= 40:
        company_tier = "Startup / Mid-level Companies"
        tier_color = "amber"
    else:
        company_tier = "Needs More Preparation"
        tier_color = "red"

    # Improvement tips
    tips = []
    if data['cgpa'] < 7.0:
        tips.append("Improve your CGPA — aim for 7.5+")
    if data['backlogs'] > 0:
        tips.append("Clear all backlogs as soon as possible")
    if skills_count < 6:
        tips.append("Learn more in-demand tech skills (target 8+)")
    if data['projects'] < 2:
        tips.append("Build at least 2-3 strong projects")
    if data['internships'] == 0:
        tips.append("Apply for internships to get real experience")
    if data['communication'] < 6:
        tips.append("Work on communication and soft skills")
    if placed_prob >= 75:
        tips.append("Strong profile! Focus on DSA and system design")

    return {
        "placement_probability": placed_prob,
        "not_placed_probability": not_placed_prob,
        "predicted_company_tier": company_tier,
        "tier_color": tier_color,
        "improvement_tips": tips,
        "skills_count": skills_count,
        "profile_strength": "Strong" if placed_prob >= 70 else "Average" if placed_prob >= 40 else "Weak"
    }
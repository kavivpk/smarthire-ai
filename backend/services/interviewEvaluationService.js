const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const callAiService = async (path, payload) => {
  const response = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI service error: ${errorText}`);
  }

  return response.json();
};

const evaluateTechnicalAnswer = async (payload) => {
  return callAiService('/api/agents/interview/evaluate', payload);
};

const summarizeTechnicalInterview = async (evaluations) => {
  return callAiService('/api/agents/interview/summary', { evaluations });
};

module.exports = {
  evaluateTechnicalAnswer,
  summarizeTechnicalInterview
};

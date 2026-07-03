import { useState } from 'react';
import { AI_SERVICE_URL } from '../config/apiConfig';
import { useTheme } from '../context/useTheme';

const SKILLS_LIST = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js',
  'MongoDB', 'SQL', 'HTML/CSS', 'Git', 'Docker',
  'AWS', 'Machine Learning', 'TypeScript', 'DSA', 'System Design'
];

export default function PlacementPrediction() {
  const { isDark } = useTheme();
  const borderDefault = isDark ? '#374151' : '#d1d5db';
  const [formData, setFormData] = useState({
    cgpa: '',
    skills: [],
    projects: '',
    internships: '',
    backlogs: '',
    communication: 5,
    technical_score: 50,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.cgpa || !formData.projects || formData.skills.length === 0) {
      setError('Please fill all required fields and select at least one skill');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/prediction/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cgpa: parseFloat(formData.cgpa),
          skills: formData.skills,
          projects: parseInt(formData.projects),
          internships: parseInt(formData.internships || 0),
          backlogs: parseInt(formData.backlogs || 0),
          communication: parseInt(formData.communication),
          technical_score: parseInt(formData.technical_score),
        })
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setError('Prediction failed — make sure AI service is running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  const getProbColor = (prob) => {
    if (prob >= 70) return '#22c55e';
    if (prob >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

      <div className="max-w-5xl mx-auto p-6">

        {!result ? (

          /* ── FORM ── */
          <div className="space-y-4">

            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Check Your Placement Probability
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                ML model analyzes your profile → predicts placement chances
              </p>
            </div>

            {/* Academic Details */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-xs uppercase tracking-widest">
                Academic Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">
                    CGPA * (out of 10)
                  </label>
                  <input
                    type="number"
                    name="cgpa"
                    value={formData.cgpa}
                    onChange={handleChange}
                    placeholder="8.5"
                    min="0" max="10" step="0.1"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">
                    Active Backlogs
                  </label>
                  <input
                    type="number"
                    name="backlogs"
                    value={formData.backlogs}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">
                    Projects Count *
                  </label>
                  <input
                    type="number"
                    name="projects"
                    value={formData.projects}
                    onChange={handleChange}
                    placeholder="3"
                    min="0"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-400 text-xs mb-1 block">
                    Internships Count
                  </label>
                  <input
                    type="number"
                    name="internships"
                    value={formData.internships}
                    onChange={handleChange}
                    placeholder="1"
                    min="0"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Skills + Self Assessment — side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Skills */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-xs uppercase tracking-widest">
                  Your Skills *
                </h3>
                <p className="text-gray-400 text-xs mb-4">
                  {formData.skills.length} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_LIST.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150"
                      style={formData.skills.includes(skill) ? {
                        backgroundColor: '#22c55e20',
                        borderColor: '#22c55e',
                        color: '#22c55e'
                      } : {
                        backgroundColor: 'transparent',
                        borderColor: borderDefault,
                        color: isDark ? '#9ca3af' : '#6b7280'
                      }}
                    >
                      {formData.skills.includes(skill) ? '✓ ' : ''}{skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Self Assessment */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-xs uppercase tracking-widest">
                  Self Assessment
                </h3>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="text-gray-500 dark:text-gray-400 text-xs">
                      Communication Skills
                    </label>
                    <span className="text-green-500 text-xs font-medium">
                      {formData.communication} / 10
                    </span>
                  </div>
                  <input
                    type="range" min="1" max="10" step="1"
                    name="communication"
                    value={formData.communication}
                    onChange={handleChange}
                    className="w-full accent-green-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-gray-500 dark:text-gray-400 text-xs">
                      Technical Knowledge
                    </label>
                    <span className="text-green-500 text-xs font-medium">
                      {formData.technical_score} / 100
                    </span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="5"
                    name="technical_score"
                    value={formData.technical_score}
                    onChange={handleChange}
                    className="w-full accent-green-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Beginner</span>
                    <span>Expert</span>
                  </div>
                </div>
              </div>

            </div>

            {error && (
              <p className="text-red-500 text-sm px-1">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#22c55e' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Predicting...
                </span>
              ) : 'Predict My Placement 🎯'}
            </button>

          </div>

        ) : (

          /* ── RESULT ── */
          <div className="space-y-4">

            {/* Top row — Score + Company + Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Score circle */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Placement Probability
                </p>
                <div className="relative w-36 h-36 mb-4">
                  <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="2.5"/>
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={getProbColor(result.placement_probability)}
                      strokeWidth="2.5"
                      strokeDasharray={`${result.placement_probability} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {result.placement_probability}%
                    </span>
                  </div>
                </div>
                <span className="text-sm font-medium px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: `${getProbColor(result.placement_probability)}20`,
                    color: getProbColor(result.placement_probability)
                  }}>
                  {result.profile_strength} Profile
                </span>
              </div>

              {/* Right side cards */}
              <div className="space-y-3">

                {/* Company tier */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Best Suited For
                  </p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    🏢 {result.predicted_company_tier}
                  </p>
                </div>

                {/* Profile bars */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 uppercase tracking-wide">
                    Profile Breakdown
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Placement Chance</span>
                        <span className="font-medium" style={{ color: getProbColor(result.placement_probability) }}>
                          {result.placement_probability}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
                        <div className="h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${result.placement_probability}%`,
                            backgroundColor: getProbColor(result.placement_probability)
                          }}/>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Skills Strength</span>
                        <span className="text-blue-500 font-medium">
                          {result.skills_count} skills
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
                        <div className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                          style={{ width: `${Math.min(result.skills_count * 7, 100)}%` }}/>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Not Placed Risk</span>
                        <span className="text-red-400 font-medium">
                          {result.not_placed_probability}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
                        <div className="h-2 rounded-full bg-red-400 transition-all duration-700"
                          style={{ width: `${result.not_placed_probability}%` }}/>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Tips — full width 2 col grid */}
            {result.improvement_tips.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                  💡 Improvement Tips
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.improvement_tips.map((tip, i) => (
                    <div key={i}
                      className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <span className="text-green-500 mt-0.5 flex-shrink-0 font-bold">→</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Try again */}
            <button
              onClick={() => setResult(null)}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors"
              style={{ backgroundColor: '#22c55e' }}
            >
              Try Again 🔄
            </button>

          </div>
        )}
      </div>
    </div>
  );
}

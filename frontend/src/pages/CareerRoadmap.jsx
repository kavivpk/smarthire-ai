import { useState } from 'react';

const ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'DevOps Engineer',
];

const SUGGESTED_SKILLS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js',
  'MongoDB', 'SQL', 'Git', 'Docker', 'AWS',
  'TypeScript', 'DSA', 'REST APIs', 'CSS', 'HTML',
];

export default function CareerRoadmap() {
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [currentSkills, setCurrentSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !currentSkills.includes(trimmed)) {
      setCurrentSkills([...currentSkills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setCurrentSkills(currentSkills.filter(s => s !== skill));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      addSkill(skillInput);
    }
  };

  const handleGenerate = async () => {
    if (currentSkills.length === 0) {
      setError('Please add at least one skill');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole,
          current_skills: currentSkills,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed');
      setResult(data);
    } catch {
      setError('Failed to generate roadmap. Make sure AI service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">

      
      <div className="max-w-4xl mx-auto p-6">

        {!result ? (

          /* Form */
          <div className="space-y-4">

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Career Roadmap Generator
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Add your current skills and get a personalized 8-week learning plan
              </p>
            </div>

            {/* Target Role */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                🎯 Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
              >
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Current Skills */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                🧠 Your Current Skills
              </label>

              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a skill and press Enter (e.g. React)"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 mb-3"
              />

              {/* Suggested skills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SUGGESTED_SKILLS.filter(s => !currentSkills.includes(s)).map(skill => (
                  <button
                    key={skill}
                    onClick={() => addSkill(skill)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-500 hover:text-amber-500 transition-colors"
                  >
                    + {skill}
                  </button>
                ))}
              </div>

              {/* Selected skills */}
              {currentSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentSkills.map(skill => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1"
                      style={{ backgroundColor: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40' }}
                    >
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-1 hover:opacity-70">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm px-1">{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading || currentSkills.length === 0}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#f59e0b' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Generating...
                </span>
              ) : '🚀 Generate My Roadmap'}
            </button>

          </div>

        ) : (

          /* Result */
          <div className="space-y-4">

            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {result.target_role} Roadmap
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {result.total_weeks} weeks plan · {result.completion_percentage}% already complete
                  </p>
                </div>
                <span
                  className="text-sm font-medium px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
                >
                  {result.completion_percentage}% ready
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${result.completion_percentage}%`, backgroundColor: '#f59e0b' }}
                />
              </div>
            </div>

            {/* Known + Missing skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                  <span className="text-green-500">✓</span> Already Know ({result.already_known.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.already_known.length > 0 ? result.already_known.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                      {s}
                    </span>
                  )) : (
                    <p className="text-gray-400 text-xs">Keep learning!</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                  <span className="text-red-500">✗</span> Need to Learn ({result.missing_skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_skills.length > 0 ? result.missing_skills.map((s, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      {s}
                    </span>
                  )) : (
                    <p className="text-green-400 text-xs">You know all required skills!</p>
                  )}
                </div>
              </div>
            </div>

            {/* 8 Week Timeline */}
            <div className="space-y-3">
              <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-medium px-1">
                8-Week Learning Timeline
              </h3>
              {result.weeks.map((week, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
                    >
                      Week {week.week}
                    </span>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {week.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Topics */}
                    <div>
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Topics</p>
                      <ul className="space-y-1">
                        {week.topics.map((t, j) => (
                          <li key={j} className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-1">
                            <span className="text-amber-500">→</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Resources */}
                    <div>
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Resources</p>
                      <ul className="space-y-1">
                        {week.resources.map((r, j) => (
                          <li key={j} className="text-gray-600 dark:text-gray-400 text-xs flex items-center gap-1">
                            <span className="text-blue-500">📖</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Project */}
                    <div>
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Project</p>
                      <div
                        className="text-xs p-2 rounded-lg"
                        style={{ backgroundColor: '#f59e0b10', color: '#f59e0b' }}
                      >
                        🛠️ {week.project}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full py-3 rounded-xl font-medium text-white transition-colors"
              style={{ backgroundColor: '#f59e0b' }}
            >
              Generate Another Roadmap 🔄
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
// frontend/src/pages/CareerRoadmap.jsx

import { useState } from "react";
import axios from "axios";

const SKILL_SUGGESTIONS = [
  "HTML", "CSS", "JavaScript", "React", "Node.js",
  "Python", "SQL", "MongoDB", "Git", "DSA",
  "Java", "TypeScript", "Docker", "AWS", "REST APIs"
];

export default function CareerRoadmap() {
  const [inputSkill, setInputSkill] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [targetRole, setTargetRole] = useState("Frontend Developer");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setInputSkill("");
  };

  const removeSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputSkill);
    }
  };

  const generateRoadmap = async () => {
    if (selectedSkills.length === 0) {
      setError("Please add at least one skill.");
      return;
    }
    setError("");
    setLoading(true);
    setRoadmap(null);
    try {
      const res = await axios.post("http://localhost:8000/api/roadmap/generate-roadmap", {
        skills: selectedSkills,
        targetRole,
      });
      setRoadmap(res.data);
   } catch (_err) {     
     setError("Failed to generate roadmap. Make sure AI service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            🗺️ Career Roadmap
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Add your current skills → Get a personalized 8-week learning plan
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">

          {/* Target Role */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🎯 Target Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none
                         focus:ring-2 focus:ring-blue-500"
            >
              {["Frontend Developer", "Backend Developer", "Full Stack Developer",
                "Data Scientist", "ML Engineer", "DevOps Engineer", "Android Developer"
              ].map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Skill Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🧠 Your Current Skills
            </label>
            <input
              type="text"
              value={inputSkill}
              onChange={(e) => setInputSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill and press Enter (e.g. React)"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick add suggestions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SKILL_SUGGESTIONS.filter((s) => !selectedSkills.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900
                           text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition"
              >
                + {s}
              </button>
            ))}
          </div>

          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedSkills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900
                             text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                >
                  {s}
                  <button
                    onClick={() => removeSkill(s)}
                    className="ml-1 text-green-500 hover:text-red-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            onClick={generateRoadmap}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                       text-white font-semibold rounded-xl transition"
          >
            {loading ? "⏳ Generating your roadmap..." : "🚀 Generate My Roadmap"}
          </button>
        </div>

        {/* Roadmap Output */}
        {roadmap && (
          <div className="space-y-4">

            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                {roadmap.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {roadmap.totalWeeks}-week personalized learning plan for {targetRole}
              </p>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                    ✅ Strong Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {roadmap.strongSkills?.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-green-100 dark:bg-green-900
                                               text-green-700 dark:text-green-300 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-500 mb-1">
                    📚 Skills to Learn
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {roadmap.missingSkills?.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900
                                               text-orange-700 dark:text-orange-300 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Timeline */}
            {roadmap.weeks?.map((week, ) => (
              <div
                key={week.week}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6
                           border-l-4 border-blue-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex
                                   items-center justify-center text-sm font-bold">
                    {week.week}
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">{week.title}</h3>
                    <p className="text-sm text-blue-500">{week.focus}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      📝 Tasks
                    </p>
                    <ul className="space-y-1">
                      {week.tasks?.map((task, i) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                          <span className="text-blue-400">•</span> {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      🔗 Resources
                    </p>
                    <ul className="space-y-1">
                      {week.resources?.map((res, i) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                          <span className="text-green-400">→</span> {res}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
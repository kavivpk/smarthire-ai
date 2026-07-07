import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }} className="text-gray-900 dark:text-white">
                SmartHire <span className="text-blue-500">AI</span>
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              AI-powered placement intelligence platform for students and colleges.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Features</h4>
            <ul className="space-y-2">
              {[
                { label: 'Resume Analyzer', path: '/resume' },
                { label: 'Mock Interview', path: '/interview' },
                { label: 'Placement Prediction', path: '/prediction' },
                { label: 'Career Roadmap', path: '/career-roadmap' },
              ].map((item) => (
                <li key={item.path}>
                  <button onClick={() => navigate(item.path)}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Tools</h4>
            <ul className="space-y-2">
              {[
                { label: 'Skill Detection', path: '/fakeskill' },
                { label: 'Dashboard', path: '/dashboard' },
              ].map((item) => (
                <li key={item.path}>
                  <button onClick={() => navigate(item.path)}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>Tech Stack</h4>
            <div className="flex flex-wrap gap-1.5">
              {['React', 'Node.js', 'Python', 'FastAPI', 'MongoDB', 'ML'].map((tech) => (
                <span key={tech}
                  className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-gray-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            © {currentYear} SmartHire AI. Built for campus placements.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              All systems operational
            </span>
            <span className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

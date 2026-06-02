import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Resume', path: '/resume' },
    { label: 'Interview', path: '/interview' },
    { label: 'Prediction', path: '/prediction' },
    { label: 'Roadmap', path: '/career-roadmap' },
    { label: 'Skill Check', path: '/fakeskill' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            SmartHire <span className="text-blue-500">AI</span>
          </span>
        </div>

        {/* Nav Links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: isActive(link.path) ? '#3b82f620' : 'transparent',
                color: isActive(link.path) ? '#3b82f6' : '',
              }}
            >
              <span className={isActive(link.path)
                ? 'text-blue-500 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }>
                {link.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden lg:block">
              {user.name || 'User'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>

      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-gray-100 dark:border-gray-800 px-4 py-2 flex gap-1 overflow-x-auto">
        {navLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              backgroundColor: isActive(link.path) ? '#3b82f620' : 'transparent',
              color: isActive(link.path) ? '#3b82f6' : '#9ca3af',
            }}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
}
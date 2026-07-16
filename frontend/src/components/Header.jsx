import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
    { label: 'Skill Check', path: '/fakeskill' },
    ...(user.role === 'admin' ? [{ label: 'Bulk Screening', path: '/bulk-screening' }] : [])
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700 }}
            className="text-gray-900 dark:text-white">
            SmartHire <span className="text-blue-500">AI</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 14.5,
                fontWeight: isActive(link.path) ? 600 : 500,
                backgroundColor: isActive(link.path) ? '#3b82f620' : 'transparent',
                color: isActive(link.path) ? '#3b82f6' : '',
              }}
            >
              <span className={isActive(link.path)
                ? 'text-blue-500'
                : 'text-gray-600 dark:text-gray-400'}>
                {link.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 hidden lg:block"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
              {user.name || 'User'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="hidden sm:block text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-gray-700"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
          >
            Logout
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            {menuOpen ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-1">
          <div className="flex items-center gap-3 pb-3 mb-2 border-b border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>{user.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize" style={{ fontFamily: 'Inter, sans-serif' }}>{user.role || 'student'}</p>
            </div>
          </div>
          {navLinks.map((link) => (
            <button key={link.path}
              onClick={() => { navigate(link.path); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                fontFamily: 'Inter, sans-serif', fontWeight: isActive(link.path) ? 600 : 500,
                backgroundColor: isActive(link.path) ? '#3b82f620' : 'transparent',
                color: isActive(link.path) ? '#3b82f6' : '',
              }}>
              <span className={isActive(link.path) ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}>
                {link.label}
              </span>
            </button>
          ))}
          <button onClick={handleLogout}
            className="w-full mt-2 text-left px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

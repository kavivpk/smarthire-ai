import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { signInWithGoogle } from '../services/firebase';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const googleUser = await signInWithGoogle();
      const res = await API.post('/auth/google', {
        email: googleUser.email,
        name: googleUser.displayName,
        googleId: googleUser.uid,
        photoURL: googleUser.photoURL
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch {
      setError('Google login failed. Try again.');
    }
  };

  const benefits = [
    '✅ Free ATS Resume Analysis',
    '✅ AI Mock Interviews (5 topics)',
    '✅ ML Placement Prediction',
    '✅ Personalized Career Roadmap',
    '✅ Fake Skill Detection',
    '✅ 8-Week Learning Timeline',
  ];

  return (
    <div className="min-h-screen flex">

      {/* Left — Content */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-700 to-purple-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full"/>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full"/>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-white text-lg">SmartHire AI</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">
            Start Your Placement Journey Today!
          </h2>
          <p className="text-purple-100 text-base leading-relaxed mb-8">
            Get access to all AI-powered tools designed specifically for campus placement preparation.
          </p>

          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-purple-100 text-sm">
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 bg-white/10 border border-white/20 rounded-2xl p-5">
          <p className="text-white text-sm italic leading-relaxed">
            "SmartHire AI helped me identify my skill gaps and prepare effectively. Got placed at a top MNC!"
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">A</div>
            <div>
              <p className="text-white text-xs font-medium">Arjun Kumar</p>
              <p className="text-purple-200 text-xs">Placed at Amazon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">

        {/* Top bar */}
        <div className="flex justify-between items-center px-8 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              SmartHire <span className="text-blue-500">AI</span>
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <div className="w-full max-w-md">

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create Account 🚀
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Join thousands of students preparing for placements
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1.5 block">
                  Full Name
                </label>
                <input type="text" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Your Full Name" required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1.5 block">
                  Email Address
                </label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="you@gmail.com" required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Min 6 characters" required
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1.5 block">
                  Role
                </label>
                <select name="role" value={formData.role} onChange={handleChange}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === 'admin' && (
                <div>
                  <label className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1.5 block">
                    Admin Secret Key
                  </label>
                  <input type="password" name="adminSecret" value={formData.adminSecret || ''}
                    onChange={handleChange} placeholder="Required for Admin registration" required
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-gray-400 text-xs">or continue with</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>

            {/* Google Button */}
            <button type="button" onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                Continue with Google
              </span>
            </button>

            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
                Sign in here
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
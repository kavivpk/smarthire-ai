import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import { signInWithGoogle } from '../services/firebase';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

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
      setError(err.response?.data?.detail || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const googleUser = await signInWithGoogle();
      const res = await API.post('/auth/google', {
        email: googleUser.email, name: googleUser.displayName,
        googleId: googleUser.uid, photoURL: googleUser.photoURL
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch { setError('Google login failed. Try again.'); }
  };

  const benefits = [
    '✓ Free ATS Resume Analysis', '✓ AI Mock Interviews (5 topics)',
    '✓ ML Placement Prediction', '✓ Personalized Career Roadmap',
    '✓ Fake Skill Detection', '✓ 8-Week Learning Timeline',
  ];

  const inputCls = 'w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
  const labelCls = 'block mb-1.5 text-gray-500 dark:text-gray-400';

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950 transition-colors duration-300">

      {/* Feature panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-700 to-purple-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full"/>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/5 rounded-full"/>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17 }} className="text-white">SmartHire AI</span>
          </div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' }}
            className="text-white mb-3">
            Start Your Placement Journey Today!
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.6 }} className="text-purple-100 mb-8">
            Get access to all AI-powered tools designed specifically for campus placement preparation.
          </p>
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }} className="flex items-center gap-3 text-purple-100">
                {b}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 bg-white/10 border border-white/20 rounded-2xl p-5"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6 }} className="text-white mb-3">
            "SmartHire AI helped me identify my skill gaps and prepare effectively. Got placed at a top MNC!"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">A</div>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13 }} className="text-white">Arjun Kumar</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }} className="text-purple-200">Placed at Amazon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-gray-950">
        <div className="flex justify-between items-center px-8 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-500/30">
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 17 }} className="text-gray-900 dark:text-white">
              SmartHire <span className="text-blue-500">AI</span>
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' }}
                className="text-gray-900 dark:text-white mb-2">
                Create Account 🚀
              </h1>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }} className="text-gray-500 dark:text-gray-400">
                Join thousands of students preparing for placements
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Full Name', name: 'name', type: 'text', placeholder: 'Your Full Name' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@gmail.com' },
              ].map(f => (
                <div key={f.name}>
                  <label className={labelCls} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                  <input type={f.type} name={f.name} value={formData[f.name]} onChange={handleChange}
                    placeholder={f.placeholder} required className={inputCls}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }} />
                </div>
              ))}

              <div>
                <label className={labelCls} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="Min 6 characters" required className={inputCls}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, paddingRight: 48 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showPassword
                      ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className={inputCls}
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }}>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === 'admin' && (
                <div>
                  <label className={labelCls} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Admin Secret Key</label>
                  <input type="password" name="adminSecret" value={formData.adminSecret || ''}
                    onChange={handleChange} placeholder="Required for Admin registration" required className={inputCls}
                    style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5 }} />
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-all disabled:opacity-50"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, fontWeight: 600, borderRadius: 12,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(37,99,235,0.3)' }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Creating account...
                    </span>
                  : 'Create Account'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }} className="text-gray-400">or continue with</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <button type="button" onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 14.5, fontWeight: 500, borderRadius: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Continue with Google</span>
            </button>

            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14 }} className="text-center text-gray-500 dark:text-gray-400 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

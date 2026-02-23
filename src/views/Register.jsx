import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Music, Briefcase, Check, X, MailCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState(location.state?.role || null);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (showConfirmationModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showConfirmationModal && countdown === 0) {
      navigate('/login');
    }
  }, [showConfirmationModal, countdown, navigate]);

  const handleManualRedirect = () => {
    navigate('/login');
  };

  // Debounced username availability check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        setCheckingUsername(true);
        try {
          const { data, error } = await supabase
            .rpc('check_username_availability', { check_username: username });
          
          if (error) throw error;
          setUsernameAvailable(data);
        } catch (err) {
          console.error('Username check error:', err);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'username') {
      setUsername(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate role selection
    if (!role) {
      setError('Please select whether you are an Artist or Manager');
      setLoading(false);
      return;
    }

    // Validate username
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (usernameAvailable === false) {
      setError('This username is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        role,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      });
      
      if (signUpError) throw new Error(signUpError);
      
      // Check if email confirmation is required
      if (data?.user && !data.user.email_confirmed_at) {
        // Show confirmation modal
        setShowConfirmationModal(true);
        return;
      }
      
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-fuchsia-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(192,38,211,0.3)] mx-auto mb-4">
              <span className="font-black text-2xl italic">A</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Create Account</h1>
            <p className="text-gray-400 text-sm sm:text-base">Join the Artify community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">I am a <span className="text-fuchsia-400">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('artist')}
                  className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                    role === 'artist'
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <Music size={24} className={role === 'artist' ? 'text-cyan-400' : ''} />
                  <span className="text-xs font-bold">Artist</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('manager')}
                  className={`p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                    role === 'manager'
                      ? 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <Briefcase size={24} className={role === 'manager' ? 'text-fuchsia-400' : ''} />
                  <span className="text-xs font-bold">Manager</span>
                </button>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">User ID <span className="text-fuchsia-400">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={handleChange}
                  placeholder="Choose a unique ID"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-10 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                  required
                  pattern="[a-zA-Z0-9_]+"
                  minLength={3}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername && (
                    <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                  )}
                  {usernameAvailable === true && (
                    <Check size={18} className="text-emerald-400" />
                  )}
                  {usernameAvailable === false && (
                    <X size={18} className="text-red-400" />
                  )}
                </div>
              </div>
              {username.length >= 3 && usernameAvailable === true && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> Username available
                </p>
              )}
              {username.length >= 3 && usernameAvailable === false && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <X size={12} /> Username taken
                </p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || usernameAvailable === false || checkingUsername}
              className="w-full py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                <MailCheck size={40} className="text-emerald-400" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Check Your Email!
              </h2>
              
              <p className="text-gray-400 text-sm sm:text-base mb-6">
                We've sent a confirmation link to<br />
                <span className="text-white font-bold">{formData.email}</span>
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <p className="text-gray-400 text-xs sm:text-sm mb-2">
                  Your User ID: <span className="text-fuchsia-400 font-bold">@{username}</span>
                </p>
                <p className="text-gray-500 text-xs">
                  Click the link in the email to activate your account
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleManualRedirect}
                  className="w-full py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Go to Login
                </button>
                
                <div className="flex items-center justify-center gap-2 text-gray-500 text-xs sm:text-sm">
                  <span>Redirecting in</span>
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                    {countdown}
                  </span>
                  <span>seconds...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;

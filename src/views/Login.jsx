import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, MailCheck, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { resendConfirmation } = useSupabase();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or username
  const [formData, setFormData] = useState({
    password: '',
  });

  const handleResendEmail = async () => {
    if (!confirmationEmail) return;

    setResendingEmail(true);
    setResendSuccess(false);

    try {
      const { emailSent } = await resendConfirmation(confirmationEmail);
      if (emailSent) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError(err.message || 'Failed to resend confirmation email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'identifier') {
      setIdentifier(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let emailToUse = identifier;

    try {
      // Determine if identifier is email or username
      const isEmail = identifier.includes('@');
      
      if (!isEmail) {
        // Login with username - first get the user's email from username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', identifier.toLowerCase())
          .single();
        
        if (profileError || !profileData) {
          throw new Error('User not found. Please check your username.');
        }
        
        emailToUse = profileData.email;
      }
      
      const { data: signInData, error: signInError } = await signIn(emailToUse, formData.password);
            setConfirmationEmail(emailToUse);

      if (signInError) throw new Error(signInError);

      // Check if email is confirmed
      if (signInData?.user && !signInData.user.email_confirmed_at && !signInData.user.confirmed_at) {
              setShowConfirmationModal(true);
        return;
      }

      // Successful login - redirect to feed
      navigate('/community');
    } catch (err) {
            const message = err.message || 'Failed to sign in';
            const lowerMessage = message.toLowerCase();

            if (
              lowerMessage.includes('email not confirmed') ||
              lowerMessage.includes('not confirmed') ||
              lowerMessage.includes('confirm your email')
            ) {
              setConfirmationEmail(emailToUse);
              setShowConfirmationModal(true);
              setError('');
              return;
            }

            setError(message);
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
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm sm:text-base">Sign in to continue to Artify</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email or User ID</label>
              <div className="relative">
                {identifier.includes('@') ? (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                ) : (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                )}
                <input
                  type="text"
                  name="identifier"
                  value={identifier}
                  onChange={handleChange}
                  placeholder="Email or @username"
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                  required
                />
              </div>
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-fuchsia-400 hover:text-fuchsia-300 font-bold transition-colors">
                Sign up
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
                Confirm Your Email
              </h2>

              <p className="text-gray-400 text-sm sm:text-base mb-6">
                This account is not confirmed yet.<br />
                <span className="text-white font-bold">{confirmationEmail}</span>
              </p>

              {resendSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                  <p className="text-emerald-400 text-xs sm:text-sm flex items-center justify-center gap-2">
                    <Check size={14} /> Confirmation email resent!
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      <span>Resend Confirmation Email</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] transition-all duration-300"
                >
                  Back to Login
                </button>
              </div>

              <p className="text-gray-500 text-xs mt-4">
                Check your spam folder if you don't see the email.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;


import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          setStatus('verified');
          // Redirect to feed after successful verification
          setTimeout(() => {
            navigate('/feed');
          }, 1500);
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('failed');
      }
    };

    handleCallback();
  }, [navigate, supabase]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-fuchsia-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-400">Please wait while we confirm your email address.</p>
          </>
        )}
        
        {status === 'verified' && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Email Confirmed!</h1>
            <p className="text-gray-400">Redirecting you to the feed...</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold text-red-500">!</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-400 mb-6">Unable to verify your email. Please try again.</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-bold text-white"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;

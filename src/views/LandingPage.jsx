import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogIn, UserPlus } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 sm:p-6 w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
        {/* Left side - Hero content */}
        <div className="space-y-6 sm:space-y-8 relative">
          {/* Background glow effects */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
          <div className="absolute z-0 -bottom-20 -right-20 w-72 h-72 bg-cyan-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse delay-1000"></div>

          <div className="relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-4 sm:mb-6">
              ARTIFY<br />
            </h1>
            <p className="text-base sm:text-xl text-gray-400 max-w-md leading-relaxed">
              The curated network for elite talent and premier events. Step into the spotlight.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 w-full relative">
            {/* Sign In Button */}
            <button
              onClick={() => navigate('/login')}
              className="w-full group p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-linear-to-r from-gray-800 to-gray-900 hover:from-fuchsia-600 hover:to-purple-600 transition-all duration-300 text-left"
            >
              <div className="bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 md:gap-6 transition-colors group-hover:bg-[#1a1a1a]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center text-fuchsia-400 group-hover:text-fuchsia-300 group-hover:from-fuchsia-500/30 group-hover:to-purple-500/30 transition-all flex-shrink-0">
                  <LogIn size={22} sm={26} md={28} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg md:text-xl text-white truncate">Sign In</h3>
                  <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-300 truncate">Welcome back to Artify</p>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-white flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
              </div>
            </button>

            {/* Sign Up Button */}
            <button
              onClick={() => navigate('/register')}
              className="w-full group p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-linear-to-r from-gray-800 to-gray-900 hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 text-left"
            >
              <div className="bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 md:gap-6 transition-colors group-hover:bg-[#1a1a1a]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all flex-shrink-0">
                  <UserPlus size={22} sm={26} md={28} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg md:text-xl text-white truncate">Sign Up</h3>
                  <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-300 truncate">Create your account</p>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-white flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 pointer-events-none" />
              </div>
            </button>
          </div>
        </div>

        {/* Right side - Info card */}
        <div className="bg-white/5 flex h-full items-center justify-center backdrop-blur-2xl border border-white/10 p-4 sm:p-6 md:p-8 lg:p-12 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none"></div>
          
          {/* Stats */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-5xl sm:text-6xl font-black text-white mb-2">10k+</h3>
              <p className="text-gray-400 text-sm sm:text-base">Active Artists & Managers</p>
            </div>
            
            <div className="flex -space-x-3 justify-center">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#050505] bg-gray-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-full h-full object-cover" alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#050505] bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                +
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Join the community and start booking gigs today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

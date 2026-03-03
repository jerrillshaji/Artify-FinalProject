import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, MessageCircle, User, LogOut } from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';

const Header = ({ user, role, onLogout }) => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const [resolvedUsername, setResolvedUsername] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);

  // Safe access to user data
  const userName = user?.user_metadata?.full_name || (role === 'artist' ? 'Aria Sterling' : 'TechGlobal Inc.');
  const metadataUsername = user?.user_metadata?.username;
  const userRole = role === 'artist' ? 'Artist' : 'Organizer';
  const userImage = userAvatar || "https://i.pravatar.cc/150?img=60";
  const usernameToUse = (resolvedUsername || metadataUsername || '').toLowerCase().trim();
  const isValidUsername = /^[a-z0-9_]{3,}$/.test(usernameToUse);
  const profilePath = isValidUsername ? `/${usernameToUse}` : '/profile';

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setResolvedUsername(null);
        setUserAvatar(null);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        setResolvedUsername(data?.username || null);
        setUserAvatar(data?.avatar_url || null);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setResolvedUsername(null);
        setUserAvatar(null);
      }
    };

    fetchUserData();
  }, [supabase, user?.id]);

  return (
    <header className="fixed top-0 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 z-50 px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-fuchsia-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(192,38,211,0.3)] flex-shrink-0">
          <span className="font-black text-lg sm:text-xl italic">A</span>
        </div>
        <div className="hidden sm:block">
          <span className="font-black text-lg sm:text-xl tracking-tighter block leading-none">ARTIFY</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-white transition-colors flex-shrink-0">
          <BellRing size={20} sm={24} />
          <span className="absolute top-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-fuchsia-500 rounded-full border-2 border-black shadow-[0_0_10px_rgba(217,70,239,0.8)]"></span>
        </button>

        {/* Profile dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 pl-4 sm:pl-6 border-l border-white/10">
          <div className="text-right hidden lg:block">
            <p className="text-xs sm:text-sm font-bold text-white">
              {userName}
            </p>
            <p className="text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase tracking-widest">
              {userRole}
            </p>
          </div>
          <div className="group relative">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-0.5 cursor-pointer transition-all flex-shrink-0">
              <img
                src={userImage}
                className="w-full h-full rounded-full object-cover border-2 border-[#050505]"
                alt="Profile"
              />
            </div>
            {/* Dropdown menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={() => navigate(profilePath)}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => navigate('/messages')}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
              >
                <MessageCircle size={16} />
                <span>Messages</span>
              </button>
              <hr className="border-white/10" />
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

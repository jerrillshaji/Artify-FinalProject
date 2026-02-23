import React, { useState, useEffect } from 'react';
import { Check, Star, Camera, Play } from 'lucide-react';
import Button from '../components/ui/Button';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const ProfileView = ({ role }) => {
  const { supabase, user } = useSupabase();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch artist data if user is an artist
        let artistData = null;
        if (profileData?.role === 'artist') {
          const { data: artistDataResult } = await supabase
            .from('artists')
            .select('*')
            .eq('id', user.id)
            .single();
          artistData = artistDataResult;
        }

        setProfile({ ...profileData, ...artistData });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Use profile data or fallback to user metadata
  const displayName = profile?.full_name || user?.user_metadata?.full_name || (role === 'artist' ? 'Aria Sterling' : 'TechGlobal Inc.');
  const avatarUrl = profile?.avatar_url || (role === 'artist' ? profile?.portfolio_images?.[0] : null);
  const bio = profile?.bio || 'No bio added yet.';
  const location = profile?.location || 'Location not set';
  const isVerified = profile?.is_verified || false;
  const followers = profile?.followers_count || 0;
  const rating = profile?.rating || 0;

  return (
    <div className="relative">
      <div className="flex items-center mb-4 sm:mb-6">
        <BackButton />
      </div>
      <div className="h-48 sm:h-56 md:h-64 lg:h-80 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden mb-16 sm:mb-20 md:mb-24">
        <img src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-end h-full">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 md:gap-6 w-full">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full p-0.5 sm:p-1 bg-gradient-to-br from-fuchsia-500 to-cyan-500">
                <img 
                  src={avatarUrl || `https://i.pravatar.cc/150?img=${role === 'artist' ? '1' : '60'}`} 
                  className="w-full h-full rounded-full object-cover border-2 sm:border-4 border-[#050505]" 
                  alt={displayName}
                />
              </div>
              <div className="absolute bottom-0 right-0 p-0.5 sm:p-1 bg-[#050505] rounded-full">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-emerald-500 rounded-full border-2 border-[#050505] animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight mb-0.5 sm:mb-1 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 flex-wrap">
                <span className="truncate max-w-full">{displayName}</span>
                {isVerified && (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 p-0.5 bg-cyan-500 text-black rounded-full flex-shrink-0" strokeWidth={4} />
                )}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-fuchsia-400 font-medium truncate">
                {profile?.role === 'artist' ? (profile?.stage_name || 'Artist') : (profile?.company_name || 'Manager')} • {location}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start mt-3 sm:mt-4">
            <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm py-1.5 sm:py-2">Edit Profile</Button>
            <Button variant="primary" className="px-3 sm:px-4 text-xs sm:text-sm py-1.5 sm:py-2">Share Profile</Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <div className="md:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/5">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-3 sm:mb-4">About</h3>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              {bio}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/5">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-3 sm:mb-4">Stats</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300 text-sm sm:text-base">Followers</span>
              <span className="font-bold text-white text-sm sm:text-base">
                {followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm sm:text-base">Rating</span>
              <span className="font-bold text-yellow-400 flex items-center gap-1 text-sm sm:text-base">
                {rating > 0 ? rating.toFixed(1) : 'N/A'} 
                {rating > 0 && <Star size={12} sm={14} fill="currentColor" />}
              </span>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <Camera size={20} sm={24} className="text-fuchsia-500 flex-shrink-0" />
            <span>Portfolio Highlights</span>
          </h3>
          {profile?.portfolio_images && profile.portfolio_images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              {profile.portfolio_images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-video bg-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden relative group">
                  <img 
                    src={img} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
                    alt={`Portfolio ${i + 1}`} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                      <Play size={16} sm={20} fill="currentColor" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/5 border-dashed">
              <Camera size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-sm text-center">No portfolio images yet</p>
              <p className="text-gray-500 text-xs text-center mt-1">Upload your work to showcase your talent</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

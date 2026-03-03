import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Heart, Share2, TrendingUp } from 'lucide-react';
import { MOCK_POSTS } from '../data/mockData';
import { useSupabase } from '../context/SupabaseContext';

const CommunityFeed = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [featuredBand, setFeaturedBand] = useState(null);

  useEffect(() => {
    const loadFeaturedBand = async () => {
      try {
        // Fetch a featured artist
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'artist')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        if (data) {
          setFeaturedBand(data);
        }
      } catch (error) {
        console.error('Error loading featured band:', error);
        setFeaturedBand(null);
      }
    };

    loadFeaturedBand();
  }, [supabase]);

  useEffect(() => {
    const loadFeaturedArtists = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('role', 'artist')
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setFeaturedArtists(data || []);
      } catch (error) {
        console.error('Error loading featured artists:', error);
        setFeaturedArtists([]);
      }
    };

    loadFeaturedArtists();
  }, [supabase]);

  const getArtistProfilePath = (artist) => {
    const username = artist?.handle?.replace('@', '')?.toLowerCase()?.trim();
    if (username && /^[a-z0-9_]{3,}$/.test(username)) {
      return `/${username}`;
    }
    return '/profile';
  };

  return (
  <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-12 pb-20 md:pb-24">
    <div
      onClick={() => {
        if (featuredBand?.id) {
          navigate(`/profile?id=${featuredBand.id}`);
        }
      }}
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2/1] md:aspect-[3/1] group cursor-pointer"
    >
      <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Featured" />
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 sm:p-6 md:p-8 lg:p-12">
        <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-fuchsia-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full mb-2 sm:mb-4 inline-block shadow-[0_0_15px_rgba(192,38,211,0.5)]">Trending Now</span>
        <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 tracking-tight leading-tight">
          {featuredBand?.full_name || 'Featured Artist'}
        </h2>
        <p className="text-gray-300 max-w-lg text-sm sm:text-base md:text-lg line-clamp-2 sm:line-clamp-none">Check out this amazing artist on Artify. Click to view their profile and discover their talent.</p>
      </div>
    </div>
    <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto pb-2 scrollbar-hide px-2">
      {featuredArtists.map((artist, i) => (
        <button
          key={artist.id}
          onClick={() => navigate(`/profile?id=${artist.id}`)}
          className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0 cursor-pointer group"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full p-[2px] sm:p-[3px] bg-linear-to-tr from-fuchsia-500 via-purple-500 to-cyan-500 shadow-lg group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300">
            <div className="w-full h-full rounded-full bg-black p-[2px] sm:p-[3px]">
              <img
                src={artist.avatar_url || `https://i.pravatar.cc/150?u=${artist.id}`}
                alt={artist.full_name || artist.username || 'Artist'}
                className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-500 group-hover:text-white transition-colors tracking-wide">
            @{artist.username || `artist_${i}`}
          </span>
        </button>
      ))}
    </div>
    <div className="columns-1 sm:columns-2 gap-4 sm:gap-6 space-y-4 sm:space-y-6">
      {MOCK_POSTS.map(post => (
        <div key={post.id} className="break-inside-avoid bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 group">
          <div className="p-3 sm:p-4 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src={post.user.image}
                alt={post.user.name}
                onClick={() => navigate(getArtistProfilePath(post.user))}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-white/10 cursor-pointer"
              />
              <div>
                <h4
                  onClick={() => navigate(getArtistProfilePath(post.user))}
                  className="font-bold text-xs sm:text-sm text-white group-hover:text-fuchsia-400 transition-colors cursor-pointer"
                >
                  {post.user.name}
                </h4>
                <p className="text-[10px] sm:text-xs text-gray-400">{post.time}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white flex-shrink-0"><MoreHorizontal size={18} sm={20} /></button>
          </div>
          <div className="relative">
            <img src={post.image} alt="Content" className="w-full h-auto object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-linear-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex gap-2 sm:gap-3">
              <button className="p-1.5 sm:p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-fuchsia-600 transition-colors"><Heart size={16} sm={18} /></button>
              <button className="p-1.5 sm:p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-blue-500 transition-colors"><Share2 size={16} sm={18} /></button>
            </div>
          </div>
          <div className="p-3 sm:p-4 md:p-5">
            <p className="text-gray-300 leading-relaxed text-xs sm:text-sm mb-3 sm:mb-4">
              <span className="font-bold mr-2 text-white">{post.user.handle}</span>
              {post.content}
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
              <TrendingUp size={12} sm={14} className="text-fuchsia-500" /> {post.likes} Hype points
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};

export default CommunityFeed;
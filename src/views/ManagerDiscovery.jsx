import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Check, ChevronRight, MapPin, Music, Briefcase } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const ManagerDiscovery = () => {
  const navigate = useNavigate();
  const { supabase, user } = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'artist', 'manager'
  const [selectedGenre, setSelectedGenre] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const genres = ['Electronic', 'Jazz', 'Rock', 'Pop', 'Classical', 'Hip-Hop', 'R&B', 'Country'];

  const getProfilePath = (profile) => {
    const normalizedUsername = profile?.username?.toLowerCase()?.trim();
    if (normalizedUsername && /^[a-z0-9_]{3,}$/.test(normalizedUsername)) {
      return `/${normalizedUsername}`;
    }
    return `/profile?id=${profile.id}`;
  };

  const performSearch = async () => {
    if (!searchQuery.trim() && !selectedGenre) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          artists (*),
          managers (*)
        `);

      // Build search conditions
      const conditions = [];
      
      if (searchQuery.trim()) {
        // Search by username (partial match, case-insensitive)
        conditions.push(`username.ilike.%${searchQuery.trim().toLowerCase()}%`);
        // Search by full name (partial match, case-insensitive)
        conditions.push(`full_name.ilike.%${searchQuery.trim()}%`);
        // Search by location (partial match, case-insensitive)
        conditions.push(`location.ilike.%${searchQuery.trim()}%`);
      }

      if (selectedGenre) {
        // Search in artists.genres array
        const { data: artistsWithGenre } = await supabase
          .from('artists')
          .select('id')
          .contains('genres', [selectedGenre]);
        
        if (artistsWithGenre && artistsWithGenre.length > 0) {
          const artistIds = artistsWithGenre.map(a => a.id);
          conditions.push(`id.in.(${artistIds.join(',')})`);
        } else {
          setResults([]);
          setLoading(false);
          return;
        }
      }

      // Filter by type
      if (searchType === 'artist') {
        conditions.push(`role.eq.artist`);
      } else if (searchType === 'manager') {
        conditions.push(`role.eq.manager`);
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || selectedGenre) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, searchType]);

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 pb-12">
      <div className="flex items-center mb-4 sm:mb-6">
        <BackButton />
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 rounded-2xl blur opacity-25"></div>
        <div className="relative bg-[#0F0F13] p-2 sm:p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-white/10 shadow-2xl">
          <div className="flex items-center flex-1">
            <Search className="ml-2 sm:ml-4 text-gray-400 flex-shrink-0" size={18} sm={24} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artists or managers..."
              className="w-full bg-transparent border-none text-white text-sm sm:text-lg px-2 sm:px-4 py-3 sm:py-4 focus:outline-none focus:ring-0 placeholder:text-gray-600 min-w-0"
            />
          </div>

          {/* Search Type Filter */}
          <div className="flex gap-1 sm:gap-2 p-1 bg-black/20 rounded-xl">
            <button
              onClick={() => setSearchType('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                searchType === 'all'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSearchType('artist')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                searchType === 'artist'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Artists
            </button>
            <button
              onClick={() => setSearchType('manager')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                searchType === 'manager'
                  ? 'bg-fuchsia-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Managers
            </button>
          </div>

          <Button onClick={performSearch} className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-5">
            Search
          </Button>
        </div>
      </div>

      {/* Genre Filters */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedGenre('')}
          className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border whitespace-nowrap flex-shrink-0 transition-all ${
            !selectedGenre
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-gray-400 border-white/10 hover:border-white/40 hover:text-white'
          }`}
        >
          All Genres
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border whitespace-nowrap flex-shrink-0 transition-all ${
              selectedGenre === genre
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/40 hover:text-white'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Searching...</span>
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-12">
          <Search size={64} className="text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
          <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {results.map((profile) => (
            <div
              key={profile.id}
              onClick={() => navigate(getProfilePath(profile))}
              className="group relative bg-[#121216] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
              <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#121216] z-10"></div>
                <img
                  src={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`}
                  alt={profile.full_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0"
                />
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20">
                  <div className="bg-black/50 backdrop-blur-md border border-white/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white flex items-center gap-0.5 sm:gap-1">
                    <Star size={10} sm={12} className="text-yellow-400 fill-yellow-400" />
                    {profile.role === 'artist' ? profile.artists?.[0]?.rating?.toFixed(1) || 'N/A' : 'N/A'}
                  </div>
                </div>
                {profile.is_verified && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20">
                    <div className="bg-cyan-500/80 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white flex items-center gap-1">
                      <Check size={10} sm={12} /> Verified
                    </div>
                  </div>
                )}
              </div>
              <div className="relative z-20 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8 -mt-12 sm:-mt-16 md:-mt-20">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-none mb-1 drop-shadow-lg flex items-center gap-2">
                  <span className="truncate">
                    {profile.role === 'artist' 
                      ? profile.artists?.[0]?.stage_name || profile.full_name
                      : profile.managers?.[0]?.company_name || profile.full_name
                    }
                  </span>
                </h3>
                <p className="text-fuchsia-400 font-medium text-xs sm:text-sm mb-1 flex items-center gap-1 flex-wrap">
                  <span className="truncate">@{profile.username}</span>
                </p>
                <p className="text-gray-400 font-medium text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-1 flex-wrap">
                  <span className="truncate">
                    {profile.role === 'artist' 
                      ? (profile.artists?.[0]?.genres?.[0] || 'Artist')
                      : (profile.managers?.[0]?.company_type || 'Manager')
                    }
                  </span>
                  {profile.is_verified && (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 p-0.5 bg-cyan-500 text-black rounded-full flex-shrink-0" />
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                  {profile.role === 'artist' && profile.artists?.[0]?.tags?.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/5 text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                  {profile.location && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/5 text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded border border-white/5 flex items-center gap-1">
                      <MapPin size={10} sm={12} /> {profile.location}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-4 sm:pt-6">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                      {profile.role === 'artist' ? 'Starting at' : 'Events organized'}
                    </p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      {profile.role === 'artist'
                        ? `$${profile.artists?.[0]?.base_price || '0'}`
                        : profile.managers?.[0]?.total_events || '0'
                      }
                    </p>
                  </div>
                  <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 hover:bg-fuchsia-500 hover:text-white transition-all duration-300 flex-shrink-0">
                    <ChevronRight size={20} sm={24} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Search size={40} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Find Talent or Events</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Search for artists by name, genre, or location. Filter by artist or manager to find exactly what you need.
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagerDiscovery;

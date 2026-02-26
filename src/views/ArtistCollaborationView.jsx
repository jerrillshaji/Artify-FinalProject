import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, MapPin, ArrowUpRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const ArtistCollaborationView = () => {
  const navigate = useNavigate();
  const { supabase, user } = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'artist', 'manager'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [collaborations, setCollaborations] = useState([]);

  const getProfilePath = (profile) => {
    const normalizedUsername = profile?.username?.toLowerCase()?.trim();
    if (normalizedUsername && /^[a-z0-9_]{3,}$/.test(normalizedUsername)) {
      return `/${normalizedUsername}`;
    }
    return `/profile?id=${profile.id}`;
  };

  // Load collaborations
  useEffect(() => {
    const loadCollaborations = async () => {
      const { data, error } = await supabase
        .from('collaborations')
        .select(`
          *,
          creator:profiles!collaborations_creator_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setCollaborations(data);
      }
    };

    loadCollaborations();
  }, []);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
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
        const searchTerm = searchQuery.trim().toLowerCase();
        
        // Search by username (partial match, case-insensitive)
        conditions.push(`username.ilike.%${searchTerm}%`);
        // Search by full name (partial match, case-insensitive)
        conditions.push(`full_name.ilike.%${searchQuery.trim()}%`);
        // Search by location (partial match, case-insensitive)
        conditions.push(`location.ilike.%${searchQuery.trim()}%`);
        
        // Also search in artists table (stage name and tags)
        const { data: artistsData } = await supabase
          .from('artists')
          .select('id')
          .or(`stage_name.ilike.%${searchQuery.trim()}%,tags.cs.{${searchTerm}}`);
        
        if (artistsData && artistsData.length > 0) {
          const artistIds = artistsData.map(a => a.id);
          conditions.push(`id.in.(${artistIds.join(',')})`);
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
      if (searchQuery.trim()) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
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

      {/* Jam Sessions / Collaborations */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Jam Sessions</h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg">
            Find musicians for your next project, backup singers for a gig, or just people to jam with.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0">
            All Genres
          </Button>
          <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0">
            Near Me
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-400">Searching...</span>
        </div>
      )}

      {!loading && hasSearched && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {results.map((profile) => (
            <div
              key={profile.id}
              onClick={() => navigate(getProfilePath(profile))}
              className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-white/20 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`}
                  alt={profile.full_name}
                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h3 className="font-bold text-white">{profile.full_name}</h3>
                  <p className="text-xs text-gray-400">
                    {profile.role === 'artist' ? 'Artist' : 'Manager'}
                  </p>
                </div>
              </div>
              {profile.location && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <MapPin size={14} /> {profile.location}
                </div>
              )}
              <div className="pt-4 border-t border-white/5">
                <span className="text-xs font-bold text-white group-hover:underline">View Profile</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collaborations List */}
      {!hasSearched && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {collaborations.map((collab) => (
            <div
              key={collab.id}
              onClick={() => navigate(getProfilePath(collab.creator || { id: collab.creator_id }))}
              className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-white/20 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 sm:p-3">
                <ArrowUpRight
                  size={18}
                  sm={20}
                  className="text-gray-600 group-hover:text-fuchsia-400 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
                <Badge color={collab.collaboration_type === 'gig' ? 'green' : 'purple'}>
                  {collab.collaboration_type}
                </Badge>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  {new Date(collab.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                {collab.title}
              </h3>
              <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                {collab.genre && (
                  <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-md border border-white/5">
                    {collab.genre}
                  </span>
                )}
                {collab.location && (
                  <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-md border border-white/5 flex items-center gap-1">
                    <MapPin size={10} /> {collab.location}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <img
                    src={collab.creator?.avatar_url || `https://i.pravatar.cc/150?u=${collab.creator_id}`}
                    alt={collab.creator?.full_name}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-300 font-medium truncate max-w-[120px] sm:max-w-none">
                    {collab.creator?.full_name || 'Unknown'}
                  </span>
                </div>
                <span className="text-xs font-bold text-white group-hover:underline">Connect</span>
              </div>
            </div>
          ))}

          {/* Post Request Card */}
          <div className="bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 backdrop-blur-xl border border-dashed border-fuchsia-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center hover:bg-fuchsia-900/30 transition-all cursor-pointer group min-h-[200px]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform text-fuchsia-400">
              <Zap size={28} sm={32} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">Post a Request</h3>
            <p className="text-sm text-gray-400">Looking for talent? Start here.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCollaborationView;

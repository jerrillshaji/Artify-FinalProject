import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Check, ChevronRight, MapPin, Music, Briefcase, Navigation } from 'lucide-react';
import { haversineDistance } from '../lib/geocoding';
import { formatINR } from '../lib/currency';
import { KERALA_DISTRICTS, KERALA_DISTRICT_MAP } from '../data/keralaDistricts';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const GENRE_OPTIONS = [
  { label: 'Indie', value: 'indie' },
  { label: 'Carnatic', value: 'carnatic' },
  { label: 'Rap', value: 'rap' },
  { label: 'DJ', value: 'dj' },
  { label: 'Pop', value: 'pop' },
  { label: 'Rock', value: 'rock' },
  { label: 'Hindustani', value: 'hindustani' },
];

const formatGenreLabel = (genre) => {
  if (!genre) return '';
  const normalized = genre.toLowerCase();
  if (normalized === 'dj') return 'DJ';
  return normalized
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const ManagerDiscovery = () => {
  const navigate = useNavigate();
  const { supabase, user, profile } = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'artist', 'manager'
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const getProfilePath = (profile) => {
    if (profile?.id) {
      return `/profile?id=${profile.id}`;
    }
    return '/profile';
  };

  const formatDistance = (km) => {
    if (km == null || !isFinite(km)) return null;
    if (km < 1) return `${Math.round(km * 1000)} m away`;
    if (km < 10) return `${km.toFixed(1)} km away`;
    return `${Math.round(km)} km away`;
  };

  const getSearchOriginCoords = () => {
    if (selectedDistrict && KERALA_DISTRICT_MAP[selectedDistrict]) {
      const district = KERALA_DISTRICT_MAP[selectedDistrict];
      return { lat: district.latitude, lng: district.longitude };
    }
    if (profile?.latitude != null && profile?.longitude != null) {
      return { lat: profile.latitude, lng: profile.longitude };
    }
    if (userCoords?.lat != null && userCoords?.lng != null) {
      return userCoords;
    }
    return null;
  };

  const performSearch = async () => {
    const hasFilters = searchQuery.trim() || selectedGenre || selectedDistrict || nearMe;
    if (!hasFilters) {
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

      if (user?.id) {
        query = query.neq('id', user.id);
      }

      if (searchType === 'artist') {
        query = query.eq('role', 'artist');
      } else if (searchType === 'manager') {
        query = query.eq('role', 'manager');
      }

      if (selectedDistrict && KERALA_DISTRICT_MAP[selectedDistrict]) {
        query = query.ilike('location', `%${KERALA_DISTRICT_MAP[selectedDistrict].label}%`);
      }

      if (selectedGenre) {
        if (searchType === 'manager') {
          setResults([]);
          setLoading(false);
          return;
        }

        const { data: artistsWithGenre } = await supabase
          .from('artists')
          .select('id')
          .contains('genres', [selectedGenre.toLowerCase()]);

        if (artistsWithGenre && artistsWithGenre.length > 0) {
          const artistIds = artistsWithGenre.map((a) => a.id);
          query = query.in('id', artistIds);
          query = query.eq('role', 'artist');
        } else {
          setResults([]);
          setLoading(false);
          return;
        }
      }

      if (searchQuery.trim()) {
        const normalized = searchQuery.trim();
        const searchConditions = [
          `username.ilike.%${normalized.toLowerCase()}%`,
          `full_name.ilike.%${normalized}%`,
          `location.ilike.%${normalized}%`,
        ];

        const { data: artistsMatchingSearch } = await supabase
          .from('artists')
          .select('id')
          .or(`stage_name.ilike.%${normalized}%,tags.cs.{${normalized.toLowerCase()}}`);

        if (artistsMatchingSearch?.length) {
          const artistIds = artistsMatchingSearch.map((a) => a.id);
          searchConditions.push(`id.in.(${artistIds.join(',')})`);
        }

        query = query.or(searchConditions.join(','));
      }

      // Fetch more results when sorting by distance so we have enough to rank
      const { data, error } = await query.limit(nearMe ? 200 : 50);
      if (error) throw error;

      let processed = data || [];

      const searchOrigin = getSearchOriginCoords();
      const shouldSortByDistance = Boolean(searchOrigin);

      // Sort results by nearest coordinates from the signed-in user.
      if (shouldSortByDistance && searchOrigin) {
        processed = processed
          .map((p) => ({
            ...p,
            _distanceKm:
              p.latitude != null && p.longitude != null
                ? haversineDistance(searchOrigin.lat, searchOrigin.lng, p.latitude, p.longitude)
                : null,
          }))
          .sort((a, b) => {
            const da = a._distanceKm ?? Infinity;
            const db = b._distanceKm ?? Infinity;
            return da - db;
          });
      }

      setResults(processed);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNearMe = () => {
    if (nearMe) {
      setNearMe(false);
      setLocationError('');
      return;
    }
    // Coords already available — just enable the filter
    if (userCoords) {
      setNearMe(true);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMe(true);
        setGettingLocation(false);
      },
      (err) => {
        setGettingLocation(false);
        setLocationError(
          err.code === 1
            ? 'Location access denied. Please allow location access in your browser and try again.'
            : 'Could not get your location. Please try again.'
        );
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Debounced search — also re-runs when nearMe toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || selectedGenre || selectedDistrict || nearMe) {
        performSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, selectedDistrict, searchType, nearMe]);

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

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-black/30 border border-white/10 text-white text-xs sm:text-sm rounded-lg px-3 py-2.5 sm:py-3 min-w-[180px] focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Kerala Districts</option>
            {KERALA_DISTRICTS.map((district) => (
              <option key={district.value} value={district.value}>
                {district.label}
              </option>
            ))}
          </select>

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

      {/* Genre + Location Filters */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Near Me toggle */}
        <button
          onClick={handleNearMe}
          disabled={gettingLocation}
          className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${
            nearMe
              ? 'bg-cyan-500 text-white border-cyan-500'
              : 'bg-transparent text-gray-400 border-white/10 hover:border-white/40 hover:text-white'
          }`}
        >
          {gettingLocation ? (
            <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation size={12} />
          )}
          Near Me
        </button>

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
        {GENRE_OPTIONS.map((genre) => (
          <button
            key={genre.value}
            onClick={() => setSelectedGenre(genre.value)}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold border whitespace-nowrap flex-shrink-0 transition-all ${
              selectedGenre === genre.value
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-gray-400 border-white/10 hover:border-white/40 hover:text-white'
            }`}
          >
            {genre.label}
          </button>
        ))}
      </div>

      {/* Location permission error */}
      {locationError && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
          <MapPin size={13} className="flex-shrink-0" />
          {locationError}
        </div>
      )}

      {/* Near Me active banner */}
      {nearMe && userCoords && !loading && results.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-4 py-2.5">
          <Navigation size={13} className="flex-shrink-0" />
          Showing {results.length} result{results.length !== 1 ? 's' : ''} sorted by distance from your location
        </div>
      )}

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
                <p className="text-gray-400 font-medium text-xs sm:text-sm mb-1 flex items-center gap-1 flex-wrap">
                  <MapPin size={12} className="flex-shrink-0" />
                  <span className="truncate">{profile.location || 'Location not set'}</span>
                </p>
                <p className="text-gray-400 font-medium text-xs sm:text-sm mb-4 sm:mb-6 flex items-center gap-1 flex-wrap">
                  <span className="truncate">
                    {profile.role === 'artist' 
                      ? formatGenreLabel(profile.artists?.[0]?.genres?.[0] || 'artist')
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
                  {profile._distanceKm != null && (
                    <span
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded border flex items-center gap-1 ${
                        profile._distanceKm != null
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-white/5 text-gray-600 border-white/5'
                      }`}
                    >
                      <Navigation size={10} />
                      {profile._distanceKm != null
                        ? formatDistance(profile._distanceKm)
                        : 'Location unknown'}
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
                        ? formatINR(profile.artists?.[0]?.base_price || 0)
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

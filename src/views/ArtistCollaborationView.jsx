import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowUpRight, Navigation } from 'lucide-react';
import { geocodeLocation, haversineDistance, getDeviceLocation } from '../lib/geocoding';
import { KERALA_DISTRICTS, KERALA_DISTRICT_MAP } from '../data/keralaDistricts';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const ArtistCollaborationView = () => {
  const navigate = useNavigate();
  const { supabase, user } = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'artist', 'manager'
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [collaborations, setCollaborations] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [distanceSections, setDistanceSections] = useState([]);
  const [districtCoordsCache, setDistrictCoordsCache] = useState({});

  const getProfilePath = (profile) => {
    if (profile?.id) {
      return `/profile?id=${profile.id}`;
    }
    return '/profile';
  };

  const buildDistanceSections = (items) => {
    const within10 = items.filter((item) => item._distanceKm != null && item._distanceKm <= 10);
    const within30 = items.filter((item) => item._distanceKm != null && item._distanceKm > 10 && item._distanceKm <= 30);
    const within50 = items.filter((item) => item._distanceKm != null && item._distanceKm > 30 && item._distanceKm <= 50);
    const within100 = items.filter((item) => item._distanceKm != null && item._distanceKm > 50 && item._distanceKm <= 100);
    const within500 = items.filter((item) => item._distanceKm != null && item._distanceKm > 100 && item._distanceKm <= 500);
    const within1000 = items.filter((item) => item._distanceKm != null && item._distanceKm > 500 && item._distanceKm <= 1000);

    return [
      { key: '10', title: 'Within 10 kms', items: within10 },
      { key: '30', title: '10 to 30 kms', items: within30 },
      { key: '50', title: '30 to 50 kms', items: within50 },
      { key: '100', title: '50 to 100 kms', items: within100 },
      { key: '500', title: '100 to 500 kms', items: within500 },
      { key: '1000', title: '500 to 1000 kms', items: within1000 },
    ].filter((section) => section.items.length > 0);
  };

  const getSearchOriginCoords = async () => {
    if (!selectedDistrict) {
      return null;
    }

    if (selectedDistrict === 'current') {
      if (userCoords?.lat != null && userCoords?.lng != null) {
        return userCoords;
      }
      return null;
    }

    if (selectedDistrict && KERALA_DISTRICT_MAP[selectedDistrict]) {
      const cached = districtCoordsCache[selectedDistrict];
      if (cached?.lat != null && cached?.lng != null) {
        return cached;
      }

      const district = KERALA_DISTRICT_MAP[selectedDistrict];
      const geocoded = await geocodeLocation(`${district.label}, Kerala, India`);
      const fallback = { lat: district.latitude, lng: district.longitude };
      const resolved = geocoded || fallback;

      setDistrictCoordsCache((prev) => ({
        ...prev,
        [selectedDistrict]: resolved,
      }));

      return resolved;
    }

    return null;
  };

  const formatDistance = (km) => {
    if (km == null || !isFinite(km)) return null;
    if (km < 1) return `${Math.round(km * 1000)} m away`;
    if (km < 10) return `${km.toFixed(1)} km away`;
    return `${Math.round(km)} km away`;
  };

  const requestDeviceLocation = async () => {
    setGettingLocation(true);
    setLocationError('');
    try {
      const coords = await getDeviceLocation();
      setUserCoords(coords);
      setShowLocationModal(false);
      return coords;
    } catch (err) {
      const message =
        err.code === 1
          ? 'Location access denied. Please allow location access in your browser and try again.'
          : err.message || 'Could not get your location. Please try again.';
      setLocationError(message);
      setShowLocationModal(true);
      return null;
    } finally {
      setGettingLocation(false);
    }
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
    if (!searchQuery.trim() && !selectedDistrict) {
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

      if (searchQuery.trim()) {
        const normalized = searchQuery.trim();
        const searchConditions = [
          `username.ilike.%${normalized.toLowerCase()}%`,
          `full_name.ilike.%${normalized}%`,
          `location.ilike.%${normalized}%`,
        ];

        const { data: artistsData } = await supabase
          .from('artists')
          .select('id')
          .or(`stage_name.ilike.%${normalized}%,tags.cs.{${normalized.toLowerCase()}}`);

        if (artistsData?.length) {
          const artistIds = artistsData.map((a) => a.id);
          searchConditions.push(`id.in.(${artistIds.join(',')})`);
        }

        query = query.or(searchConditions.join(','));
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      let processed = data || [];
      const searchOrigin = await getSearchOriginCoords();

      if (selectedDistrict && !searchOrigin) {
        setResults([]);
        setDistanceSections([]);
        return;
      }

      if (searchOrigin) {
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

        processed = processed.filter((item) => item._distanceKm != null && item._distanceKm <= 1000);
        setDistanceSections(buildDistanceSections(processed));
      } else {
        setDistanceSections([]);
      }

      setResults(processed);
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
      if (searchQuery.trim() || selectedDistrict) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedDistrict, searchType, userCoords?.lat, userCoords?.lng]);

  useEffect(() => {
    if (selectedDistrict !== 'current') return;
    requestDeviceLocation();
  }, [selectedDistrict]);

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

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-black/30 border border-white/10 text-white text-xs sm:text-sm rounded-lg px-3 py-2.5 sm:py-3 min-w-[180px] focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Kerala Districts</option>
            <option value="current">Current Location</option>
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

      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121216] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Enable Location Access</h3>
            <p className="mt-2 text-sm text-gray-300">
              Current Location search needs your device location permission.
              {locationError ? ` ${locationError}` : ''}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={() => requestDeviceLocation()}
                className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
              >
                {gettingLocation ? 'Checking...' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <>
          {selectedDistrict && distanceSections.length > 0 ? (
            <div className="space-y-8">
              {distanceSections.map((section) => (
                <div key={section.key} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-lg font-black text-white tracking-tight">{section.title}</h3>
                    <Badge color="gray">{section.items.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {section.items.map((profile) => (
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
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                          <MapPin size={14} /> {profile.location || 'Location not set'}
                        </div>
                        {profile._distanceKm != null && (
                          <div className={`flex items-center gap-2 text-xs mb-4 ${profile._distanceKm != null ? 'text-cyan-400' : 'text-gray-500'}`}>
                            <Navigation size={14} />
                            {profile._distanceKm != null ? formatDistance(profile._distanceKm) : 'Distance unavailable'}
                          </div>
                        )}
                        <div className="pt-4 border-t border-white/5">
                          <span className="text-xs font-bold text-white group-hover:underline">View Profile</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <MapPin size={14} /> {profile.location || 'Location not set'}
                  </div>
                  {profile._distanceKm != null && (
                    <div className={`flex items-center gap-2 text-xs mb-4 ${profile._distanceKm != null ? 'text-cyan-400' : 'text-gray-500'}`}>
                      <Navigation size={14} />
                      {profile._distanceKm != null ? formatDistance(profile._distanceKm) : 'Distance unavailable'}
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5">
                    <span className="text-xs font-bold text-white group-hover:underline">View Profile</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
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


        </div>
      )}
    </div>
  );
};

export default ArtistCollaborationView;

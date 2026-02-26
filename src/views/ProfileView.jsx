import React, { useState, useEffect } from 'react';
import { Check, Star, Camera, Play, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaInstagram, FaFacebook, FaWhatsapp, FaCopy } from 'react-icons/fa';
import Button from '../components/ui/Button';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const ProfileView = ({ role }) => {
  const { supabase, user } = useSupabase();
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [activeConnectionsTab, setActiveConnectionsTab] = useState('followers');
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setProfileNotFound(false);

      if (!username && !user) {
        setLoading(false);
        setProfileNotFound(true);
        return;
      }

      try {
        const fallbackRole = user?.user_metadata?.role || role || 'artist';
        const fallbackName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'New User';
        const fallbackUsername = (user?.user_metadata?.username || user?.email?.split('@')[0] || `user_${user?.id?.slice(0, 8) || 'new'}`)
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_+|_+$/g, '') || `user_${user?.id?.slice(0, 8) || 'new'}`;
        const normalizedUsername = username ? username.toLowerCase() : '';
        const metadataUsername = user?.user_metadata?.username?.toLowerCase() || '';
        const isOwnUsername = Boolean(user?.id && normalizedUsername && (normalizedUsername === metadataUsername || normalizedUsername === fallbackUsername));

        // Fetch profile data
        const profileQuery = supabase
          .from('profiles')
          .select('*');

        const { data: profileData, error: profileError } = username
          ? await profileQuery.eq('username', normalizedUsername).maybeSingle()
          : await profileQuery.eq('id', user.id).maybeSingle();

        let resolvedProfile = profileData;

        if (profileError) {
          throw profileError;
        }

        if (!resolvedProfile && username && isOwnUsername) {
          const { data: fallbackProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          resolvedProfile = fallbackProfile;
        }

        if (!resolvedProfile && user?.id && (!username || isOwnUsername)) {
          const profilePayload = {
            id: user.id,
            email: user.email,
            full_name: fallbackName,
            role: fallbackRole,
            username: fallbackUsername,
          };

          await supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' });

          if (fallbackRole === 'artist') {
            await supabase
              .from('artists')
              .upsert({ id: user.id, stage_name: fallbackName }, { onConflict: 'id' });
          } else {
            await supabase
              .from('managers')
              .upsert({ id: user.id, company_name: fallbackName }, { onConflict: 'id' });
          }

          const { data: repairedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          resolvedProfile = repairedProfile || profilePayload;
        }

        if (!resolvedProfile) {
          setProfileNotFound(true);
          setProfile(null);
          return;
        }

        // Fetch artist data if user is an artist
        let artistData = null;
        if (resolvedProfile?.role === 'artist') {
          const { data: artistDataResult } = await supabase
            .from('artists')
            .select('*')
            .eq('id', resolvedProfile.id)
            .maybeSingle();
          artistData = artistDataResult;
        }

        setProfile({ ...resolvedProfile, ...artistData });
      } catch (error) {
        console.error('Error fetching profile:', error);
          if (!username && user) {
          setProfile({
            id: user.id,
            email: user.email,
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'New User',
            role: user?.user_metadata?.role || role || 'artist',
            username: (user?.user_metadata?.username || user?.email?.split('@')[0] || `user_${user?.id?.slice(0, 8) || 'new'}`).toLowerCase(),
          });
          setProfileNotFound(false);
        } else {
          setProfileNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase, username, role]);

  useEffect(() => {
    const fetchFollowState = async () => {
      if (!user?.id || !profile?.id || user.id === profile.id) {
        setIsFollowing(false);
        return;
      }

      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        setIsFollowing(false);
        return;
      }

      setIsFollowing(Boolean(data));
    };

    fetchFollowState();
  }, [supabase, user?.id, profile?.id]);

  useEffect(() => {
    const fetchConnectionCounts = async () => {
      if (!profile?.id) return;

      const [{ count: followerCount }, { count: followingTotal }] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('following_id', profile.id),
        supabase
          .from('follows')
          .select('following_id', { count: 'exact', head: true })
          .eq('follower_id', profile.id),
      ]);

      setProfile((prevProfile) => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          followers_count: followerCount ?? prevProfile.followers_count ?? 0,
        };
      });

      setFollowingCount(followingTotal ?? 0);
    };

    fetchConnectionCounts();
  }, [supabase, profile?.id]);

  const mapUsersByIdOrder = (ids, users = []) => {
    const byId = new Map(users.map((item) => [item.id, item]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  };

  const loadConnections = async () => {
    if (!profile?.id) return;

    setConnectionsLoading(true);
    try {
      const [{ data: followerLinks }, { data: followingLinks }] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id, created_at')
          .eq('following_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('follows')
          .select('following_id, created_at')
          .eq('follower_id', profile.id)
          .order('created_at', { ascending: false }),
      ]);

      const followerIds = (followerLinks || []).map((item) => item.follower_id);
      const followingIds = (followingLinks || []).map((item) => item.following_id);
      const uniqueIds = [...new Set([...followerIds, ...followingIds])];

      if (uniqueIds.length === 0) {
        setFollowersList([]);
        setFollowingList([]);
        return;
      }

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, role, is_verified')
        .in('id', uniqueIds);

      setFollowersList(mapUsersByIdOrder(followerIds, usersData || []));
      setFollowingList(mapUsersByIdOrder(followingIds, usersData || []));
    } catch (error) {
      console.error('Error loading followers/following:', error);
      setFollowersList([]);
      setFollowingList([]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handleOpenConnections = async (tab) => {
    setActiveConnectionsTab(tab);
    setShowConnectionsModal(true);
    await loadConnections();
  };

  const getProfilePath = (targetProfile) => {
    const normalizedUsername = targetProfile?.username?.toLowerCase()?.trim();
    if (normalizedUsername && /^[a-z0-9_]{3,}$/.test(normalizedUsername)) {
      return `/${normalizedUsername}`;
    }
    return `/profile?id=${targetProfile?.id}`;
  };

  const handleOpenUserFromConnections = (targetProfile) => {
    if (!targetProfile?.id) return;
    setShowConnectionsModal(false);
    navigate(getProfilePath(targetProfile));
  };

  const handleFollowToggle = async () => {
    if (!user || !profile?.id || user.id === profile.id || followLoading) {
      return;
    }

    setFollowLoading(true);
    const nextIsFollowing = !isFollowing;
    setIsFollowing(nextIsFollowing);

    setProfile((prevProfile) => {
      if (!prevProfile) {
        return prevProfile;
      }

      return {
        ...prevProfile,
        followers_count: nextIsFollowing
          ? (prevProfile.followers_count || 0) + 1
          : Math.max(0, (prevProfile.followers_count || 1) - 1),
      };
    });

    let error = null;

    if (nextIsFollowing) {
      const { error: insertError } = await supabase
        .from('follows')
        .upsert({
          follower_id: user.id,
          following_id: profile.id,
        }, { onConflict: 'follower_id,following_id' });
      error = insertError;
    } else {
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      error = deleteError;
    }

    if (error) {
      console.error('Error toggling follow state:', error);
      setIsFollowing(!nextIsFollowing);
      setProfile((prevProfile) => {
        if (!prevProfile) {
          return prevProfile;
        }

        return {
          ...prevProfile,
          followers_count: nextIsFollowing
            ? Math.max(0, (prevProfile.followers_count || 1) - 1)
            : (prevProfile.followers_count || 0) + 1,
        };
      });
    }

    setFollowLoading(false);
  };

  const handleShare = (platform) => {
    const profileUrl = `${window.location.origin}/${profile?.username || profile?.id}`;
    const shareText = `Check out my profile on Artify!`;
    
    switch(platform) {
      case 'instagram':
        window.open(`https://www.instagram.com`, '_blank');
        alert('Share this profile: ' + profileUrl);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + profileUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(profileUrl);
        alert('Profile link copied to clipboard!');
        break;
      default:
        break;
    }
    setShowShareModal(false);
  };

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

  if (profileNotFound) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile not found</h2>
          <p className="text-gray-400">This profile link is invalid or no longer available.</p>
        </div>
      </div>
    );
  }

  // Use profile data or fallback to user metadata
  const profileRole = profile?.role || role || 'artist';
  const realName = profile?.full_name || user?.user_metadata?.full_name || 'Name not set';
  const displayName = profile?.username ? `@${profile.username}` : (realName || (profileRole === 'artist' ? 'Aria Sterling' : 'TechGlobal Inc.'));
  const avatarUrl = profile?.avatar_url || (profileRole === 'artist' ? profile?.portfolio_images?.[0] : null);
  const bio = profile?.bio || 'No bio added yet.';
  const location = profile?.location || 'Location not set';
  const isVerified = profile?.is_verified || false;
  const followers = profile?.followers_count || 0;
  const following = followingCount || 0;
  const rating = profile?.rating || 0;
  const isOwnProfile = !username || (user?.id && profile?.id === user.id);

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
                  src={avatarUrl || `https://i.pravatar.cc/150?img=${profileRole === 'artist' ? '1' : '60'}`} 
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
            {isOwnProfile && user && (
              <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm py-1.5 sm:py-2" onClick={() => navigate('/profile/edit')}>Edit Profile</Button>
            )}
            {!isOwnProfile && (
              <>
                <Button
                  variant={isFollowing ? 'secondary' : 'primary'}
                  className="px-3 sm:px-4 text-xs sm:text-sm py-1.5 sm:py-2"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? 'Updating...' : isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
                <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm py-1.5 sm:py-2">Message</Button>
                <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm py-1.5 sm:py-2">Favorite</Button>
              </>
            )}
            <Button variant="primary" className="px-3 sm:px-4 text-xs sm:text-sm py-1.5 sm:py-2" onClick={() => setShowShareModal(true)}>Share Profile</Button>
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
              <button
                type="button"
                onClick={() => handleOpenConnections('followers')}
                className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors"
              >
                Followers
              </button>
              <button
                type="button"
                onClick={() => handleOpenConnections('followers')}
                className="font-bold text-white text-sm sm:text-base hover:text-fuchsia-400 transition-colors"
              >
                {followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers}
              </button>
            </div>
            <div className="flex justify-between items-center mb-2">
              <button
                type="button"
                onClick={() => handleOpenConnections('following')}
                className="text-gray-300 text-sm sm:text-base hover:text-white transition-colors"
              >
                Following
              </button>
              <button
                type="button"
                onClick={() => handleOpenConnections('following')}
                className="font-bold text-white text-sm sm:text-base hover:text-fuchsia-400 transition-colors"
              >
                {following >= 1000 ? `${(following / 1000).toFixed(1)}k` : following}
              </button>
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

      {/* Share Modal */}
      {showConnectionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-bold text-lg">Connections</h3>
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="grid grid-cols-2 border-b border-white/10">
              <button
                onClick={() => setActiveConnectionsTab('followers')}
                className={`py-3 text-sm font-bold transition-colors ${
                  activeConnectionsTab === 'followers'
                    ? 'text-white border-b-2 border-fuchsia-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Followers ({followers})
              </button>
              <button
                onClick={() => setActiveConnectionsTab('following')}
                className={`py-3 text-sm font-bold transition-colors ${
                  activeConnectionsTab === 'following'
                    ? 'text-white border-b-2 border-fuchsia-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Following ({following})
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {connectionsLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                (activeConnectionsTab === 'followers' ? followersList : followingList).length > 0 ? (
                  <div className="p-2">
                    {(activeConnectionsTab === 'followers' ? followersList : followingList).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleOpenUserFromConnections(item)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <img
                          src={item.avatar_url || `https://i.pravatar.cc/150?u=${item.id}`}
                          alt={item.full_name || item.username || 'User'}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold truncate">
                            @{item.username || item.id.slice(0, 8)}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {item.full_name || 'No name set'}
                          </p>
                        </div>
                        {item.is_verified && (
                          <Check className="w-4 h-4 p-0.5 bg-cyan-500 text-black rounded-full" strokeWidth={4} />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500 text-sm">
                    No {activeConnectionsTab} yet.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl border border-white/10 w-full max-w-md p-8 relative shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-all duration-300"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Modal Header */}
            <h2 className="text-2xl font-bold text-white mb-2">Share Profile</h2>
            <p className="text-gray-400 text-sm mb-8">Choose a platform to share</p>

            {/* Share Options Grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {/* Instagram */}
              <button
                onClick={() => handleShare('instagram')}
                className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/5 hover:bg-gradient-to-br hover:from-pink-500/20 hover:to-purple-500/20 border border-white/10 hover:border-pink-500/30 rounded-2xl transition-all duration-300 group"
              >
                <FaInstagram size={40} className="text-white group-hover:text-pink-400 mb-3 transition-colors duration-300" />
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white text-center">Instagram</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/5 hover:bg-gradient-to-br hover:from-green-500/20 hover:to-emerald-500/20 border border-white/10 hover:border-green-500/30 rounded-2xl transition-all duration-300 group"
              >
                <FaWhatsapp size={40} className="text-white group-hover:text-green-400 mb-3 transition-colors duration-300" />
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white text-center">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/5 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-cyan-500/20 border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all duration-300 group"
              >
                <FaFacebook size={40} className="text-white group-hover:text-blue-400 mb-3 transition-colors duration-300" />
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white text-center">Facebook</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={() => handleShare('copy')}
                className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white/5 hover:bg-gradient-to-br hover:from-fuchsia-500/20 hover:to-purple-500/20 border border-white/10 hover:border-fuchsia-500/30 rounded-2xl transition-all duration-300 group"
              >
                <FaCopy size={40} className="text-white group-hover:text-fuchsia-400 mb-3 transition-colors duration-300" />
                <span className="text-sm font-semibold text-gray-300 group-hover:text-white text-center">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
import React, { useState, useEffect, useRef } from 'react';
import { Check, Star, Camera, Play, X, ImagePlus, Eye } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaInstagram, FaFacebook, FaWhatsapp, FaCopy } from 'react-icons/fa';
import Button from '../components/ui/Button';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const ProfileView = ({ role }) => {
  const { supabase, user } = useSupabase();
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profileIdParam = searchParams.get('id');
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
  const [showBackgroundActions, setShowBackgroundActions] = useState(false);
  const [showBackgroundPreview, setShowBackgroundPreview] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const backgroundFileInputRef = useRef(null);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const portfolioFileInputRef = useRef(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoFileInputRef = useRef(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setProfileNotFound(false);

      if (!username && !profileIdParam && !user) {
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
        const isOwnProfileId = Boolean(user?.id && profileIdParam && profileIdParam === user.id);
        const isOwnProfileTarget = Boolean(user?.id && (isOwnUsername || isOwnProfileId || (!username && !profileIdParam)));

        // Fetch profile data - select only needed columns
        const profileQuery = supabase
          .from('profiles')
          .select('id, email, username, full_name, avatar_url, background_url, role, bio, location, website, social_links, is_verified, followers_count');

        const { data: profileData, error: profileError } = username
          ? await profileQuery.eq('username', normalizedUsername).maybeSingle()
          : profileIdParam
            ? await profileQuery.eq('id', profileIdParam).maybeSingle()
          : await profileQuery.eq('id', user.id).maybeSingle();

        let resolvedProfile = profileData;

        if (profileError) {
          throw profileError;
        }

        if (!resolvedProfile && username && isOwnUsername) {
          const { data: fallbackProfile } = await supabase
            .from('profiles')
            .select('id, email, username, full_name, avatar_url, background_url, role, bio, location, website, social_links, is_verified, followers_count')
            .eq('id', user.id)
            .maybeSingle();
          resolvedProfile = fallbackProfile;
        }

        if (!resolvedProfile && isOwnProfileTarget) {
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
            .select('id, email, username, full_name, avatar_url, background_url, role, bio, location, website, social_links, is_verified, followers_count')
            .eq('id', user.id)
            .maybeSingle();

          resolvedProfile = repairedProfile || profilePayload;
        }

        if (!resolvedProfile) {
          setProfileNotFound(true);
          setProfile(null);
          return;
        }

        // Fetch artist data AND follow state AND connection counts in parallel
        const profileId = resolvedProfile.id;
        const [artistResult, followResult, followerCountResult, followingCountResult] = await Promise.all([
          resolvedProfile?.role === 'artist' 
            ? supabase
                .from('artists')
                .select('stage_name, genres, price_range, base_price, rating, total_gigs, tags, portfolio_images, videos, is_available')
                .eq('id', profileId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          user?.id && user.id !== profileId
            ? supabase
                .from('follows')
                .select('follower_id')
                .eq('follower_id', user.id)
                .eq('following_id', profileId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          supabase
            .from('follows')
            .select('follower_id', { count: 'exact', head: true })
            .eq('following_id', profileId),
          supabase
            .from('follows')
            .select('following_id', { count: 'exact', head: true })
            .eq('follower_id', profileId),
        ]);

        const artistData = artistResult.data || null;
        const isFollowingUser = Boolean(followResult.data);
        const followerCount = followerCountResult.count || 0;
        const followingCount = followingCountResult.count || 0;

        setProfile({ ...resolvedProfile, ...artistData });
        setIsFollowing(isFollowingUser);
        setFollowingCount(followingCount);
        
        // Update profile with follower count if different
        if (resolvedProfile.followers_count !== followerCount) {
          setProfile(prev => prev ? { ...prev, followers_count: followerCount } : null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
          if (!username && !profileIdParam && user) {
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
  }, [user, supabase, username, profileIdParam, role]);

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
    if (targetProfile?.id) {
      return `/profile?id=${targetProfile.id}`;
    }
    return '/profile';
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
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('User ID:', user.id);
      console.error('Profile ID:', profile.id);
      alert(`Follow error: ${error.message || 'Unknown error'}\nCheck console for details.`);
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

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const handlePortfolioUploadClick = () => {
    portfolioFileInputRef.current?.click();
  };

  const handleVideoUploadClick = () => {
    videoFileInputRef.current?.click();
  };

  const handlePortfolioFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !profile?.id || user.id !== profile.id || profile?.role !== 'artist') {
      return;
    }

    setPortfolioUploading(true);
    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const currentImages = profile?.portfolio_images || [];
      const updatedImages = [...currentImages, imageDataUrl];

      const { error } = await supabase
        .from('artists')
        .update({
          portfolio_images: updatedImages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setProfile((prevProfile) => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          portfolio_images: updatedImages,
        };
      });
    } catch (error) {
      console.error('Error uploading portfolio image:', error);
      alert(error.message || 'Failed to upload portfolio image');
    } finally {
      event.target.value = '';
      setPortfolioUploading(false);
    }
  };
  const handleVideoFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !profile?.id || user.id !== profile.id || profile?.role !== 'artist') {
      return;
    }

    setVideoUploading(true);
    try {
      const videoDataUrl = await readFileAsDataUrl(file);
      const currentVideos = profile?.videos || [];
      const updatedVideos = [...currentVideos, videoDataUrl];

      const { error } = await supabase
        .from('artists')
        .update({
          videos: updatedVideos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setProfile((prevProfile) => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          videos: updatedVideos,
        };
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert(error.message || 'Failed to upload video');
    } finally {
      event.target.value = '';
      setVideoUploading(false);
    }
  };

  const handleVideoClick = (videoSrc) => {
    setSelectedVideo(videoSrc);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const handleOpenBackgroundActions = () => {
    setShowBackgroundActions(true);
  };

  const handleBackgroundLayerClick = (event) => {
    const interactiveElement = event.target.closest('button, a, input, textarea, select, label');
    if (interactiveElement) {
      return;
    }
    handleOpenBackgroundActions();
  };

  const handleShowBackground = () => {
    setShowBackgroundActions(false);
    setShowBackgroundPreview(true);
  };

  const handleChangeBackground = () => {
    setShowBackgroundActions(false);
    backgroundFileInputRef.current?.click();
  };

  const handleBackgroundFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !profile?.id || user.id !== profile.id) {
      return;
    }

    setBackgroundUploading(true);
    try {
      const imageDataUrl = await readFileAsDataUrl(file);

      const { error } = await supabase
        .from('profiles')
        .update({
          background_url: imageDataUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setProfile((prevProfile) => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          background_url: imageDataUrl,
        };
      });
    } catch (error) {
      console.error('Error updating background image:', error);
      alert(error.message || 'Failed to update background image');
    } finally {
      event.target.value = '';
      setBackgroundUploading(false);
    }
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
  const isOwnProfile = Boolean(user?.id && profile?.id === user.id);
  const defaultBackgroundUrl = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80';
  const backgroundUrl = profile?.background_url || defaultBackgroundUrl;

  return (
    <div className="relative">
      <div className="flex items-center mb-4 sm:mb-6">
        <BackButton />
      </div>
      <input
        ref={backgroundFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBackgroundFileChange}
      />
      <input
        ref={portfolioFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePortfolioFileChange}
      />
      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoFileChange}
      />
      <div className="h-48 sm:h-56 md:h-64 lg:h-80 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden mb-16 sm:mb-20 md:mb-24">
        <img
          src={backgroundUrl}
          className="w-full h-full object-cover"
          alt="Profile background"
        />
        <button
          type="button"
          aria-label="Open background picture options"
          className="absolute inset-0 z-[1]"
          onClick={handleOpenBackgroundActions}
          disabled={backgroundUploading}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 md:p-6 lg:p-8 z-[2]" onClick={handleBackgroundLayerClick}>
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
        {backgroundUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
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
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  onClick={handlePortfolioUploadClick}
                  disabled={portfolioUploading}
                  className="bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-fuchsia-500/50 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[150px] sm:min-h-[180px] md:min-h-[220px]"
                >
                  {portfolioUploading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlus size={24} className="text-fuchsia-400" />
                      <span className="text-xs text-gray-300">Add Image</span>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleVideoUploadClick}
                  disabled={videoUploading}
                  className="bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-cyan-500/50 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[150px] sm:min-h-[180px] md:min-h-[220px]"
                >
                  {videoUploading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Play size={24} className="text-cyan-400" />
                      <span className="text-xs text-gray-300">Add Video</span>
                    </div>
                  )}
                </button>
              </>
            )}
            {(() => {
              const portfolioItems = [];
              if (profile?.portfolio_images) {
                profile.portfolio_images.forEach((img) => {
                  portfolioItems.push({ type: 'image', src: img });
                });
              }
              if (profile?.videos) {
                profile.videos.forEach((vid) => {
                  portfolioItems.push({ type: 'video', src: vid });
                });
              }
              
              return (
                <>
                  {portfolioItems.length > 0 && portfolioItems.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => item.type === 'video' && handleVideoClick(item.src)}
                      className={`rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden relative group min-h-[150px] sm:min-h-[180px] md:min-h-[220px] flex items-center justify-center border-2 transition-all duration-300 ${item.type === 'video' ? 'border-cyan-500/50 bg-cyan-950/20 cursor-pointer hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20' : 'border-fuchsia-500/30 bg-gray-800 cursor-default'}`}
                    >
                      {item.type === 'image' ? (
                        <img 
                          src={item.src} 
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" 
                          alt={`Portfolio ${i + 1}`} 
                        />
                      ) : (
                        <>
                          <video 
                            src={item.src} 
                            className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                          ></video>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                        </>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                          {item.type === 'video' ? (
                            <Play size={16} fill="currentColor" />
                          ) : (
                            <Eye size={16} />
                          )}
                        </div>
                      </div>
                      {item.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-cyan-500 text-white rounded-full p-1">
                          <Play size={12} fill="currentColor" />
                        </div>
                      )}
                    </button>
                  ))}
                  {portfolioItems.length === 0 && !isOwnProfile && (
                    <div className="col-span-2 flex flex-col items-center justify-center p-12 bg-white/5 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/5 border-dashed">
                      <Camera size={48} className="text-gray-600 mb-4" />
                      <p className="text-gray-400 text-sm text-center">No portfolio items yet</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {showBackgroundActions && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBackgroundActions(false)}
        >
          <div
            className="w-full max-w-sm bg-[#111111] border border-white/10 rounded-2xl p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-white font-bold text-base mb-3">Background Picture</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleShowBackground}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <Eye size={16} />
                <span>Show background picture</span>
              </button>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={handleChangeBackground}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <ImagePlus size={16} />
                  <span>Change background picture</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showBackgroundPreview && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowBackgroundPreview(false)}
        >
          <button
            type="button"
            onClick={() => setShowBackgroundPreview(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={backgroundUrl}
            alt="Background preview"
            className="max-w-full max-h-full object-contain rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

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
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-fuchsia-500 to-cyan-500">
                            <img
                              src={item.avatar_url || `https://i.pravatar.cc/150?u=${item.id}`}
                              alt={item.full_name || item.username || 'User'}
                              className="w-full h-full rounded-full object-cover border-2 border-[#050505]"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold truncate">
                            @{item.username || item.id.slice(0, 8)}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {item.full_name || 'No name set'}
                          </p>
                        </div>
                        {item.is_verified && (
                          <Check className="w-4 h-4 p-0.5 bg-cyan-500 text-black rounded-full shrink-0" strokeWidth={4} />
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

      {/* Video Player Modal */}
      {showVideoModal && selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeVideoModal}
        >
          <div
            className="bg-black/90 rounded-2xl border border-white/10 w-full max-w-3xl shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeVideoModal}
              className="absolute top-3 right-3 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors duration-300"
            >
              <X size={24} className="text-white" />
            </button>
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full h-auto max-h-[80vh] rounded-2xl"
            ></video>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
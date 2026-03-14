import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Heart, Share2, TrendingUp, Plus, MapPin, RefreshCw, Users } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import Button from '../components/ui/Button';

const withCacheBuster = (imageUrl, version) => {
  if (!imageUrl || imageUrl.startsWith('data:') || !version) {
    return imageUrl;
  }

  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${encodeURIComponent(version)}`;
};

const resolveAvatarUrl = (profileLike, fallbackVersion) => {
  const baseAvatar = profileLike?.avatar_url || (profileLike?.role === 'artist' ? profileLike?.portfolio_images?.[0] : null);
  const version = profileLike?.updated_at || fallbackVersion;
  return withCacheBuster(baseAvatar, version) || `https://i.pravatar.cc/150?u=${profileLike?.id || 'artify'}`;
};

const POST_SELECT = `
  id,
  author_id,
  content,
  location,
  image_url,
  tags,
  created_at,
  author:profiles!posts_author_id_fkey (
    id,
    username,
    full_name,
    role,
    avatar_url,
    updated_at,
    is_verified,
    artists (stage_name)
  )
`;

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now';

  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const CommunityFeed = () => {
  const navigate = useNavigate();
  const { supabase, user, profile: sharedProfile } = useSupabase();
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [featuredBand, setFeaturedBand] = useState(null);
  const [feedPosts, setFeedPosts] = useState([]);
  const [discoverPosts, setDiscoverPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [followingCount, setFollowingCount] = useState(0);
  const [copiedPostId, setCopiedPostId] = useState(null);
  const avatarCacheSeed = useMemo(() => Date.now().toString(), []);

  const loadFeed = useCallback(async () => {
    if (!user?.id) return;

    setFeedLoading(true);
    setFeedError('');

    try {
      const [featuredBandResult, featuredArtistsResult, followsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'artist')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, updated_at, artists (stage_name)')
          .eq('role', 'artist')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id),
      ]);

      if (featuredBandResult.error) throw featuredBandResult.error;
      if (featuredArtistsResult.error) throw featuredArtistsResult.error;
      if (followsResult.error) throw followsResult.error;

      setFeaturedBand(featuredBandResult.data || null);
      setFeaturedArtists(featuredArtistsResult.data || []);

      const followedIds = (followsResult.data || []).map((item) => item.following_id);
      const followedSet = new Set(followedIds);
      setFollowingCount(followedIds.length);

      const [followingPostsResult, recentPostsResult] = await Promise.all([
        followedIds.length > 0
          ? supabase
              .from('posts')
              .select(POST_SELECT)
              .in('author_id', followedIds)
              .order('created_at', { ascending: false })
              .limit(30)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('posts')
          .select(POST_SELECT)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (followingPostsResult.error) throw followingPostsResult.error;
      if (recentPostsResult.error) throw recentPostsResult.error;

      const followingFeed = followingPostsResult.data || [];
      const recentPosts = recentPostsResult.data || [];
      const recentDiscover = recentPosts
        .filter((post) => !followedSet.has(post.author_id) && post.author_id !== user.id)
        .slice(0, 6);

      setFeedPosts(followingFeed);
      setDiscoverPosts(recentDiscover);
    } catch (error) {
      console.error('Error loading feed:', error);

      if (error?.code === '42P01' || error?.message?.toLowerCase().includes('posts')) {
        setFeedError('Posts are not set up in Supabase yet. Run the updated supabase-schema.sql, then refresh the feed.');
      } else {
        setFeedError('Could not load the feed right now. Please try again.');
      }

      setFeedPosts([]);
      setDiscoverPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`feed-profiles-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        loadFeed();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFeed, supabase, user?.id]);

  const getArtistProfilePath = (artist) => {
    const username = artist?.username?.replace('@', '')?.toLowerCase()?.trim();
    if (username && /^[a-z0-9_]{3,}$/.test(username)) {
      return `/profile?id=${artist.id}`;
    }
    return artist?.id ? `/profile?id=${artist.id}` : '/profile';
  };

  const visibleFeaturedArtists = featuredArtists.map((artist) => {
    if (artist.id === sharedProfile?.id) {
      return { ...artist, ...sharedProfile };
    }
    return artist;
  });

  const handleSharePost = async (post) => {
    const profileLink = `${window.location.origin}/posts/${post.id}`;
    const shareText = `${displayName} posted: ${post.content}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Artify Post',
          text: shareText,
          url: profileLink,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${profileLink}`);
        setCopiedPostId(post.id);
        window.setTimeout(() => setCopiedPostId(null), 2000);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const renderPostCard = (post) => {
    const {
      author,
      author_id: authorId,
      content,
      created_at: createdAt,
      image_url: imageUrl,
      location,
      tags,
    } = post;
    const authorAvatar = resolveAvatarUrl(author || { id: authorId }, avatarCacheSeed);
    const displayName = author?.role === 'artist'
      ? (author?.artists?.[0]?.stage_name || author?.full_name || 'Unknown user')
      : (author?.full_name || 'Unknown user');

    return (
      <div key={post.id} className="break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-white/20">
        <div className="flex items-center justify-between bg-black/20 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              key={authorAvatar}
              src={authorAvatar}
              alt={displayName}
              onClick={() => navigate(getArtistProfilePath(author || { id: authorId }))}
              className="h-9 w-9 cursor-pointer rounded-full object-cover ring-2 ring-white/10 sm:h-10 sm:w-10"
            />
            <div>
              <button
                type="button"
                onClick={() => navigate(getArtistProfilePath(author || { id: authorId }))}
                className="flex items-center gap-2 text-left font-bold text-white transition-colors hover:text-fuchsia-400"
              >
                <span className="text-xs sm:text-sm">{displayName}</span>
                {author?.is_verified && <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></span>}
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-400 sm:text-xs">
                <span>@{author?.username || 'artist'}</span>
                <span>{formatRelativeTime(createdAt)}</span>
                {location && (
                  <span className="inline-flex items-center gap-1 text-gray-300">
                    <MapPin size={12} />
                    {location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="shrink-0 text-gray-400 hover:text-white">
            <MoreHorizontal size={18} sm={20} />
          </button>
        </div>

        {imageUrl && (
          <div className="relative cursor-pointer" onClick={() => navigate(`/posts/${post.id}`)}>
            <img src={imageUrl} alt="Post" className="max-h-136 w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/80 to-transparent"></div>
          </div>
        )}

        <div className="p-4 sm:p-5">
          <p className="mb-4 cursor-pointer whitespace-pre-wrap text-sm leading-relaxed text-gray-200 sm:text-[15px]" onClick={() => navigate(`/posts/${post.id}`)}>
            {content}
          </p>

          {tags?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={`${post.id}-${tag}`} className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-fuchsia-200 sm:text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-gray-500 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <TrendingUp size={14} className="text-fuchsia-500" />
              Fresh drop
            </span>
            <button className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-fuchsia-300">
              <Heart size={14} />
              Appreciate
            </button>
            <button
              type="button"
              onClick={() => handleSharePost(post)}
              className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-cyan-300"
            >
              <Share2 size={14} />
              {copiedPostId === post.id ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 md:pb-24">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)] lg:gap-6">
        <div
          onClick={() => {
            if (featuredBand?.id) {
              navigate(`/profile?id=${featuredBand.id}`);
            }
          }}
          className="group relative h-80 cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-black/30 sm:h-96 lg:h-100"
        >
          <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Featured" />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8">
            <span className="mb-3 inline-block rounded-full bg-fuchsia-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_15px_rgba(192,38,211,0.5)] sm:text-xs">Trending Now</span>
            <h2 className="mb-2 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              {featuredBand?.full_name || 'Featured Artist'}
            </h2>
            <p className="max-w-lg text-sm text-gray-300 sm:text-base">Tap into new performances, behind-the-scenes updates, and artist drops as they happen.</p>
          </div>
        </div>

        <div className="flex h-80 flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:h-96 sm:p-6 lg:h-100">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Create</p>
              <h3 className="mt-2 text-xl font-black text-white">Publish your next update</h3>
            </div>
            <div className="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-300">
              <Plus size={20} />
            </div>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-gray-300">Share your latest rehearsal, venue check-in, creative win, or collab idea. Posts can include a caption, location, an uploaded image, and tags.</p>
          <div className="mb-5 grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="inline-flex items-center gap-2 text-white">
                <Users size={14} className="text-cyan-400" />
                <span className="font-semibold">Following</span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">{followingCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="inline-flex items-center gap-2 text-white">
                <TrendingUp size={14} className="text-fuchsia-400" />
                <span className="font-semibold">Feed Posts</span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">{feedPosts.length}</p>
            </div>
          </div>
          <Button className="mt-auto w-full" onClick={() => navigate('/feed/create')}>
            <Plus size={16} />
            Create Post
          </Button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto px-2 pb-2 scrollbar-hide sm:gap-4 md:gap-6">
        {visibleFeaturedArtists.map((artist, i) => {
          const artistAvatar = resolveAvatarUrl(artist, avatarCacheSeed);
          const featuredDisplayName = artist.stage_name || artist.artists?.[0]?.stage_name || artist.full_name || artist.username || `artist_${i}`;

          return (
            <button
              key={artist.id}
              onClick={() => navigate(`/profile?id=${artist.id}`)}
              className="group flex shrink-0 flex-col items-center gap-2 sm:gap-3"
            >
              <div className="h-14 w-14 rounded-full bg-linear-to-tr from-fuchsia-500 via-purple-500 to-cyan-500 p-0.5 shadow-lg transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] sm:h-16 sm:w-16 md:h-20 md:w-20 md:p-1">
                <div className="h-full w-full rounded-full bg-black p-0.5 md:p-1">
                  <img
                    key={artistAvatar}
                    src={artistAvatar}
                    alt={artist.artists?.[0]?.stage_name || artist.full_name || artist.username || 'Artist'}
                    className="h-full w-full rounded-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold tracking-wide text-gray-500 transition-colors group-hover:text-white sm:text-xs">
                {featuredDisplayName}
              </span>
            </button>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Following Feed</p>
            <h3 className="mt-2 text-2xl font-black text-white">Newest posts from people you follow</h3>
            <p className="mt-1 text-sm text-gray-400">Sorted in descending order by timestamp, so the latest updates stay on top.</p>
          </div>
          <Button variant="secondary" className="px-4 py-2 text-sm" onClick={loadFeed}>
            <RefreshCw size={15} />
            Refresh
          </Button>
        </div>

        {feedError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {feedError}
          </div>
        )}

        {feedLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5"></div>
            ))}
          </div>
        ) : feedPosts.length > 0 ? (
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 sm:gap-6 sm:space-y-6">
            {feedPosts.map(renderPostCard)}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
            <h4 className="text-xl font-bold text-white">No followed posts yet</h4>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
              Follow more artists or managers to build your feed, or publish your own update now and start the momentum.
            </p>
            <div className="mt-5 flex justify-center">
              <Button onClick={() => navigate('/feed/create')}>
                <Plus size={16} />
                Create Your First Post
              </Button>
            </div>
          </div>
        )}
      </section>

      {discoverPosts.length > 0 && (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Discover</p>
            <h3 className="mt-2 text-2xl font-black text-white">Recent posts outside your circle</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {discoverPosts.map((post) => (
              <div key={post.id} className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                {post.image_url ? (
                  <img src={post.image_url} alt="Post" className="h-48 w-full cursor-pointer object-cover" onClick={() => navigate(`/posts/${post.id}`)} />
                ) : (
                  <div className="flex h-48 cursor-pointer items-center justify-center bg-linear-to-br from-fuchsia-900/30 to-cyan-900/20 px-6 text-center text-sm text-gray-300" onClick={() => navigate(`/posts/${post.id}`)}>
                    {post.content}
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(getArtistProfilePath(post.author || { id: post.author_id }))}
                      className="text-left"
                    >
                      <p className="font-bold text-white">{post.author?.full_name || 'Unknown user'}</p>
                      <p className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</p>
                    </button>
                    {post.location && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-[10px] text-gray-300">
                        <MapPin size={11} />
                        {post.location}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-3 cursor-pointer text-sm leading-relaxed text-gray-300" onClick={() => navigate(`/posts/${post.id}`)}>{post.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CommunityFeed;
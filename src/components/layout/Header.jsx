import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, User, LogOut, X } from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';

const withCacheBuster = (imageUrl, version) => {
  if (!imageUrl || imageUrl.startsWith('data:') || !version) {
    return imageUrl;
  }

  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${encodeURIComponent(version)}`;
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'just now';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Header = ({ user, role, onLogout }) => {
  const navigate = useNavigate();
  const { profile, supabase, user: authUser } = useSupabase();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [postNotifications, setPostNotifications] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);
  const [unreadPostCount, setUnreadPostCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const activeUserId = authUser?.id || user?.id;
  const seenPostsStorageKey = useMemo(
    () => (activeUserId ? `artify_seen_posts_${activeUserId}` : null),
    [activeUserId]
  );

  const getSeenAt = useCallback(() => {
    if (!seenPostsStorageKey) return null;
    try {
      return localStorage.getItem(seenPostsStorageKey);
    } catch {
      return null;
    }
  }, [seenPostsStorageKey]);

  const setSeenAtNow = useCallback(() => {
    if (!seenPostsStorageKey) return;
    try {
      localStorage.setItem(seenPostsStorageKey, new Date().toISOString());
    } catch {
      // ignore localStorage write errors
    }
  }, [seenPostsStorageKey]);

  const calculateUnreadPosts = useCallback((notifications) => {
    const seenAt = getSeenAt();
    if (!seenAt) return notifications.length;

    const seenAtMs = new Date(seenAt).getTime();
    return notifications.filter((item) => new Date(item.created_at).getTime() > seenAtMs).length;
  }, [getSeenAt]);

  const loadMessageNotificationCount = useCallback(async () => {
    if (!activeUserId) {
      setUnreadMessageCount(0);
      return;
    }

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', activeUserId)
      .eq('is_read', false);

    setUnreadMessageCount(count || 0);
  }, [activeUserId, supabase]);

  const loadPostNotifications = useCallback(async () => {
    if (!activeUserId) {
      setPostNotifications([]);
      setUnreadPostCount(0);
      return;
    }

    setNotificationsLoading(true);
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', activeUserId);

      if (followsError) throw followsError;

      const ids = (followsData || []).map((item) => item.following_id);
      setFollowedIds(ids);

      if (ids.length === 0) {
        setPostNotifications([]);
        setUnreadPostCount(0);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          author_id,
          content,
          created_at,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            updated_at,
            role,
            artists (stage_name)
          )
        `)
        .in('author_id', ids)
        .order('created_at', { ascending: false })
        .limit(30);

      if (postsError) throw postsError;

      const normalized = (postsData || []).map((post) => {
        const author = post.author;
        const displayName = author?.role === 'artist'
          ? (author?.artists?.[0]?.stage_name || author?.full_name || author?.username || 'Artist')
          : (author?.full_name || author?.username || 'Manager');
        const avatar = withCacheBuster(author?.avatar_url, author?.updated_at) || `https://i.pravatar.cc/150?u=${post.author_id}`;

        return {
          ...post,
          displayName,
          avatar,
        };
      });

      setPostNotifications(normalized);
      setUnreadPostCount(calculateUnreadPosts(normalized));
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setPostNotifications([]);
      setUnreadPostCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [activeUserId, calculateUnreadPosts, supabase]);

  const handleOpenNotifications = useCallback(async () => {
    setShowNotifications(true);
    await loadPostNotifications();
  }, [loadPostNotifications]);

  useEffect(() => {
    loadPostNotifications();
    loadMessageNotificationCount();
  }, [loadPostNotifications, loadMessageNotificationCount]);

  useEffect(() => {
    if (!activeUserId) return undefined;

    // Fallback polling to ensure notifications stay fresh even if realtime events are missed.
    const timer = window.setInterval(() => {
      loadPostNotifications();
      loadMessageNotificationCount();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [activeUserId, loadMessageNotificationCount, loadPostNotifications]);

  useEffect(() => {
    if (!activeUserId) return undefined;

    const postChannel = supabase
      .channel(`header-post-notify-${activeUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        const newPost = payload?.new;
        if (!newPost?.author_id) return;
        loadPostNotifications();
      })
      .subscribe();

    const messageChannel = supabase
      .channel(`header-message-notify-${activeUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${activeUserId}` },
        () => {
          loadMessageNotificationCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [activeUserId, loadMessageNotificationCount, loadPostNotifications, supabase]);

  useEffect(() => {
    if (!showNotifications) return;
    setSeenAtNow();
    setUnreadPostCount(0);
  }, [setSeenAtNow, showNotifications]);

  useEffect(() => {
    if (!showProfileMenu) return undefined;

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
    };
  }, [showProfileMenu]);

  // Safe access to user data
  const userName = profile?.full_name || user?.user_metadata?.full_name || (role === 'artist' ? 'Aria Sterling' : 'TechGlobal Inc.');
  const metadataUsername = user?.user_metadata?.username;
  const userRole = role === 'artist' ? 'Artist' : 'Organizer';
  const resolvedAvatar = profile?.avatar_url || (profile?.role === 'artist' ? profile?.portfolio_images?.[0] : null);
  const userImage = withCacheBuster(resolvedAvatar, profile?.updated_at) || `https://i.pravatar.cc/150?u=${user?.id || 'artify'}`;
  const usernameToUse = (profile?.username || metadataUsername || '').toLowerCase().trim();
  const isValidUsername = /^[a-z0-9_]{3,}$/.test(usernameToUse);
  const profilePath = isValidUsername ? `/${usernameToUse}` : '/profile';

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
        <button
          onClick={handleOpenNotifications}
          className="relative text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <BellRing size={20} sm={24} />
          {unreadPostCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-500 text-[10px] font-bold text-white flex items-center justify-center border border-black shadow-[0_0_10px_rgba(217,70,239,0.8)]">
              {unreadPostCount > 9 ? '9+' : unreadPostCount}
            </span>
          )}
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
          <div className="group relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-0.5 cursor-pointer transition-all flex-shrink-0"
              aria-label="Open profile menu"
              aria-expanded={showProfileMenu}
            >
              <img
                key={userImage}
                src={userImage}
                className="w-full h-full rounded-full object-cover border-2 border-[#050505]"
                alt="Profile"
              />
            </button>
            {/* Dropdown menu */}
            <div className={`absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 z-50 ${showProfileMenu ? 'opacity-100 visible' : 'opacity-0 invisible'} sm:group-hover:opacity-100 sm:group-hover:visible`}>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate(profilePath);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3"
              >
                <User size={16} />
                <span>Profile</span>
              </button>
              <hr className="border-white/10" />
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="fixed inset-0 z-[70] flex items-start justify-end bg-black/50 p-4 sm:p-6" onClick={() => setShowNotifications(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <h3 className="text-sm sm:text-base font-bold text-white">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {notificationsLoading ? (
                <div className="p-6 text-sm text-gray-400">Loading notifications...</div>
              ) : postNotifications.length === 0 ? (
                <div className="p-6 text-sm text-gray-400">No post notifications yet. Follow artists or managers to see updates here.</div>
              ) : (
                postNotifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(`/posts/${item.id}`);
                    }}
                    className="w-full border-b border-white/5 px-4 py-3 text-left hover:bg-white/5 sm:px-5"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.avatar}
                        alt={item.displayName}
                        className="h-10 w-10 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-200">
                          <span className="font-bold text-white">{item.displayName}</span> posted a new update.
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-400">{item.content}</p>
                        <p className="mt-1 text-[11px] text-gray-500">{formatRelativeTime(item.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

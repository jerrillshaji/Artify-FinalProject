import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import MobileNav from '../layout/MobileNav';
import CommunityFeed from '../../views/CommunityFeed';
import FeedOffersView from '../../views/FeedOffersView';
import ManagerDiscovery from '../../views/ManagerDiscovery';
import ArtistCollaborationView from '../../views/ArtistCollaborationView';
import ArtistDashboard from '../../views/ArtistDashboard';
import ManagerDashboard from '../../views/ManagerDashboard';
import MessagesView from '../../views/MessagesView';
import ProfileView from '../../views/ProfileView';
import EditProfileView from '../../views/EditProfileView';
import CreatePostView from '../../views/CreatePostView';
import PostDetailView from '../../views/PostDetailView';
import PaymentView from '../../views/PaymentView';
import { useSupabase } from '../../context/SupabaseContext';

const SettingsPlaceholder = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
      <p className="text-gray-400">Settings page coming soon...</p>
    </div>
  </div>
);

const MainLayout = ({ user, role, onLogout }) => {
  const { user: authUser, supabase } = useSupabase();
  const location = useLocation();
  const [navBadges, setNavBadges] = useState({
    community: null,
    feed: null,
    discover: null,
    dashboard: null,
    messages: null,
    settings: null,
  });

  const activeUserId = authUser?.id || user?.id;
  const seenStorageKeys = useMemo(
    () => (activeUserId ? {
      community: `artify_seen_nav_community_${activeUserId}`,
      feed: `artify_seen_nav_feed_${activeUserId}`,
      discover: `artify_seen_nav_discover_${activeUserId}`,
      dashboard: `artify_seen_nav_dashboard_${activeUserId}`,
      messages: `artify_seen_nav_messages_${activeUserId}`,
      settings: `artify_seen_nav_settings_${activeUserId}`,
    } : null),
    [activeUserId]
  );

  const getSeenAt = useCallback((tabKey) => {
    if (!seenStorageKeys?.[tabKey]) return null;
    try {
      return localStorage.getItem(seenStorageKeys[tabKey]);
    } catch {
      return null;
    }
  }, [seenStorageKeys]);

  const setSeenAtNow = useCallback((tabKey) => {
    if (!seenStorageKeys?.[tabKey]) return;
    try {
      localStorage.setItem(seenStorageKeys[tabKey], new Date().toISOString());
    } catch {
      // ignore localStorage write errors
    }
  }, [seenStorageKeys]);

  const resolveTabKeyFromPath = useCallback((pathname) => {
    if (pathname.startsWith('/community')) return 'community';
    if (pathname.startsWith('/feed')) return 'feed';
    if (pathname.startsWith('/discover')) return 'discover';
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/payments')) return 'dashboard';
    if (pathname.startsWith('/messages')) return 'messages';
    if (pathname.startsWith('/settings')) return 'settings';
    return null;
  }, []);

  const formatBadge = useCallback((count) => {
    if (!count || Number(count) <= 0) return null;
    if (count > 99) return '99+';
    return String(count);
  }, []);

  const loadNavBadges = useCallback(async () => {
    if (!activeUserId) {
      setNavBadges({
        community: null,
        feed: null,
        discover: null,
        dashboard: null,
        messages: null,
        settings: null,
      });
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const communitySeenAt = getSeenAt('community');
      const feedSeenAt = getSeenAt('feed');
      const discoverSeenAt = getSeenAt('discover');
      const dashboardSeenAt = getSeenAt('dashboard');
      const messagesSeenAt = getSeenAt('messages');

      const unreadMessagesQuery = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', activeUserId)
        .gt('created_at', messagesSeenAt || '1970-01-01T00:00:00.000Z');

      const feedCountQuery = supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .eq('status', 'published')
        .gt('created_at', feedSeenAt || '1970-01-01T00:00:00.000Z')
        .gt('event_date', nowIso);

      const discoverCountQuery = role === 'artist'
        ? supabase
          .from('artists')
          .select('id', { count: 'exact', head: true })
          .eq('is_available', true)
          .gt('created_at', discoverSeenAt || '1970-01-01T00:00:00.000Z')
          .neq('id', activeUserId)
        : supabase
          .from('artists')
          .select('id', { count: 'exact', head: true })
          .eq('is_available', true)
          .gt('created_at', discoverSeenAt || '1970-01-01T00:00:00.000Z');

      const dashboardCountQuery = role === 'artist'
        ? supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('artist_id', activeUserId)
          .gt('created_at', dashboardSeenAt || '1970-01-01T00:00:00.000Z')
          .eq('status', 'pending')
        : supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('organizer_id', activeUserId)
          .gt('created_at', dashboardSeenAt || '1970-01-01T00:00:00.000Z')
          .eq('status', 'pending');

      const [{ count: unreadMessageCount }, { count: feedCount }, { count: discoverCount }, { count: dashboardCount }, { data: followsData, error: followsError }] = await Promise.all([
        unreadMessagesQuery,
        feedCountQuery,
        discoverCountQuery,
        dashboardCountQuery,
        supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', activeUserId),
      ]);

      if (followsError) throw followsError;

      let unreadPostCount = 0;
      const followingIds = (followsData || []).map((row) => row.following_id);
      if (followingIds.length > 0) {
        const postsQuery = supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .in('author_id', followingIds)
          .gt('created_at', communitySeenAt || '1970-01-01T00:00:00.000Z');
        const { count, error: postsError } = await postsQuery;
        if (postsError) throw postsError;
        unreadPostCount = count || 0;
      }

      setNavBadges({
        community: formatBadge(unreadPostCount),
        feed: formatBadge(feedCount),
        discover: formatBadge(discoverCount),
        dashboard: formatBadge(dashboardCount),
        messages: formatBadge(unreadMessageCount),
        settings: null,
      });
    } catch (error) {
      console.error('Failed to load navigation badges:', error);
    }
  }, [activeUserId, formatBadge, getSeenAt, role, supabase]);

  useEffect(() => {
    if (!activeUserId || !seenStorageKeys) return;

    (['community', 'feed', 'discover', 'dashboard', 'messages', 'settings']).forEach((tabKey) => {
      if (!getSeenAt(tabKey)) {
        setSeenAtNow(tabKey);
      }
    });
  }, [activeUserId, getSeenAt, seenStorageKeys, setSeenAtNow]);

  useEffect(() => {
    const activeTab = resolveTabKeyFromPath(location.pathname);
    if (!activeTab) return;

    setSeenAtNow(activeTab);
    setNavBadges((prev) => ({
      ...prev,
      [activeTab]: null,
    }));
  }, [location.pathname, resolveTabKeyFromPath, setSeenAtNow]);

  useEffect(() => {
    loadNavBadges();
  }, [loadNavBadges]);

  useEffect(() => {
    if (!activeUserId) return undefined;

    const timer = window.setInterval(() => {
      loadNavBadges();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [activeUserId, loadNavBadges]);

  useEffect(() => {
    if (!activeUserId) return undefined;

    const messageChannel = supabase
      .channel(`nav-badges-message-${activeUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${activeUserId}` },
        loadNavBadges
      )
      .subscribe();

    const bookingChannel = supabase
      .channel(`nav-badges-bookings-${activeUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadNavBadges)
      .subscribe();

    const postChannel = supabase
      .channel(`nav-badges-posts-${activeUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, loadNavBadges)
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(postChannel);
    };
  }, [activeUserId, loadNavBadges, supabase]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-fuchsia-500 selection:text-white w-full max-w-[100vw] overflow-x-hidden">
      {/* Background decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <Header user={user} role={role} onLogout={onLogout} />

      {/* Main content area */}
      <div className="relative z-10 flex w-full min-h-0 pt-20 sm:pt-24">
        {/* Sidebar (desktop) */}
        <Sidebar role={role} badges={navBadges} />

        {/* Page content */}
        <main className="mx-auto flex min-h-0 w-full max-w-full flex-1 flex-col px-3 pt-3 pb-28 sm:px-4 sm:pt-4 md:ml-28 md:px-6 md:py-6 lg:px-8">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1 min-h-0 w-full">
            <Routes>
              <Route path="/community" element={<CommunityFeed />} />
              <Route path="/community/create" element={<CreatePostView />} />
              <Route path="/feed" element={<FeedOffersView />} />
              <Route path="/feed/create" element={<Navigate to="/community/create" replace />} />
              <Route path="/posts/:postId" element={<PostDetailView />} />
              <Route path="/discover" element={role === 'manager' ? <ManagerDiscovery /> : <ArtistCollaborationView />} />
              <Route path="/dashboard" element={role === 'artist' ? <ArtistDashboard /> : <ManagerDashboard />} />
              <Route path="/messages" element={<MessagesView />} />
              <Route path="/payments" element={role === 'manager' ? <PaymentView /> : <Navigate to="/dashboard" replace />} />
              <Route path="/profile/edit" element={<EditProfileView />} />
              <Route path="/profile" element={<ProfileView role={role} />} />
              <Route path="/:username" element={<ProfileView role={role} />} />
              <Route path="/settings" element={<SettingsPlaceholder />} />
              <Route path="*" element={<Navigate to="/community" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileNav role={role} badges={navBadges} />
    </div>
  );
};

export default MainLayout;

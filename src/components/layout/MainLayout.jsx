import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

const SettingsPlaceholder = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
      <p className="text-gray-400">Settings page coming soon...</p>
    </div>
  </div>
);

const MainLayout = ({ user, role, onLogout }) => {
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
        <Sidebar role={role} />

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
      <MobileNav role={role} />
    </div>
  );
};

export default MainLayout;

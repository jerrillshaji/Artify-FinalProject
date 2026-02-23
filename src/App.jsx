import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { 
  Search, Calendar, MessageCircle, User, Bell, Grid, List, 
  Briefcase, Music, Settings, Check, ChevronRight 
} from 'lucide-react';
import NavItem from './components/layout/NavItem';
import CommunityFeed from './views/CommunityFeed';
import ManagerDiscovery from './views/ManagerDiscovery';
import ArtistCollaborationView from './views/ArtistCollaborationView';
import ArtistDashboard from './views/ArtistDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import MessagesView from './views/MessagesView';
import ProfileView from './views/ProfileView';
import { MOCK_ARTISTS } from './data/mockData';

export default function App() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  if (!role) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 sm:p-6 w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
          <div className="space-y-6 sm:space-y-8 relative">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-cyan-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse delay-1000"></div>
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-4 sm:mb-6">
                ARTIFY<br/>
              </h1>
              <p className="text-base sm:text-xl text-gray-400 max-w-md leading-relaxed">
                The curated network for elite talent and premier events. Step into the spotlight.
              </p>
            </div>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex -space-x-2 sm:-space-x-3 md:-space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-black bg-gray-800 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-bold text-sm sm:text-base md:text-lg text-white">10k+ Artists</span>
                <span className="text-[10px] sm:text-xs text-gray-500">Joined this month</span>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-4 sm:p-6 md:p-8 lg:p-12 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">Who Are You?</h2>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => { setRole('manager'); navigate('/discover'); }}
                className="w-full group p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-fuchsia-600 hover:to-purple-600 transition-all duration-300"
              >
                <div className="bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 md:gap-6 h-full transition-colors group-hover:bg-[#1a1a1a]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/20 transition-all flex-shrink-0">
                    <Briefcase size={20} sm={24} md={28} />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg md:text-xl text-white truncate">Event Manager</h3>
                    <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-300 truncate">Scout & Book Talent</p>
                  </div>
                  <ChevronRight className="text-gray-600 group-hover:text-white flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </button>
              <button
                onClick={() => { setRole('artist'); navigate('/dashboard'); }}
                className="w-full group p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-cyan-500 hover:to-blue-600 transition-all duration-300"
              >
                <div className="bg-[#0a0a0a] rounded-lg sm:rounded-xl p-4 sm:p-6 flex items-center gap-3 sm:gap-4 md:gap-6 h-full transition-colors group-hover:bg-[#1a1a1a]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-white/20 transition-all flex-shrink-0">
                    <Music size={20} sm={24} md={28} />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg md:text-xl text-white truncate">Artist</h3>
                    <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-300 truncate">Manage Gigs & Profile</p>
                  </div>
                  <ChevronRight className="text-gray-600 group-hover:text-white flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-fuchsia-500 selection:text-white w-full max-w-[100vw] overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>
      <header className="fixed top-0 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 z-50 px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-fuchsia-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(192,38,211,0.3)] flex-shrink-0">
            <span className="font-black text-lg sm:text-xl italic">A</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-black text-lg sm:text-xl tracking-tighter block leading-none">ARTIFY</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <button className="relative text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <Bell size={20} sm={24} />
            <span className="absolute top-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-fuchsia-500 rounded-full border-2 border-black shadow-[0_0_10px_rgba(217,70,239,0.8)]"></span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3 pl-4 sm:pl-6 border-l border-white/10">
            <div className="text-right hidden lg:block">
              <p className="text-xs sm:text-sm font-bold text-white">{role === 'artist' ? 'Aria Sterling' : 'TechGlobal Inc.'}</p>
              <p className="text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase tracking-widest">{role === 'artist' ? 'Pro Artist' : 'Organizer'}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 p-[2px] cursor-pointer hover:from-fuchsia-500 hover:to-purple-600 transition-all flex-shrink-0">
              <img
                src={role === 'artist' ? MOCK_ARTISTS[0].image : "https://i.pravatar.cc/150?img=60"}
                className="w-full h-full rounded-full object-cover border border-black"
                onClick={() => { setRole(null); navigate('/'); }}
              />
            </div>
          </div>
        </div>
      </header>
      <div className="flex pt-20 sm:pt-24 relative z-10 w-full">
        <aside className="hidden md:flex fixed left-0 top-16 sm:top-20 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] w-24 sm:w-28 flex-col items-center py-6 sm:py-8 gap-6 sm:gap-8 z-40 border-r border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:gap-4 w-full px-2 sm:px-4">
            <NavItem to="/feed" icon={Grid} label="Feed" />
            <NavItem to="/discover" icon={Search} label="Discover" />
            <NavItem to="/dashboard" icon={role === 'artist' ? Calendar : List} label={role === 'artist' ? 'Bookings' : 'Events'} badge={role === 'artist' ? '2' : null} />
            <NavItem to="/messages" icon={MessageCircle} label="Chat" badge="5" />
            <NavItem to="/profile" icon={User} label="Profile" />
          </div>
          <div className="mt-auto pb-4 sm:pb-6 w-full px-2 sm:px-4 flex flex-col items-center gap-3 sm:gap-4">
            <button className="p-2 sm:p-3 text-gray-600 hover:text-white transition-colors rounded-xl hover:bg-white/5">
              <Settings size={20} sm={24} />
            </button>
          </div>
        </aside>
        <main className="flex-1 w-full max-w-full md:ml-28 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 pb-28 md:pb-8 md:py-6 mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
            <Routes>
              <Route path="/feed" element={<CommunityFeed />} />
              <Route path="/discover" element={role === 'manager' ? <ManagerDiscovery /> : <ArtistCollaborationView />} />
              <Route path="/dashboard" element={role === 'artist' ? <ArtistDashboard /> : <ManagerDashboard />} />
              <Route path="/messages" element={<MessagesView />} />
              <Route path="/profile" element={<ProfileView role={role} />} />
              <Route path="*" element={<Navigate to="/feed" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      <nav className="md:hidden fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex justify-between items-center z-50 shadow-2xl">
        <NavItem to="/feed" icon={Grid} label="Feed" isMobile={true} />
        <NavItem to="/discover" icon={Search} label="Search" isMobile={true} />
        <NavItem to="/dashboard" icon={role === 'artist' ? Calendar : List} label="Bookings" badge={role === 'artist' ? '2' : null} isMobile={true} />
        <NavItem to="/messages" icon={MessageCircle} label="Chat" isMobile={true} />
        <NavItem to="/profile" icon={User} label="Profile" isMobile={true} />
      </nav>
    </div>
  );
}
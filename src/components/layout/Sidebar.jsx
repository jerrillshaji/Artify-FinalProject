import React from 'react';
import { Calendar, Grid, List, MessageCircle, Search, Newspaper } from 'lucide-react';
import NavItem from './NavItem';

const Sidebar = ({ role, badges = {} }) => {
  return (
    <aside className="hidden md:flex fixed left-0 top-16 sm:top-20 h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] w-24 sm:w-28 flex-col items-center py-6 sm:py-8 gap-6 sm:gap-8 z-40 border-r border-white/5 bg-black/20 backdrop-blur-sm">
      {/* Navigation items */}
      <div className="flex flex-col gap-3 sm:gap-4 w-full px-2 sm:px-4">
        <NavItem to="/community" icon={Grid} label="Community" badge={badges.community} />
        <NavItem to="/feed" icon={Newspaper} label="Feed" badge={badges.feed} />
        <NavItem to="/discover" icon={Search} label="Discover" badge={badges.discover} />
        <NavItem
          to="/dashboard"
          icon={role === 'artist' ? Calendar : List}
          label={role === 'artist' ? 'Bookings' : 'Events'}
          badge={badges.dashboard}
        />
        <NavItem to="/messages" icon={MessageCircle} label="Chat" badge={badges.messages} />
      </div>
    </aside>
  );
};

export default Sidebar;

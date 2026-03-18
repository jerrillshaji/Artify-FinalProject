import React from 'react';
import { Calendar, Grid, List, MessageCircle, Search, Newspaper } from 'lucide-react';
import NavItem from './NavItem';

const MobileNav = ({ role, badges = {} }) => {
  return (
    <nav className="md:hidden fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex justify-between items-center z-50 shadow-2xl">
      <NavItem to="/community" icon={Grid} label="Community" badge={badges.community} isMobile={true} />
      <NavItem to="/feed" icon={Newspaper} label="Feed" badge={badges.feed} isMobile={true} />
      <NavItem to="/discover" icon={Search} label="Search" badge={badges.discover} isMobile={true} />
      <NavItem
        to="/dashboard"
        icon={role === 'artist' ? Calendar : List}
        label={role === 'artist' ? 'Bookings' : 'Events'}
        badge={badges.dashboard}
        isMobile={true}
      />
      <NavItem to="/messages" icon={MessageCircle} label="Chat" badge={badges.messages} isMobile={true} />
    </nav>
  );
};

export default MobileNav;

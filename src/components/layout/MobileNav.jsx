import React from 'react';
import { Calendar, Grid, List, MessageCircle, Search, Settings, User } from 'lucide-react';
import NavItem from './NavItem';

const MobileNav = ({ role }) => {
  return (
    <nav className="md:hidden fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex justify-between items-center z-50 shadow-2xl">
      <NavItem to="/feed" icon={Grid} label="Feed" isMobile={true} />
      <NavItem to="/discover" icon={Search} label="Search" isMobile={true} />
      <NavItem
        to="/dashboard"
        icon={role === 'artist' ? Calendar : List}
        label="Bookings"
        badge={role === 'artist' ? '2' : null}
        isMobile={true}
      />
      <NavItem to="/messages" icon={MessageCircle} label="Chat" isMobile={true} />
      <NavItem to="/settings" icon={Settings} label="Settings" isMobile={true} />
    </nav>
  );
};

export default MobileNav;

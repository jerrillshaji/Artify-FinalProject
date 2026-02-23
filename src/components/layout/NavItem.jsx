import React from 'react';
import { NavLink } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, label, badge, isMobile = false }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `group relative flex ${isMobile ? 'flex-col' : 'md:flex-col'} items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 w-full ${
        isActive
        ? 'text-white'
        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
      }`}
    >
      {({ isActive }) => (
        <>
          <div className={`relative p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-tr from-fuchsia-600 to-purple-600 shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'bg-white/5'}`}>
            <Icon size={20} md={22} className={`${isActive ? 'text-white' : ''}`} />
            {badge && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-cyan-500 text-black text-[9px] sm:text-[10px] flex items-center justify-center rounded-full font-bold shadow-lg">
                {badge}
              </span>
            )}
          </div>
          <span className={`text-[10px] md:text-xs font-bold tracking-wide hidden md:block ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
          <span className="md:hidden text-[10px] sm:text-xs font-medium text-center">{label}</span>
          {isActive && (
            <div className="hidden md:block absolute -right-[11px] md:-right-[13px] top-1/2 -translate-y-1/2 w-1 h-6 md:h-8 bg-fuchsia-500 rounded-l-full shadow-[0_0_10px_rgba(232,121,249,0.8)]"></div>
          )}
        </>
      )}
    </NavLink>
  );
};

export default NavItem;
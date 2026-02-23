import React from 'react';

const NavItem = ({ id, icon: Icon, label, badge, activeTab, setActiveTab, isMobile = false }) => {
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`group relative flex ${isMobile ? 'flex-col' : 'md:flex-col'} items-center gap-3 md:gap-2 p-3 rounded-2xl transition-all duration-300 w-full md:w-auto ${
        activeTab === id
        ? 'text-white'
        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
      }`}
    >
      <div className={`relative p-2.5 rounded-xl transition-all duration-300 ${activeTab === id ? 'bg-gradient-to-tr from-fuchsia-600 to-purple-600 shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'bg-white/5'}`}>
        <Icon size={22} className={`${activeTab === id ? 'text-white' : ''}`} />
        {badge && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-black text-[10px] flex items-center justify-center rounded-full font-bold shadow-lg">
            {badge}
          </span>
        )}
      </div>
      <span className={`text-xs font-bold tracking-wide hidden md:block ${activeTab === id ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
      <span className="md:hidden text-sm font-medium ml-2">{label}</span>
      {activeTab === id && (
        <div className="hidden md:block absolute -right-[13px] top-1/2 -translate-y-1/2 w-1 h-8 bg-fuchsia-500 rounded-l-full shadow-[0_0_10px_rgba(232,121,249,0.8)]"></div>
      )}
    </button>
  );
};

export default NavItem;
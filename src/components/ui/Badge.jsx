import React from 'react';

const Badge = ({ children, color = "blue" }) => {
  const styles = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm";
  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
  };
  return <span className={`${styles} ${colors[color]}`}>{children}</span>;
};

export default Badge;
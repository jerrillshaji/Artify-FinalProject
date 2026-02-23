import React from 'react';

const Button = ({ children, variant = "primary", className, ...props }) => {
  const base = "px-5 py-2.5 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 tracking-wide";
  const variants = {
    primary: "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] border border-white/10",
    secondary: "bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

export default Button;
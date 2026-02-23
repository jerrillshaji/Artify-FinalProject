import React from 'react';
import { Check, Star, Camera, Play } from 'lucide-react';
import Button from '../components/ui/Button';
import { MOCK_ARTISTS } from '../data/mockData';

const ProfileView = ({ role }) => {
  return (
    <div className="relative">
      <div className="h-80 rounded-[2.5rem] relative overflow-hidden mb-24">
        <img src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-end gap-8">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-fuchsia-500 to-cyan-500">
              <img src={role === 'artist' ? MOCK_ARTISTS[0].image : "https://i.pravatar.cc/150?img=60"} className="w-full h-full rounded-full object-cover border-4 border-[#050505]" />
            </div>
            <div className="absolute bottom-2 right-2 p-1.5 bg-[#050505] rounded-full">
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#050505] animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 mb-2">
            <h1 className="text-4xl md:text-5xl font-black text-white leading-none mb-2 flex items-center gap-3">
              {role === 'artist' ? 'Aria Sterling' : 'TechGlobal Inc.'}
              <Check className="w-6 h-6 p-1 bg-cyan-500 text-black rounded-full" strokeWidth={4} />
            </h1>
            <p className="text-xl text-fuchsia-400 font-medium">Jazz Vocalist • New York, NY</p>
          </div>
          <div className="flex gap-3 mb-4">
            <Button variant="secondary">Edit Profile</Button>
            <Button variant="primary">Share Profile</Button>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/5">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">About</h3>
            <p className="text-gray-300 leading-relaxed">
              Professional vocalist with 5+ years of experience in corporate events and luxury weddings. Known for a modern take on jazz classics.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/5">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">Stats</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Followers</span>
              <span className="font-bold text-white">12.5k</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Rating</span>
              <span className="font-bold text-yellow-400 flex items-center gap-1">4.9 <Star size={12} fill="currentColor"/></span>
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Camera size={24} className="text-fuchsia-500" />
            Portfolio Highlights
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-video bg-gray-800 rounded-2xl overflow-hidden relative group">
                <img src={`https://images.unsplash.com/photo-${1510000000000 + i}?auto=format&fit=crop&w=600&q=80`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                    <Play size={20} fill="currentColor" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
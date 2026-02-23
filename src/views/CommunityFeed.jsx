import React from 'react';
import { MoreHorizontal, Heart, Share2, TrendingUp } from 'lucide-react';
import { MOCK_POSTS } from '../data/mockData';

const CommunityFeed = () => (
  <div className="max-w-4xl mx-auto space-y-12 pb-24">
    <div className="relative rounded-3xl overflow-hidden aspect-2/1 md:aspect-3/1 group cursor-pointer">
      <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Featured" />
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-8 md:p-12">
        <span className="px-3 py-1 bg-fuchsia-600 text-white text-xs font-bold uppercase tracking-widest rounded-full mb-4 inline-block shadow-[0_0_15px_rgba(192,38,211,0.5)]">Trending Now</span>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">Electric Dreams Tour</h2>
        <p className="text-gray-300 max-w-lg text-lg">Experience the sound of the future with Neon Beats. Tickets selling fast for the final leg.</p>
      </div>
    </div>
    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide px-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group">
          <div className="w-20 h-20 rounded-full p-[3px] bg-linear-to-tr from-fuchsia-500 via-purple-500 to-cyan-500 shadow-lg group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300">
            <div className="w-full h-full rounded-full bg-black p-[3px]">
              <img src={`https://i.pravatar.cc/150?img=${i + 20}`} alt="User" className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500 group-hover:text-white transition-colors tracking-wide">ARTIST_{i}</span>
        </div>
      ))}
    </div>
    <div className="columns-1 md:columns-2 gap-6 space-y-6">
      {MOCK_POSTS.map(post => (
        <div key={post.id} className="break-inside-avoid bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300 group">
          <div className="p-4 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <img src={post.user.image} alt={post.user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-fuchsia-400 transition-colors cursor-pointer">{post.user.name}</h4>
                <p className="text-xs text-gray-400">{post.time}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white"><MoreHorizontal size={20} /></button>
          </div>
          <div className="relative">
            <img src={post.image} alt="Content" className="w-full h-auto object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-4 right-4 flex gap-3">
              <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-fuchsia-600 transition-colors"><Heart size={18} /></button>
              <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-blue-500 transition-colors"><Share2 size={18} /></button>
            </div>
          </div>
          <div className="p-5">
            <p className="text-gray-300 leading-relaxed text-sm mb-4">
              <span className="font-bold mr-2 text-white">{post.user.handle}</span>
              {post.content}
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <TrendingUp size={14} className="text-fuchsia-500" /> {post.likes} Hype points
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CommunityFeed;
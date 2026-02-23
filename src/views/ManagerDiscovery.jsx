import React from 'react';
import { Search, Star, Check, ChevronRight } from 'lucide-react';
import Button from '../components/ui/Button';
import { MOCK_ARTISTS } from '../data/mockData';

const ManagerDiscovery = () => {
  return (
    <div className="space-y-10 pb-12">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 rounded-2xl blur opacity-25"></div>
        <div className="relative bg-[#0F0F13] p-2 rounded-2xl flex items-center border border-white/10 shadow-2xl">
          <Search className="ml-4 text-gray-400" size={24} />
          <input
            type="text"
            placeholder="Find an artist for your next event..."
            className="w-full bg-transparent border-none text-white text-lg px-4 py-4 focus:ring-0 placeholder:text-gray-600"
          />
          <Button className="flex-shrink-0">Search</Button>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['Electronic', 'Jazz', 'Rock', 'Under $1k', 'Local', 'Trending'].map((filter, i) => (
          <button key={filter} className={`px-6 py-2 rounded-full text-sm font-bold border whitespace-nowrap transition-all ${i === 0 ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/40 hover:text-white'}`}>
            {filter}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
        {MOCK_ARTISTS.map(artist => (
          <div key={artist.id} className="group relative bg-[#121216] rounded-[2rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
            <div className="relative h-80 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#121216] z-10"></div>
              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0" />
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" /> {artist.rating}
                </div>
              </div>
            </div>
            <div className="relative z-20 px-8 pb-8 -mt-20">
              <h3 className="text-3xl font-black text-white leading-none mb-1 drop-shadow-lg">{artist.name}</h3>
              <p className="text-fuchsia-400 font-medium text-sm mb-6 flex items-center gap-2">
                {artist.role}
                {artist.verified && <Check className="w-4 h-4 p-0.5 bg-cyan-500 text-black rounded-full" />}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {artist.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded border border-white/5">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Starting at</p>
                  <p className="text-xl font-bold text-white">${artist.price}</p>
                </div>
                <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 hover:bg-fuchsia-500 hover:text-white transition-all duration-300">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerDiscovery;
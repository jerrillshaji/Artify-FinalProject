import React from 'react';
import { Zap, MapPin, ArrowUpRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';

const ArtistCollaborationView = () => (
  <div className="space-y-6 sm:space-y-8 pb-12">
    <div className="flex items-center mb-4 sm:mb-6">
      <BackButton />
    </div>
    <div className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">Jam Sessions</h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-lg">Find musicians for your next project, backup singers for a gig, or just people to jam with.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0">All Genres</Button>
        <Button variant="secondary" className="px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0">Near Me</Button>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[
        { title: "Looking for Bassist", genre: "Jazz / Funk", loc: "Brooklyn, NY", user: "Aria Sterling", type: "Gig", time: "2 days ago" },
        { title: "Bedroom Producer needs Vocals", genre: "Lo-Fi", loc: "Remote", user: "BeatMaker_99", type: "Collab", time: "5 hours ago" },
        { title: "Drummer for Punk Band", genre: "Punk Rock", loc: "Austin, TX", user: "RiffRaff", type: "Band Member", time: "1 week ago" },
        { title: "Need Piano for Wedding", genre: "Classical", loc: "Chicago, IL", user: "Elena Rosetti", type: "Gig ($300)", time: "Just now" },
      ].map((collab, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-white/20 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 sm:p-3">
            <ArrowUpRight size={18} sm={20} className="text-gray-600 group-hover:text-fuchsia-400 transition-colors" />
          </div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
            <Badge color={collab.type.includes('$') ? 'green' : 'purple'}>{collab.type}</Badge>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{collab.time}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors line-clamp-2">{collab.title}</h3>
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-md border border-white/5">{collab.genre}</span>
            <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-md border border-white/5 flex items-center gap-1"><MapPin size={10}/> {collab.loc}</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0"></div>
              <span className="text-xs text-gray-300 font-medium truncate max-w-[120px] sm:max-w-none">{collab.user}</span>
            </div>
            <span className="text-xs font-bold text-white group-hover:underline">Connect</span>
          </div>
        </div>
      ))}
      <div className="bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 backdrop-blur-xl border border-dashed border-fuchsia-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center hover:bg-fuchsia-900/30 transition-all cursor-pointer group min-h-[200px]">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform text-fuchsia-400">
          <Zap size={28} sm={32} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-1">Post a Request</h3>
        <p className="text-sm text-gray-400">Looking for talent? Start here.</p>
      </div>
    </div>
  </div>
);

export default ArtistCollaborationView;
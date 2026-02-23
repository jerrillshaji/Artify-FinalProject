import React from 'react';
import { Zap, MapPin, ArrowUpRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const ArtistCollaborationView = () => (
  <div className="space-y-8 pb-12">
    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Jam Sessions</h1>
        <p className="text-gray-400 max-w-lg">Find musicians for your next project, backup singers for a gig, or just people to jam with.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" className="px-4">All Genres</Button>
        <Button variant="secondary" className="px-4">Near Me</Button>
      </div>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: "Looking for Bassist", genre: "Jazz / Funk", loc: "Brooklyn, NY", user: "Aria Sterling", type: "Gig", time: "2 days ago" },
        { title: "Bedroom Producer needs Vocals", genre: "Lo-Fi", loc: "Remote", user: "BeatMaker_99", type: "Collab", time: "5 hours ago" },
        { title: "Drummer for Punk Band", genre: "Punk Rock", loc: "Austin, TX", user: "RiffRaff", type: "Band Member", time: "1 week ago" },
        { title: "Need Piano for Wedding", genre: "Classical", loc: "Chicago, IL", user: "Elena Rosetti", type: "Gig ($300)", time: "Just now" },
      ].map((collab, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-white/20 hover:bg-white/10 transition-all group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <ArrowUpRight size={20} className="text-gray-600 group-hover:text-fuchsia-400 transition-colors" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Badge color={collab.type.includes('$') ? 'green' : 'purple'}>{collab.type}</Badge>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{collab.time}</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors">{collab.title}</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-md border border-white/5">{collab.genre}</span>
            <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded-md border border-white/5 flex items-center gap-1"><MapPin size={10}/> {collab.loc}</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800"></div>
              <span className="text-xs text-gray-300 font-medium">{collab.user}</span>
            </div>
            <span className="text-xs font-bold text-white group-hover:underline">Connect</span>
          </div>
        </div>
      ))}
      <div className="bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 backdrop-blur-xl border border-dashed border-fuchsia-500/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-fuchsia-900/30 transition-all cursor-pointer group">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-fuchsia-400">
          <Zap size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Post a Request</h3>
        <p className="text-sm text-gray-400">Looking for talent? Start here.</p>
      </div>
    </div>
  </div>
);

export default ArtistCollaborationView;
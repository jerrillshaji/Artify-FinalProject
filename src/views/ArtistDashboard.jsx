import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, List, DollarSign, Zap, TrendingUp, Star, MapPin, MessageCircle, X } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { MOCK_REQUESTS } from '../data/mockData';
import BackButton from '../components/layout/BackButton';

const ArtistDashboard = () => {
  const [viewMode, setViewMode] = useState('list');
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  const renderCalendar = () => {
    const daysInMonth = 31;
    const firstDay = 4;
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[80px] md:min-h-[100px] bg-white/[0.02] border border-white/5 rounded-lg sm:rounded-xl opacity-30"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `Aug ${d}`;
      const dayEvents = requests.filter(r => r.date.startsWith(dateStr) || (d === 15 && r.date.includes('Aug 15')));
      days.push(
        <div key={d} className="min-h-[60px] sm:min-h-[80px] md:min-h-[100px] bg-white/5 border border-white/5 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 relative hover:bg-white/10 hover:border-fuchsia-500/30 transition-all group flex flex-col gap-0.5 sm:gap-1">
          <span className={`text-[10px] sm:text-sm font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-0.5 sm:mb-1 ${dayEvents.length > 0 ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(192,38,211,0.5)]' : 'text-gray-500'}`}>{d}</span>
          {dayEvents.map(ev => (
            <div key={ev.id} className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1.5 rounded bg-cyan-900/40 text-cyan-200 border border-cyan-500/20 truncate font-medium cursor-pointer hover:bg-cyan-500 hover:text-white transition-colors">
              {ev.event}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden p-3 sm:p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">August 2024</h2>
            <div className="flex gap-0.5 sm:gap-1">
              <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><ChevronLeft size={16} sm={20}/></button>
              <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><ChevronRight size={16} sm={20}/></button>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-4 text-[9px] sm:text-xs font-bold text-gray-400">
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-500"></div> <span className="hidden sm:inline">Event</span></div>
            <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-fuchsia-500"></div> <span className="hidden sm:inline">Blocked</span></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2 text-center text-gray-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-12">
      <div className="flex items-center mb-4 sm:mb-6">
        <BackButton />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-gray-400 text-sm sm:text-base">Welcome back, Aria. You have {requests.length} pending requests.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-fit self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 ${viewMode === 'list' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'text-gray-400 hover:text-white'}`}
          >
            <List size={14} sm={16} /> <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 ${viewMode === 'calendar' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'text-gray-400 hover:text-white'}`}
          >
            <Calendar size={14} sm={16} /> <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          { label: "Revenue", value: "$12.4k", icon: DollarSign, color: "text-emerald-400", trend: "+12%" },
          { label: "Bookings", value: "08", icon: Zap, color: "text-yellow-400", trend: "Active" },
          { label: "Reach", value: "1.2k", icon: TrendingUp, color: "text-fuchsia-400", trend: "+540" },
          { label: "Rating", value: "4.9", icon: Star, color: "text-cyan-400", trend: "Top 5%" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-2 sm:p-4 opacity-20 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-500 ${stat.color}`}>
              <stat.icon size={32} sm={48} />
            </div>
            <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 sm:mb-2">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-black text-white mb-0.5 sm:mb-1">{stat.value}</p>
            <p className={`text-[10px] sm:text-xs font-medium ${stat.color}`}>{stat.trend}</p>
          </div>
        ))}
      </div>
      {viewMode === 'list' ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-3 sm:p-4 md:p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-fuchsia-500 animate-pulse"></div>
              <span className="hidden sm:inline">Incoming Signals</span>
              <span className="sm:hidden">Signals</span>
            </h2>
            <Badge color="gray">{requests.length} Pending</Badge>
          </div>
          <div className="divide-y divide-white/5">
            {requests.map(req => (
              <div key={req.id} className="p-3 sm:p-4 md:p-6 hover:bg-white/5 transition-colors flex flex-col gap-3 sm:gap-4 md:gap-6 group">
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex flex-col items-center justify-center text-white flex-shrink-0 shadow-inner">
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase text-gray-400">{req.date.split(' ')[0]}</span>
                    <span className="text-base sm:text-xl font-black">{req.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-fuchsia-400 transition-colors truncate">{req.event}</h3>
                      <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-white/10 text-gray-300 border border-white/5 uppercase tracking-wider flex-shrink-0">{req.type}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-2">{req.organizer}</p>
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} sm={12} /> {req.distance}</span>
                      <span className="flex items-center gap-1 text-emerald-400"><DollarSign size={10} sm={12} /> ${req.offer}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 transition-all flex-shrink-0"><X size={16} sm={20} /></button>
                  <button className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 transition-all flex-shrink-0"><MessageCircle size={16} sm={20} /></button>
                  <button className="px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-fuchsia-400 hover:text-white hover:shadow-[0_0_20px_rgba(192,38,211,0.5)] transition-all flex-shrink-0">Accept</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        renderCalendar()
      )}
    </div>
  );
};

export default ArtistDashboard;
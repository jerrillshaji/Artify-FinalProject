import React from 'react';
import { Zap, DollarSign, Calendar, Users, Clock, MoreHorizontal, Paperclip } from 'lucide-react';
import Button from '../components/ui/Button';
import { MOCK_MANAGER_STATS } from '../data/mockData';

const ManagerDashboard = () => (
  <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-12">
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Event Command</h1>
        <p className="text-gray-400 text-sm sm:text-base">Overview for TechGlobal Inc.</p>
      </div>
      <Button className="px-3 sm:px-5 text-xs sm:text-sm self-start"><Zap size={16} sm={18}/> <span className="hidden sm:inline">Create Event</span><span className="sm:hidden">Create</span></Button>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {MOCK_MANAGER_STATS.map((stat, i) => (
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
    <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-fuchsia-500 animate-pulse"></div>
            <span className="hidden sm:inline">Active Events</span>
            <span className="sm:hidden">Events</span>
          </h2>
          <button className="text-xs sm:text-sm text-fuchsia-400 font-bold hover:underline">View All</button>
        </div>
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          {[
            { title: "Summer Tech Summit", date: "Aug 15", status: "On Track", progress: 85, color: "bg-emerald-500" },
            { title: "Quarterly Gala", date: "Oct 02", status: "Planning", progress: 30, color: "bg-yellow-500" },
            { title: "Product Launch Party", date: "Nov 12", status: "Pending Venue", progress: 10, color: "bg-red-500" },
          ].map((evt, i) => (
            <div key={i} className="bg-black/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/5 flex-shrink-0">
                  <span className="text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase">{evt.date.split(' ')[0]}</span>
                  <span className="text-sm sm:text-lg font-black text-white">{evt.date.split(' ')[1]}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">{evt.title}</h3>
                  <p className="text-xs text-gray-400">{evt.status}</p>
                </div>
              </div>
              <div className="w-24 sm:w-32 hidden md:block">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{evt.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${evt.color} rounded-full`} style={{ width: `${evt.progress}%` }}></div>
                </div>
              </div>
              <button className="p-1.5 sm:p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0">
                <MoreHorizontal size={16} sm={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-gradient-to-b from-fuchsia-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 sm:-mt-4 sm:-mr-4 w-16 h-16 sm:w-24 sm:h-24 bg-fuchsia-500 rounded-full blur-[50px] opacity-30"></div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 relative z-10">Quick Actions</h3>
          <div className="space-y-2 sm:space-y-3 relative z-10">
            <button className="w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-2 sm:gap-3 transition-colors group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0"><DollarSign size={14} sm={16}/></div>
              <span className="text-xs sm:text-sm font-medium text-gray-200">Process Payments</span>
            </button>
            <button className="w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-2 sm:gap-3 transition-colors group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0"><Users size={14} sm={16}/></div>
              <span className="text-xs sm:text-sm font-medium text-gray-200">Scout Talent</span>
            </button>
            <button className="w-full text-left p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-2 sm:gap-3 transition-colors group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0"><Paperclip size={14} sm={16}/></div>
              <span className="text-xs sm:text-sm font-medium text-gray-200">Review Contracts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ManagerDashboard;
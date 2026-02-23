import React from 'react';
import { Zap, DollarSign, Calendar, Users, Clock, MoreHorizontal, Paperclip } from 'lucide-react';
import Button from '../components/ui/Button';
import { MOCK_MANAGER_STATS } from '../data/mockData';

const ManagerDashboard = () => (
  <div className="space-y-8 pb-12">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Event Command</h1>
        <p className="text-gray-400">Overview for TechGlobal Inc.</p>
      </div>
      <Button><Zap size={18}/> Create Event</Button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {MOCK_MANAGER_STATS.map((stat, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
          <div className={`absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-500 ${stat.color}`}>
            <stat.icon size={48} />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{stat.label}</p>
          <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
          <p className={`text-xs font-medium ${stat.color}`}>{stat.trend}</p>
        </div>
      ))}
    </div>
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">Active Events</h2>
          <button className="text-xs text-fuchsia-400 font-bold hover:underline">View All</button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { title: "Summer Tech Summit", date: "Aug 15", status: "On Track", progress: 85, color: "bg-emerald-500" },
            { title: "Quarterly Gala", date: "Oct 02", status: "Planning", progress: 30, color: "bg-yellow-500" },
            { title: "Product Launch Party", date: "Nov 12", status: "Pending Venue", progress: 10, color: "bg-red-500" },
          ].map((evt, i) => (
            <div key={i} className="bg-black/20 rounded-2xl p-5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{evt.date.split(' ')[0]}</span>
                  <span className="text-lg font-black text-white">{evt.date.split(' ')[1]}</span>
                </div>
                <div>
                  <h3 className="font-bold text-white">{evt.title}</h3>
                  <p className="text-xs text-gray-400">{evt.status}</p>
                </div>
              </div>
              <div className="w-32 hidden md:block">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{evt.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${evt.color} rounded-full`} style={{ width: `${evt.progress}%` }}></div>
                </div>
              </div>
              <button className="p-2 bg-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-gradient-to-b from-fuchsia-900/40 to-purple-900/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-fuchsia-500 rounded-full blur-[50px] opacity-30"></div>
          <h3 className="text-lg font-bold text-white mb-4 relative z-10">Quick Actions</h3>
          <div className="space-y-3 relative z-10">
            <button className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><DollarSign size={16}/></div>
              <span className="text-sm font-medium text-gray-200">Process Payments</span>
            </button>
            <button className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Users size={16}/></div>
              <span className="text-sm font-medium text-gray-200">Scout Talent</span>
            </button>
            <button className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-3 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Paperclip size={16}/></div>
              <span className="text-sm font-medium text-gray-200">Review Contracts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ManagerDashboard;
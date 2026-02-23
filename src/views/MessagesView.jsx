import React from 'react';
import { Search, MessageCircle, MoreHorizontal, Paperclip, Mic, Send } from 'lucide-react';
import { MOCK_CHATS, MOCK_ARTISTS } from '../data/mockData';

const MessagesView = () => {
  return (
    <div className="grid md:grid-cols-3 gap-6 h-auto md:h-[calc(100vh-160px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl h-[500px] md:h-auto">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-black text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {MOCK_CHATS.map(chat => (
            <div key={chat.id} className={`p-4 rounded-2xl flex gap-4 cursor-pointer transition-all ${chat.id === 1 ? 'bg-white/10 border border-white/5' : 'hover:bg-white/5 border border-transparent'}`}>
              <div className="relative">
                <img src={chat.user.image || "https://i.pravatar.cc/150?img=1"} className="w-12 h-12 rounded-full object-cover border border-white/10" alt="User" />
                {chat.id === 1 && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-white truncate">{chat.user.name}</h4>
                  <span className="text-[10px] text-gray-500 font-medium">{chat.time}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && (
                <div className="flex flex-col justify-center">
                  <span className="w-5 h-5 bg-fuchsia-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(232,121,249,0.5)]">
                    {chat.unread}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col relative shadow-2xl h-[600px] md:h-auto">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <img src={MOCK_ARTISTS[1].image} className="w-10 h-10 rounded-full object-cover border border-white/10" alt="User" />
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                The Neon Beats
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </h3>
              <p className="text-xs text-gray-400">Typing...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><MessageCircle size={20}/></button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"><MoreHorizontal size={20}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-center">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full">Today</span>
          </div>
          <div className="flex gap-4">
            <img src={MOCK_ARTISTS[1].image} className="w-8 h-8 rounded-full object-cover self-end mb-1" alt="User" />
            <div className="space-y-1">
              <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-2xl rounded-bl-none text-sm text-gray-300 max-w-sm">
                Hey! Super excited for the show this weekend. 🎸
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-2xl rounded-tl-none text-sm text-gray-300 max-w-sm">
                Just double checking, load-in is at 4pm right?
              </div>
              <span className="text-[10px] text-gray-600 block pl-1">10:42 AM</span>
            </div>
          </div>
          <div className="flex gap-4 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center text-[10px] font-bold self-end mb-1">Me</div>
            <div className="space-y-1 items-end flex flex-col">
              <div className="bg-gradient-to-tr from-fuchsia-600 to-purple-600 p-3 rounded-2xl rounded-br-none text-sm text-white max-w-sm shadow-[0_0_15px_rgba(192,38,211,0.3)]">
                Yo! Yes, 4pm at the main loading dock. Security will have your passes.
              </div>
              <span className="text-[10px] text-gray-600 block pr-1">10:45 AM</span>
            </div>
          </div>
          <div className="flex gap-4">
            <img src={MOCK_ARTISTS[1].image} className="w-8 h-8 rounded-full object-cover self-end mb-1" alt="User" />
            <div className="space-y-1">
              <div className="bg-[#1a1a1a] border border-white/10 p-3 rounded-2xl rounded-bl-none text-sm text-gray-300 max-w-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-black/20 backdrop-blur-md absolute bottom-0 w-full border-t border-white/10">
          <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-full px-2 py-2">
            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"><Paperclip size={18}/></button>
            <input type="text" placeholder="Type a message..." className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm placeholder:text-gray-600" />
            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"><Mic size={18}/></button>
            <button className="p-2 bg-white text-black rounded-full hover:bg-fuchsia-400 hover:text-white transition-all transform hover:scale-105 hover:shadow-[0_0_15px_rgba(192,38,211,0.5)]"><Send size={18}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesView;
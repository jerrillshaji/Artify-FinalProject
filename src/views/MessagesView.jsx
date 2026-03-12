import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MessageCircle, MoreHorizontal, Paperclip, Mic, Send, Phone, Video } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import BackButton from '../components/layout/BackButton';

const CONVERSATION_FETCH_LIMIT = 100;
const MESSAGE_FETCH_LIMIT = 200;

// Simple encryption utilities (Note: For production, use a proper E2EE library)
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Generate encryption key from conversation participants
const generateKey = async (userId1, userId2) => {
  const keyString = [userId1, userId2].sort().join('-');
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt message
const encryptMessage = async (message, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );
  const encryptedArray = Array.from(new Uint8Array(encrypted));
  return JSON.stringify({ iv: Array.from(iv), data: encryptedArray });
};

// Decrypt message
const decryptMessage = async (encryptedJson, key) => {
  try {
    const { iv, data } = JSON.parse(encryptedJson);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    );
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Unable to decrypt message]';
  }
};

const MessagesView = () => {
  const { supabase, user } = useSupabase();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationError, setConversationError] = useState('');
  const messagesEndRef = useRef(null);
  const isTyping = false;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setConversationError('');

      const messageColumns = 'id,sender_id,receiver_id,content,is_read,created_at';

      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from('messages')
          .select(messageColumns)
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(CONVERSATION_FETCH_LIMIT),
        supabase
          .from('messages')
          .select(messageColumns)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(CONVERSATION_FETCH_LIMIT)
      ]);

      if (sentResult.error) throw sentResult.error;
      if (receivedResult.error) throw receivedResult.error;

      const mergedMessages = [...(sentResult.data || []), ...(receivedResult.data || [])]
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

      const conversationMap = new Map();

      mergedMessages.forEach((msg) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            user: null,
            lastMessage: msg,
            unreadCount: 0
          });
        }

        if (msg.receiver_id === user.id && !msg.is_read) {
          const existingConversation = conversationMap.get(otherUserId);
          existingConversation.unreadCount += 1;
        }
      });

      const otherUserIds = Array.from(conversationMap.keys());

      if (otherUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', otherUserIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
        conversationMap.forEach((conversation, otherUserId) => {
          conversation.user = profileMap.get(otherUserId) || null;
        });
      }

      const nextConversations = Array.from(conversationMap.values());
      setConversations(nextConversations);
      setSelectedConversation((currentConversation) => {
        if (!currentConversation) return null;

        return nextConversations.find((conversation) => conversation.id === currentConversation.id) || currentConversation;
      });
    } catch (error) {
      console.error('Error loading conversations:', error);

      if (error?.message?.includes('Failed to fetch')) {
        setConversationError('Could not reach Supabase. Check the project URL, API key, and allowed site URL settings.');
      } else if (error?.code === '57014') {
        setConversationError('Conversation loading timed out. The query was reduced, but you should also add the latest message indexes in Supabase.');
      } else {
        setConversationError('Could not load conversations right now.');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async () => {
    if (!user || !selectedConversation) return;

    try {
      const key = await generateKey(user.id, selectedConversation.id);

      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .eq('sender_id', user.id)
          .eq('receiver_id', selectedConversation.id)
          .order('created_at', { ascending: false })
          .limit(MESSAGE_FETCH_LIMIT),
        supabase
          .from('messages')
          .select('*')
          .eq('sender_id', selectedConversation.id)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(MESSAGE_FETCH_LIMIT)
      ]);

      if (sentResult.error) throw sentResult.error;
      if (receivedResult.error) throw receivedResult.error;

      const mergedMessages = [...(sentResult.data || []), ...(receivedResult.data || [])]
        .sort((left, right) => new Date(left.created_at) - new Date(right.created_at))
        .slice(-MESSAGE_FETCH_LIMIT);

      const decryptedMessages = await Promise.all(
        mergedMessages.map(async (msg) => ({
          ...msg,
          decryptedContent: await decryptMessage(msg.content, key)
        }))
      );

      setMessages(decryptedMessages);

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', selectedConversation.id)
        .eq('is_read', false);

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [selectedConversation, supabase, user]);

  useEffect(() => {
    loadConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const isRelevantConversation = payload.new.sender_id === user.id || payload.new.receiver_id === user.id;

          if (isRelevantConversation) {
            loadConversations();
          }

          if (
            selectedConversation &&
            (payload.new.sender_id === selectedConversation.id || payload.new.receiver_id === selectedConversation.id)
          ) {
            loadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations, loadMessages, selectedConversation, supabase, user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [loadMessages, selectedConversation]);

  // Auto-open conversation when navigating from a profile with ?userId=
  useEffect(() => {
    if (!targetUserId || !user || loading) return;

    const existing = conversations.find((c) => c.id === targetUserId);
    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    // No existing conversation — fetch the profile and create a virtual conversation object
    const openNewConversation = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profileData) {
        setSelectedConversation({
          id: profileData.id,
          user: profileData,
          lastMessage: null,
          unreadCount: 0,
        });
      }
    };

    openNewConversation();
  }, [targetUserId, conversations, loading, supabase, user]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return;

    setSending(true);
    try {
      // Encrypt message
      const key = await generateKey(user.id, selectedConversation.id);
      const encryptedContent = await encryptMessage(newMessage.trim(), key);

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedConversation.id,
        content: encryptedContent,
        is_read: false
      });

      if (error) throw error;

      setNewMessage('');
      loadConversations();
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 md:h-[calc(100dvh-9rem)]">
      <div className="flex items-center mb-4 sm:mb-6">
        <BackButton />
      </div>
      <div className="grid flex-1 min-h-0 gap-4 sm:gap-6 md:grid-cols-3">
        {/* Conversations List */}
        <div className="flex h-100 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl sm:h-125 sm:rounded-3xl md:col-span-1 md:h-full md:min-h-0">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <h2 className="text-lg sm:text-xl font-black text-white mb-3 sm:mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} sm={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full bg-black/20 border border-white/10 rounded-lg sm:rounded-xl pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 sm:space-y-2">
            {conversationError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 sm:text-sm">
                {conversationError}
              </div>
            )}
            {conversations
              .filter(conv => conv.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-2 sm:gap-4 cursor-pointer transition-all ${
                    selectedConversation?.id === conv.id
                      ? 'bg-white/10 border border-white/5'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.user?.avatar_url || `https://i.pravatar.cc/150?u=${conv.id}`}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-white/10"
                      alt={conv.user?.full_name}
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                      <h4 className="font-bold text-sm sm:text-base text-white truncate">
                        {conv.user?.full_name || 'Unknown User'}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium shrink-0">
                        {formatTime(conv.lastMessage?.created_at)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm truncate text-gray-400">
                      {conv.lastMessage?.sender_id === user.id ? 'You: ' : ''}
                      {conv.lastMessage?.content ? 'Message' : 'No messages yet'}
                    </p>
                  </div>
                </div>
              ))}
            {conversations.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-500 text-xs mt-1">Start a conversation with an artist or manager</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex h-125 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl sm:h-150 sm:rounded-3xl md:col-span-2 md:h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <img
                    src={selectedConversation.user?.avatar_url || `https://i.pravatar.cc/150?u=${selectedConversation.id}`}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-white/10 shrink-0"
                    alt={selectedConversation.user?.full_name}
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 truncate">
                      <span className="truncate">{selectedConversation.user?.full_name || 'Unknown User'}</span>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                    </h3>
                    <p className="text-xs text-gray-400">{isTyping ? 'Typing...' : 'Online'}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 sm:gap-2">
                  <button className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Phone size={16} sm={20} />
                  </button>
                  <button className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Video size={16} sm={20} />
                  </button>
                  <button className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <MoreHorizontal size={16} sm={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 sm:p-4 sm:space-y-4 md:p-6">
                {messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user.id;
                  const showDate = index === 0 || 
                    new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center">
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-black/20 px-2 sm:px-3 py-1 rounded-full">
                            {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className={`flex gap-2 sm:gap-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <img
                            src={selectedConversation.user?.avatar_url || `https://i.pravatar.cc/150?u=${selectedConversation.id}`}
                            className="mb-1 h-7 w-7 shrink-0 self-end rounded-full object-cover sm:h-8 sm:w-8"
                            alt={selectedConversation.user?.full_name}
                          />
                        )}
                        {isOwn ? (
                          <div className="space-y-1 items-end flex flex-col max-w-[calc(100%-2rem)]">
                            <div className="bg-gradient-to-tr from-fuchsia-600 to-purple-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl rounded-br-none text-xs sm:text-sm text-white max-w-[200px] sm:max-w-sm break-words shadow-[0_0_15px_rgba(192,38,211,0.3)]">
                              {msg.decryptedContent}
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-gray-600 block pr-1">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1 min-w-0">
                            <div className="bg-[#1a1a1a] border border-white/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl rounded-bl-none text-xs sm:text-sm text-gray-300 max-w-[200px] sm:max-w-sm break-words">
                              {msg.decryptedContent}
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-gray-600 block pl-1">
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="w-full border-t border-white/10 bg-black/20 p-2 backdrop-blur-md sm:p-4">
                <div className="flex items-center gap-1 sm:gap-3 bg-[#0a0a0a] border border-white/10 rounded-full px-1.5 sm:px-2 py-1.5 sm:py-2">
                  <button className="p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white shrink-0 rounded-full sm:p-2">
                    <Paperclip size={16} sm={18} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white text-xs sm:text-sm placeholder:text-gray-600 min-w-0"
                  />
                  <button className="p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white shrink-0 rounded-full sm:p-2">
                    <Mic size={16} sm={18} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-white p-1.5 text-black transition-all transform hover:scale-105 hover:bg-fuchsia-400 hover:text-white hover:shadow-[0_0_15px_rgba(192,38,211,0.5)] shrink-0 rounded-full disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none sm:p-2"
                  >
                    <Send size={16} sm={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle size={64} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Conversation Selected</h3>
                <p className="text-gray-400 text-sm">Select a conversation from the list or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesView;

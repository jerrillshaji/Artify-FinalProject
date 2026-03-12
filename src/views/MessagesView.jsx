import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MessageCircle, MoreHorizontal, Paperclip, Mic, Send, Phone, Video, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import BackButton from '../components/layout/BackButton';

const CONVERSATION_FETCH_LIMIT = 100;
const MESSAGE_FETCH_LIMIT = 200;
const BOOKING_ACTION_PREFIX = '__BOOKING_ACTION__::';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const generateKey = async (userId1, userId2) => {
  const keyString = [userId1, userId2].sort().join('-');
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const encryptMessage = async (message, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(message));
  const encryptedArray = Array.from(new Uint8Array(encrypted));
  return JSON.stringify({ iv: Array.from(iv), data: encryptedArray });
};

const decryptMessage = async (encryptedJson, key) => {
  try {
    const { iv, data } = JSON.parse(encryptedJson);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(data));
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Unable to decrypt message]';
  }
};

const parseBookingActionPayload = (text) => {
  if (!text || !text.startsWith(BOOKING_ACTION_PREFIX)) return null;
  const parts = text.split('::');
  if (parts.length < 7) return null;

  return {
    bookingId: parts[1],
    source: parts[2],
    title: parts[3],
    location: parts[4],
    amount: Number(parts[5] || 0),
    eventDate: parts[6],
    note: parts.slice(7).join('::') || null,
  };
};

const MessagesView = () => {
  const { supabase, user } = useSupabase();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [bookingRecords, setBookingRecords] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationError, setConversationError] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);
  const isTyping = false;

  const scrollMessagesToBottom = useCallback((behavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 80;
  }, []);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      scrollMessagesToBottom();
    }
  }, [messages, scrollMessagesToBottom]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
    scrollMessagesToBottom();
  }, [selectedConversation?.id, scrollMessagesToBottom]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      setConversationError('');

      const messageColumns = 'id,sender_id,receiver_id,content,is_read,created_at';
      const [sentResult, receivedResult] = await Promise.all([
        supabase.from('messages').select(messageColumns).eq('sender_id', user.id).order('created_at', { ascending: false }).limit(CONVERSATION_FETCH_LIMIT),
        supabase.from('messages').select(messageColumns).eq('receiver_id', user.id).order('created_at', { ascending: false }).limit(CONVERSATION_FETCH_LIMIT),
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
            unreadCount: 0,
          });
        }

        if (msg.receiver_id === user.id && !msg.is_read) {
          conversationMap.get(otherUserId).unreadCount += 1;
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
      setConversationError('Could not load conversations right now.');
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  const loadMessages = useCallback(async () => {
    if (!user || !selectedConversation) return;

    try {
      const key = await generateKey(user.id, selectedConversation.id);
      const [sentResult, receivedResult] = await Promise.all([
        supabase.from('messages').select('*').eq('sender_id', user.id).eq('receiver_id', selectedConversation.id).order('created_at', { ascending: false }).limit(MESSAGE_FETCH_LIMIT),
        supabase.from('messages').select('*').eq('sender_id', selectedConversation.id).eq('receiver_id', user.id).order('created_at', { ascending: false }).limit(MESSAGE_FETCH_LIMIT),
      ]);

      if (sentResult.error) throw sentResult.error;
      if (receivedResult.error) throw receivedResult.error;

      const mergedMessages = [...(sentResult.data || []), ...(receivedResult.data || [])]
        .sort((left, right) => new Date(left.created_at) - new Date(right.created_at))
        .slice(-MESSAGE_FETCH_LIMIT);

      const decryptedMessages = await Promise.all(
        mergedMessages.map(async (msg) => {
          const decryptedContent = await decryptMessage(msg.content, key);
          return {
            ...msg,
            decryptedContent,
            bookingAction: parseBookingActionPayload(decryptedContent),
          };
        })
      );

      setMessages(decryptedMessages);

      const bookingIds = decryptedMessages
        .map((msg) => msg.bookingAction?.bookingId)
        .filter((value, index, arr) => value && arr.indexOf(value) === index);

      if (bookingIds.length > 0) {
        const { data: bookingRows, error: bookingError } = await supabase
          .from('bookings')
          .select('id,artist_id,organizer_id,status,offer_amount,event_date,events(title,location,venue_name)')
          .in('id', bookingIds);

        if (!bookingError) {
          const map = (bookingRows || []).reduce((acc, row) => {
            acc[row.id] = row;
            return acc;
          }, {});
          setBookingRecords(map);
        }
      } else {
        setBookingRecords({});
      }

      await supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', selectedConversation.id).eq('is_read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [selectedConversation, supabase, user]);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const isRelevant = payload.new.sender_id === user.id || payload.new.receiver_id === user.id;
        if (isRelevant) loadConversations();

        if (selectedConversation && (payload.new.sender_id === selectedConversation.id || payload.new.receiver_id === selectedConversation.id)) {
          loadMessages();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations, loadMessages, selectedConversation, supabase, user]);

  useEffect(() => {
    if (selectedConversation) loadMessages();
  }, [loadMessages, selectedConversation]);

  useEffect(() => {
    if (!targetUserId || !user || loading) return;

    const existing = conversations.find((conversation) => conversation.id === targetUserId);
    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    const openNewConversation = async () => {
      const { data: profileData } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', targetUserId).maybeSingle();
      if (profileData) {
        setSelectedConversation({ id: profileData.id, user: profileData, lastMessage: null, unreadCount: 0 });
      }
    };

    openNewConversation();
  }, [targetUserId, conversations, loading, supabase, user]);

  const sendEncryptedText = async (receiverId, text) => {
    const key = await generateKey(user.id, receiverId);
    const encryptedContent = await encryptMessage(text, key);
    const { error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: receiverId, content: encryptedContent, is_read: false });
    if (error) throw error;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return;

    setSending(true);
    try {
      await sendEncryptedText(selectedConversation.id, newMessage.trim());
      setNewMessage('');
      loadConversations();
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleBookingDecision = async (message, status) => {
    if (!message?.bookingAction?.bookingId || !user || updatingBookingId) return;

    const bookingId = message.bookingAction.bookingId;
    const booking = bookingRecords[bookingId];
    if (!booking || booking.status !== 'pending' || message.receiver_id !== user.id) return;

    setUpdatingBookingId(bookingId);
    try {
      const isArtistResponder = booking.artist_id === user.id;
      const updateQuery = supabase.from('bookings').update({ status }).eq('id', bookingId).eq('status', 'pending');
      const scoped = isArtistResponder ? updateQuery.eq('artist_id', user.id) : updateQuery.eq('organizer_id', user.id);
      const { error } = await scoped;
      if (error) throw error;

      const decisionText = `${status === 'accepted' ? 'Accepted' : 'Declined'} booking for ${booking.events?.title || message.bookingAction.title || 'event'}.`;
      await sendEncryptedText(message.sender_id, decisionText);

      setBookingRecords((prev) => ({
        ...prev,
        [bookingId]: { ...prev[bookingId], status },
      }));
      loadMessages();
    } catch (error) {
      console.error('Error updating booking status from chat:', error);
      alert(error.message || 'Could not update booking status.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 md:h-[calc(100dvh-9rem)]">
      <div className={`mb-4 items-center sm:mb-6 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <BackButton />
      </div>

      <div className="grid flex-1 min-h-0 gap-4 sm:gap-6 md:grid-cols-3">
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl sm:h-[calc(100dvh-12rem)] sm:rounded-3xl md:col-span-1 md:h-full md:min-h-0`}>
          <div className="border-b border-white/10 p-4 sm:p-6">
            <h2 className="mb-3 text-lg font-black text-white sm:mb-4 sm:text-xl">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search chats..."
                className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-xs text-white transition-colors focus:border-fuchsia-500/50 focus:outline-none sm:rounded-xl sm:pl-10 sm:pr-4 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2 sm:space-y-2 sm:p-4">
            {conversationError ? <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 sm:text-sm">{conversationError}</div> : null}

            {conversations
              .filter((conversation) => conversation.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`flex cursor-pointer gap-2 rounded-xl border p-3 transition-all sm:gap-4 sm:rounded-2xl sm:p-4 ${selectedConversation?.id === conversation.id ? 'border-white/5 bg-white/10' : 'border-transparent hover:bg-white/5'}`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conversation.user?.avatar_url || `https://i.pravatar.cc/150?u=${conversation.id}`}
                      className="h-10 w-10 rounded-full border border-white/10 object-cover sm:h-12 sm:w-12"
                      alt={conversation.user?.full_name}
                    />
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#1a1a1a] bg-green-500 sm:h-3 sm:w-3"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-start justify-between sm:mb-1">
                      <h4 className="truncate text-sm font-bold text-white sm:text-base">{conversation.user?.full_name || 'Unknown User'}</h4>
                      <span className="shrink-0 text-[9px] font-medium text-gray-500 sm:text-[10px]">{formatTime(conversation.lastMessage?.created_at)}</span>
                    </div>
                    <p className="truncate text-xs text-gray-400 sm:text-sm">{conversation.lastMessage?.sender_id === user.id ? 'You: ' : ''}{conversation.lastMessage?.content ? 'Message' : 'No messages yet'}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} h-[calc(100dvh-11rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl sm:h-[calc(100dvh-12rem)] sm:rounded-3xl md:col-span-2 md:h-full`}>
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <img
                    src={selectedConversation.user?.avatar_url || `https://i.pravatar.cc/150?u=${selectedConversation.id}`}
                    className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover sm:h-10 sm:w-10"
                    alt={selectedConversation.user?.full_name}
                  />
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 truncate text-sm font-bold text-white sm:text-base">
                      <span className="truncate">{selectedConversation.user?.full_name || 'Unknown User'}</span>
                      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500"></span>
                    </h3>
                    <p className="text-xs text-gray-400">{isTyping ? 'Typing...' : 'Online'}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 sm:gap-2">
                  <button className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"><Phone size={16} /></button>
                  <button className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"><Video size={16} /></button>
                  <button className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"><MoreHorizontal size={16} /></button>
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
                    aria-label="Close conversation"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3 sm:space-y-4 sm:p-4 md:p-6"
              >
                {messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user.id;
                  const booking = msg.bookingAction ? bookingRecords[msg.bookingAction.bookingId] : null;
                  const canRespondToBooking = Boolean(
                    msg.bookingAction &&
                    msg.receiver_id === user.id &&
                    booking &&
                    booking.status === 'pending' &&
                    (booking.artist_id === user.id || booking.organizer_id === user.id)
                  );
                  const showDate = index === 0 || new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate ? (
                        <div className="flex justify-center">
                          <span className="rounded-full bg-black/20 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-gray-600 sm:px-3 sm:text-[10px]">
                            {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      ) : null}

                      <div className={`flex gap-2 sm:gap-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn ? (
                          <img
                            src={selectedConversation.user?.avatar_url || `https://i.pravatar.cc/150?u=${selectedConversation.id}`}
                            className="mb-1 h-7 w-7 shrink-0 self-end rounded-full object-cover sm:h-8 sm:w-8"
                            alt={selectedConversation.user?.full_name}
                          />
                        ) : null}

                        {isOwn ? (
                          <div className="flex max-w-[calc(100%-2rem)] flex-col items-end space-y-1">
                            <div className="max-w-[240px] break-words rounded-xl rounded-br-none bg-gradient-to-tr from-fuchsia-600 to-purple-600 p-2 text-xs text-white shadow-[0_0_15px_rgba(192,38,211,0.3)] sm:max-w-sm sm:rounded-2xl sm:p-3 sm:text-sm">
                              {msg.bookingAction ? (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/80">Booking Request</p>
                                  <p className="mt-1 font-semibold text-white">{booking?.events?.title || msg.bookingAction.title || 'Event Offer'}</p>
                                  <p className="mt-1 text-[11px] text-fuchsia-100/90">{booking?.events?.location || msg.bookingAction.location || 'Location TBD'}</p>
                                  <p className="mt-1 text-[11px] text-fuchsia-100/90">${Number(booking?.offer_amount ?? msg.bookingAction.amount ?? 0).toLocaleString()} • {new Date(booking?.event_date || msg.bookingAction.eventDate || Date.now()).toLocaleString()}</p>
                                  {booking ? <p className="mt-2 text-[10px] uppercase tracking-wider text-fuchsia-200">Status: {booking.status}</p> : null}
                                  {msg.bookingAction.note ? <p className="mt-2 text-[11px] text-fuchsia-100">{msg.bookingAction.note}</p> : null}
                                </div>
                              ) : msg.decryptedContent}
                            </div>
                            <span className="block pr-1 text-[9px] text-gray-600 sm:text-[10px]">{formatTime(msg.created_at)}</span>
                          </div>
                        ) : (
                          <div className="min-w-0 space-y-1">
                            <div className="max-w-[240px] break-words rounded-xl rounded-bl-none border border-white/10 bg-[#1a1a1a] p-2 text-xs text-gray-300 sm:max-w-sm sm:rounded-2xl sm:p-3 sm:text-sm">
                              {msg.bookingAction ? (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">Booking Request</p>
                                  <p className="mt-1 font-semibold text-white">{booking?.events?.title || msg.bookingAction.title || 'Event Offer'}</p>
                                  <p className="mt-1 text-[11px] text-gray-400">{booking?.events?.location || msg.bookingAction.location || 'Location TBD'}</p>
                                  <p className="mt-1 text-[11px] text-gray-400">${Number(booking?.offer_amount ?? msg.bookingAction.amount ?? 0).toLocaleString()} • {new Date(booking?.event_date || msg.bookingAction.eventDate || Date.now()).toLocaleString()}</p>
                                  {booking ? <p className="mt-2 text-[10px] uppercase tracking-wider text-gray-500">Status: {booking.status}</p> : null}
                                  {msg.bookingAction.note ? <p className="mt-2 text-[11px] text-gray-300">{msg.bookingAction.note}</p> : null}

                                  {canRespondToBooking ? (
                                    <div className="mt-3 flex gap-2">
                                      <button
                                        onClick={() => handleBookingDecision(msg, 'declined')}
                                        disabled={updatingBookingId === msg.bookingAction.bookingId}
                                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-semibold text-gray-300 hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
                                      >
                                        Decline
                                      </button>
                                      <button
                                        onClick={() => handleBookingDecision(msg, 'accepted')}
                                        disabled={updatingBookingId === msg.bookingAction.bookingId}
                                        className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-black hover:bg-fuchsia-400 hover:text-white disabled:opacity-50"
                                      >
                                        Accept
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              ) : msg.decryptedContent}
                            </div>
                            <span className="block pl-1 text-[9px] text-gray-600 sm:text-[10px]">{formatTime(msg.created_at)}</span>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="w-full border-t border-white/10 bg-black/20 p-2 backdrop-blur-md sm:p-4">
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0a0a0a] px-1.5 py-1.5 transition-colors focus-within:border-fuchsia-400/70 sm:gap-3 sm:px-2 sm:py-2">
                  <button className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"><Paperclip size={16} /></button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 border-none bg-transparent text-xs text-white placeholder:text-gray-600 outline-none ring-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                  />
                  <button className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white sm:p-2"><Mic size={16} /></button>
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="shrink-0 rounded-full bg-white p-1.5 text-black transition-all hover:scale-105 hover:bg-fuchsia-400 hover:text-white hover:shadow-[0_0_15px_rgba(192,38,211,0.5)] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none sm:p-2"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto mb-4 text-gray-600" />
                <h3 className="mb-2 text-xl font-bold text-white">No Conversation Selected</h3>
                <p className="text-sm text-gray-400">Select a conversation from the list or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesView;


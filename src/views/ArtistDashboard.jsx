import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, List, DollarSign, Zap, TrendingUp, Star, MapPin, MessageCircle, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const encoder = new TextEncoder();

const generateKey = async (userId1, userId2) => {
  const keyString = [userId1, userId2].sort().join('-');
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['encrypt']);
};

const encryptMessage = async (message, key) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(message));
  const encryptedArray = Array.from(new Uint8Array(encrypted));
  return JSON.stringify({ iv: Array.from(iv), data: encryptedArray });
};

const createBookingChatPayload = ({ bookingId, title, location, amount, eventDate, source }) => {
  return `__BOOKING_ACTION__::${bookingId}::${source}::${title || 'Gig Request'}::${location || 'TBD'}::${amount || 0}::${eventDate || ''}`;
};

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { supabase, user } = useSupabase();
  const [viewMode, setViewMode] = useState('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [bookings, setBookings] = useState([]);
  const [openGigs, setOpenGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [applyingEventId, setApplyingEventId] = useState(null);

  const loadBookings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id,event_id,artist_id,organizer_id,status,offer_amount,message,event_date,created_at,events(title,location,venue_name,city,country,event_date,end_date)')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const organizerIds = [...new Set((bookingsData || []).map((item) => item.organizer_id))];
      let organizerMap = new Map();

      if (organizerIds.length > 0) {
        const { data: organizersData, error: organizersError } = await supabase
          .from('profiles')
          .select('id,full_name,username,avatar_url')
          .in('id', organizerIds);

        if (organizersError) throw organizersError;
        organizerMap = new Map((organizersData || []).map((item) => [item.id, item]));
      }

      const enrichedBookings = (bookingsData || []).map((booking) => ({
        ...booking,
        organizer: organizerMap.get(booking.organizer_id) || null,
      }));
      setBookings(enrichedBookings);

      const bookedEventIds = new Set((bookingsData || []).map((item) => item.event_id));

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id,organizer_id,title,description,event_date,end_date,location,venue_name,city,country,budget_min,budget_max,status')
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (eventError) throw eventError;

      const openEvents = (eventData || []).filter((eventItem) => {
        const isFuture = new Date(eventItem.event_date) > new Date();
        return isFuture && !bookedEventIds.has(eventItem.id);
      });

      const openOrganizerIds = [...new Set(openEvents.map((eventItem) => eventItem.organizer_id))];
      let openOrganizerMap = organizerMap;

      if (openOrganizerIds.length > 0) {
        const missingIds = openOrganizerIds.filter((id) => !openOrganizerMap.has(id));
        if (missingIds.length > 0) {
          const { data: openOrgProfiles, error: openOrgError } = await supabase
            .from('profiles')
            .select('id,full_name,username,avatar_url')
            .in('id', missingIds);

          if (openOrgError) throw openOrgError;

          const merge = new Map(openOrganizerMap);
          (openOrgProfiles || []).forEach((profile) => merge.set(profile.id, profile));
          openOrganizerMap = merge;
        }
      }

      setOpenGigs(openEvents.map((eventItem) => ({ ...eventItem, organizer: openOrganizerMap.get(eventItem.organizer_id) || null })));
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
      setOpenGigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [supabase, user?.id]);

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((item) => item.status === 'pending').length;
    const accepted = bookings.filter((item) => item.status === 'accepted').length;
    const totalValue = bookings.reduce((sum, item) => sum + Number(item.offer_amount || 0), 0);
    const upcoming = bookings.filter((item) => item.status === 'accepted' && new Date(item.event_date) > new Date()).length;

    return [
      { label: 'Revenue Potential', value: `$${Math.round(totalValue).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', trend: 'All offers' },
      { label: 'Pending', value: String(pending).padStart(2, '0'), icon: Zap, color: 'text-yellow-400', trend: 'Awaiting action' },
      { label: 'Upcoming', value: String(upcoming).padStart(2, '0'), icon: TrendingUp, color: 'text-fuchsia-400', trend: 'Future gigs' },
      { label: 'Accepted', value: String(accepted).padStart(2, '0'), icon: Star, color: 'text-cyan-400', trend: 'Confirmed' },
    ];
  }, [bookings]);

  const handleBookingStatus = async (bookingId, status) => {
    setUpdatingId(bookingId);
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).eq('artist_id', user.id);
      if (error) throw error;

      setBookings((prev) => prev.map((item) => (item.id === bookingId ? { ...item, status } : item)));
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert(error.message || 'Could not update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyToGig = async (gig) => {
    if (!user?.id || applyingEventId) return;

    setApplyingEventId(gig.id);
    try {
      const amount = Number(gig.budget_max || gig.budget_min || 1);
      const { data: insertedBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          event_id: gig.id,
          artist_id: user.id,
          organizer_id: gig.organizer_id,
          status: 'pending',
          offer_amount: amount > 0 ? amount : 1,
          message: 'Artist requested this gig from open listings.',
          event_date: gig.event_date,
        })
        .select('id,event_date,offer_amount')
        .single();

      if (bookingError) throw bookingError;

      const key = await generateKey(user.id, gig.organizer_id);
      const payload = createBookingChatPayload({
        bookingId: insertedBooking.id,
        title: gig.title,
        location: gig.location,
        amount: insertedBooking.offer_amount,
        eventDate: insertedBooking.event_date,
        source: 'artist_request',
      });
      const encryptedContent = await encryptMessage(`${payload}::Artist requested to perform this gig.`, key);

      const { error: messageError } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: gig.organizer_id,
        content: encryptedContent,
        is_read: false,
      });

      if (messageError) throw messageError;

      await loadBookings();
    } catch (error) {
      console.error('Error applying to gig:', error);
      alert(error.message || 'Could not send gig request.');
    } finally {
      setApplyingEventId(null);
    }
  };

  const grouped = useMemo(() => {
    if (viewMode === 'calendar') {
      return bookings.filter((item) => item.status === 'accepted').sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }
    return bookings;
  }, [bookings, viewMode]);

  const acceptedByDay = useMemo(() => {
    return grouped.reduce((acc, item) => {
      const date = new Date(item.event_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [grouped]);

  const calendarDays = useMemo(() => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startWeekday = start.getDay();
    const daysInMonth = end.getDate();
    const days = [];

    for (let i = 0; i < startWeekday; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, key, events: acceptedByDay[key] || [] });
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [acceptedByDay, calendarMonth]);

  const selectedDateEvents = acceptedByDay[selectedDateKey] || [];

  const changeCalendarMonth = (offset) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-4 pb-12 sm:space-y-6 md:space-y-8">
      <div className="mb-4 flex items-center sm:mb-6">
        <BackButton />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Command Center</h1>
          <p className="text-sm text-gray-400 sm:text-base">Review direct offers, browse open gigs, and manage your booking calendar.</p>
        </div>
        <div className="flex w-fit self-start rounded-full border border-white/10 bg-white/5 p-1">
          <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all sm:gap-2 sm:px-5 sm:py-2 sm:text-sm ${viewMode === 'list' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'text-gray-400 hover:text-white'}`}><List size={14} /><span className="hidden sm:inline">List</span></button>
          <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all sm:gap-2 sm:px-5 sm:py-2 sm:text-sm ${viewMode === 'calendar' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'text-gray-400 hover:text-white'}`}><Calendar size={14} /><span className="hidden sm:inline">Calendar</span></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {bookingStats.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur-md transition-colors hover:bg-white/10 sm:rounded-3xl sm:p-4 md:p-6">
            <div className={`absolute right-0 top-0 p-2 opacity-20 transition-opacity duration-500 group-hover:scale-110 group-hover:opacity-100 sm:p-4 ${stat.color}`}><stat.icon size={32} /></div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 sm:mb-2 sm:text-xs">{stat.label}</p>
            <p className="mb-0.5 text-2xl font-black text-white sm:mb-1 sm:text-3xl">{stat.value}</p>
            <p className={`text-[10px] font-medium sm:text-xs ${stat.color}`}>{stat.trend}</p>
          </div>
        ))}
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/5 p-3 sm:p-4 md:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg"><div className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-500 sm:h-2 sm:w-2"></div><span className="hidden sm:inline">Incoming Bookings</span><span className="sm:hidden">Bookings</span></h2>
              <Badge color="gray">{bookings.filter((item) => item.status === 'pending').length} Pending</Badge>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse bg-black/20"></div>) : grouped.length > 0 ? grouped.map((req) => (
                <div key={req.id} className="group flex flex-col gap-3 p-3 transition-colors hover:bg-white/5 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
                  <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-gray-800 to-black text-white shadow-inner sm:h-14 sm:w-14 sm:rounded-xl md:h-16 md:w-16 md:rounded-2xl">
                      <span className="text-[8px] font-bold uppercase text-gray-400 sm:text-[10px]">{new Date(req.event_date).toLocaleString([], { month: 'short' })}</span>
                      <span className="text-base font-black sm:text-xl">{new Date(req.event_date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="truncate text-base font-bold text-white transition-colors group-hover:text-fuchsia-400 sm:text-lg">{req.events?.title || 'Event Offer'}</h3>
                        <span className={`flex-shrink-0 rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${req.status === 'accepted' ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300' : req.status === 'declined' ? 'border-red-500/30 bg-red-500/20 text-red-300' : 'border-white/5 bg-white/10 text-gray-300'}`}>{req.status}</span>
                      </div>
                      <p className="mb-2 text-xs text-gray-400 sm:text-sm">{req.organizer?.full_name || req.organizer?.username || 'Organizer'}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-500 sm:gap-4 sm:text-xs">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {req.events?.location || 'Location TBD'}</span>
                        <span className="flex items-center gap-1 text-emerald-400"><DollarSign size={10} /> ${Number(req.offer_amount || 0).toLocaleString()}</span>
                        <span>{new Date(req.event_date).toLocaleString()}</span>
                      </div>
                      {req.message ? <p className="mt-2 line-clamp-2 text-xs text-gray-400">"{req.message}"</p> : null}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <button onClick={() => handleBookingStatus(req.id, 'declined')} disabled={updatingId === req.id || req.status !== 'pending'} className="flex-shrink-0 rounded-lg border border-white/5 bg-white/5 p-2 text-gray-400 transition-all hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 sm:rounded-xl sm:p-3"><X size={16} /></button>
                    <button onClick={() => navigate(`/messages?userId=${req.organizer_id}`)} className="flex-shrink-0 rounded-lg border border-white/5 bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white sm:rounded-xl sm:p-3"><MessageCircle size={16} /></button>
                    <button onClick={() => handleBookingStatus(req.id, 'accepted')} disabled={updatingId === req.id || req.status !== 'pending'} className="flex-shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition-all hover:bg-fuchsia-400 hover:text-white hover:shadow-[0_0_20px_rgba(192,38,211,0.5)] disabled:opacity-50 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"><span className="inline-flex items-center gap-1"><Check size={14} /> Accept</span></button>
                  </div>
                </div>
              )) : <div className="p-10 text-center text-gray-400">No booking offers yet.</div>}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/5 p-3 sm:p-4 md:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg"><div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500 sm:h-2 sm:w-2"></div><span className="hidden sm:inline">Open Gigs</span><span className="sm:hidden">Gigs</span></h2>
              <Badge color="gray">{openGigs.length} Open</Badge>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? [1, 2].map((item) => <div key={item} className="h-24 animate-pulse bg-black/20"></div>) : openGigs.length > 0 ? openGigs.map((gig) => (
                <div key={gig.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <h3 className="text-base font-bold text-white sm:text-lg">{gig.title}</h3>
                    <p className="mt-1 text-xs text-gray-400 sm:text-sm">{new Date(gig.event_date).toLocaleString()} • {gig.location}</p>
                    <p className="mt-1 text-xs text-gray-500">{gig.organizer?.full_name || gig.organizer?.username || 'Organizer'} • ${Number(gig.budget_max || gig.budget_min || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/messages?userId=${gig.organizer_id}`)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 hover:text-white sm:text-sm">Message</button>
                    <button onClick={() => handleApplyToGig(gig)} disabled={applyingEventId === gig.id} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-black hover:bg-cyan-400 hover:text-white disabled:opacity-50 sm:text-sm">{applyingEventId === gig.id ? 'Sending...' : 'Request Gig'}</button>
                  </div>
                </div>
              )) : <div className="p-10 text-center text-gray-400">No open gigs available right now.</div>}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl sm:rounded-3xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Booking Calendar</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => changeCalendarMonth(-1)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white">Prev</button>
              <p className="text-sm font-semibold text-gray-300">{calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
              <button onClick={() => changeCalendarMonth(1)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white">Next</button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="h-16 rounded-xl border border-transparent bg-transparent sm:h-20" />;
              }

              const isSelected = selectedDateKey === cell.key;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.key)}
                  className={`h-16 rounded-xl border p-2 text-left transition-all sm:h-20 ${isSelected ? 'border-fuchsia-400/60 bg-fuchsia-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <p className="text-xs font-bold text-white">{cell.day}</p>
                  {cell.events.length > 0 ? <p className="mt-2 text-[10px] font-semibold text-emerald-300">{cell.events.length} event{cell.events.length > 1 ? 's' : ''}</p> : <p className="mt-2 text-[10px] text-gray-600">No events</p>}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-semibold text-gray-300">{new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
            {selectedDateEvents.length > 0 ? (
              <div className="mt-3 space-y-3">
                {selectedDateEvents.map((item) => (
                  <div key={item.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="font-bold text-white">{item.events?.title || 'Event Offer'}</p>
                    <p className="mt-1 text-xs text-gray-300">{new Date(item.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.events?.location || 'Location TBD'}</p>
                    <p className="mt-1 text-xs text-emerald-300">Confirmed for ${Number(item.offer_amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">No booked events on this day.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;


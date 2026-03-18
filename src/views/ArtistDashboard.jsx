import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, List, IndianRupee, Zap, TrendingUp, Star, MapPin, MessageCircle, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';
import { formatINR } from '../lib/currency';
import { geocodeLocation, haversineDistance } from '../lib/geocoding';

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

const createPaymentChatPayload = ({ bookingId, title, location, amount, eventDate, source }) => {
  return `__PAYMENT_ACTION__::${bookingId}::${source}::${title || 'Payment Request'}::${location || 'TBD'}::${amount || 0}::${eventDate || ''}`;
};

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { supabase, user, profile: currentProfile } = useSupabase();
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
  const [activeStatKey, setActiveStatKey] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [applyingEventId, setApplyingEventId] = useState(null);
  const [requestingPaymentId, setRequestingPaymentId] = useState(null);
  const [requestSort, setRequestSort] = useState('recent');
  const [locationCoordsCache, setLocationCoordsCache] = useState({});
  const [distanceByBookingId, setDistanceByBookingId] = useState({});

  const loadBookings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id,event_id,artist_id,organizer_id,status,payment_status,paid_at,offer_amount,message,event_date,created_at,events(title,location,venue_name,city,country,event_date,end_date,visibility,status)')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const organizerIds = [...new Set((bookingsData || []).map((item) => item.organizer_id))];
      let organizerMap = new Map();

      if (organizerIds.length > 0) {
        const { data: organizersData, error: organizersError } = await supabase
          .from('profiles')
          .select('id,full_name,username,avatar_url,latitude,longitude')
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
        .select('id,organizer_id,title,description,event_date,end_date,location,venue_name,city,country,budget_min,budget_max,status,visibility')
        .eq('visibility', 'public')
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
            .select('id,full_name,username,avatar_url,latitude,longitude')
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

  useEffect(() => {
    let cancelled = false;

    const computeDistances = async () => {
      const artistLat = currentProfile?.latitude;
      const artistLng = currentProfile?.longitude;

      if (artistLat == null || artistLng == null || bookings.length === 0) {
        setDistanceByBookingId({});
        return;
      }

      const locationTexts = [...new Set(bookings
        .map((item) => (item.events?.location || item.events?.venue_name || item.events?.city || '').trim())
        .filter(Boolean))];

      const missingLocations = locationTexts.filter((text) => locationCoordsCache[text] === undefined);

      if (missingLocations.length > 0) {
        const resolvedEntries = await Promise.all(
          missingLocations.map(async (text) => {
            const coords = await geocodeLocation(text);
            return [text, coords];
          })
        );

        if (!cancelled) {
          setLocationCoordsCache((prev) => {
            const merged = { ...prev };
            resolvedEntries.forEach(([text, coords]) => {
              merged[text] = coords;
            });
            return merged;
          });
        }
      }

      const nextDistanceByBookingId = {};
      bookings.forEach((item) => {
        const organizerLat = item.organizer?.latitude;
        const organizerLng = item.organizer?.longitude;

        if (organizerLat != null && organizerLng != null) {
          nextDistanceByBookingId[item.id] = haversineDistance(artistLat, artistLng, organizerLat, organizerLng);
          return;
        }

        const locationText = (item.events?.location || item.events?.venue_name || item.events?.city || '').trim();
        const fallbackCoords = locationText ? locationCoordsCache[locationText] : null;

        if (fallbackCoords?.lat != null && fallbackCoords?.lng != null) {
          nextDistanceByBookingId[item.id] = haversineDistance(artistLat, artistLng, fallbackCoords.lat, fallbackCoords.lng);
          return;
        }

        nextDistanceByBookingId[item.id] = null;
      });

      if (!cancelled) {
        setDistanceByBookingId(nextDistanceByBookingId);
      }
    };

    computeDistances();

    return () => {
      cancelled = true;
    };
  }, [bookings, currentProfile?.latitude, currentProfile?.longitude, locationCoordsCache]);

  const bookingStats = useMemo(() => {
    const pending = bookings.filter((item) => item.status === 'pending').length;
    const accepted = bookings.filter((item) => item.status === 'accepted').length;
    const acceptedBookings = bookings.filter((item) => item.status === 'accepted');
    const totalValue = acceptedBookings.reduce((sum, item) => sum + Number(item.offer_amount || 0), 0);
    const paidValue = acceptedBookings
      .filter((item) => item.payment_status === 'paid')
      .reduce((sum, item) => sum + Number(item.offer_amount || 0), 0);
    const dueValue = acceptedBookings
      .filter((item) => item.payment_status !== 'paid')
      .reduce((sum, item) => sum + Number(item.offer_amount || 0), 0);
    const upcoming = bookings.filter((item) => item.status === 'accepted' && new Date(item.event_date) > new Date()).length;

    return [
      { key: 'revenue', label: 'Payment Due', value: formatINR(Math.round(dueValue)), icon: IndianRupee, color: 'text-emerald-400', trend: `${formatINR(Math.round(paidValue))} paid` },
      { key: 'pending', label: 'Pending', value: String(pending).padStart(2, '0'), icon: Zap, color: 'text-yellow-400', trend: 'Awaiting action' },
      { key: 'upcoming', label: 'Upcoming', value: String(upcoming).padStart(2, '0'), icon: TrendingUp, color: 'text-fuchsia-400', trend: 'Future gigs' },
      { key: 'accepted', label: 'Accepted', value: String(accepted).padStart(2, '0'), icon: Star, color: 'text-cyan-400', trend: `${acceptedBookings.filter((item) => item.payment_status === 'paid').length} paid` },
    ];
  }, [bookings]);

  const statDetail = useMemo(() => {
    const now = new Date();

    const mapBookingItem = (item) => ({
      id: item.id,
      eventId: item.event_id,
      primary: item.events?.title || 'Event Offer',
      secondary: `${item.organizer?.full_name || item.organizer?.username || 'Organizer'} • ${new Date(item.event_date).toLocaleString()}`,
      amount: formatINR(item.offer_amount || 0),
      status: item.status,
    });

    if (activeStatKey === 'revenue') {
      return {
        title: 'Revenue Potential Details',
        items: bookings.map(mapBookingItem),
      };
    }

    if (activeStatKey === 'pending') {
      return {
        title: 'Pending Offer Details',
        items: bookings.filter((item) => item.status === 'pending').map(mapBookingItem),
      };
    }

    if (activeStatKey === 'upcoming') {
      return {
        title: 'Upcoming Show Details',
        items: bookings
          .filter((item) => item.status === 'accepted' && new Date(item.event_date) > now)
          .map(mapBookingItem),
      };
    }

    if (activeStatKey === 'accepted') {
      return {
        title: 'Accepted Offer Details',
        items: bookings.filter((item) => item.status === 'accepted').map(mapBookingItem),
      };
    }

    return { title: '', items: [] };
  }, [activeStatKey, bookings]);

  const selectedShowDetail = useMemo(() => {
    if (!selectedShowId) return null;

    const matchingBookings = bookings.filter((item) => item.event_id === selectedShowId);
    const primaryBooking = matchingBookings[0] || null;
    const openGig = openGigs.find((item) => item.id === selectedShowId) || null;

    if (!primaryBooking && !openGig) return null;

    const organizer = primaryBooking?.organizer || openGig?.organizer || null;
    const title = primaryBooking?.events?.title || openGig?.title || 'Event Offer';
    const location = primaryBooking?.events?.venue_name || primaryBooking?.events?.location || openGig?.venue_name || openGig?.location || 'Location TBD';
    const dateValue = primaryBooking?.event_date || openGig?.event_date || null;
    const budgetValue = primaryBooking?.offer_amount || openGig?.budget_max || openGig?.budget_min || 0;

    return {
      eventId: selectedShowId,
      title,
      location,
      dateValue,
      budgetValue,
      status: primaryBooking?.status || openGig?.status || 'unknown',
      organizer,
      pendingCount: matchingBookings.filter((item) => item.status === 'pending').length,
      acceptedCount: matchingBookings.filter((item) => item.status === 'accepted').length,
      declinedCount: matchingBookings.filter((item) => item.status === 'declined').length,
    };
  }, [bookings, openGigs, selectedShowId]);

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

  const handleRequestPayment = async (booking) => {
    if (!booking?.id || !user?.id || requestingPaymentId) return;

    setRequestingPaymentId(booking.id);
    try {
      const key = await generateKey(user.id, booking.organizer_id);
      const payload = createPaymentChatPayload({
        bookingId: booking.id,
        title: booking.events?.title,
        location: booking.events?.location,
        amount: booking.offer_amount,
        eventDate: booking.event_date,
        source: 'artist_payment_request',
      });
      const encryptedContent = await encryptMessage(`${payload}::Artist requested payment for this completed event.`, key);

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: booking.organizer_id,
        content: encryptedContent,
        is_read: false,
      });

      if (error) throw error;
      alert('Payment request sent to manager.');
    } catch (error) {
      console.error('Error requesting payment:', error);
      alert(error.message || 'Could not send payment request.');
    } finally {
      setRequestingPaymentId(null);
    }
  };

  const grouped = useMemo(() => {
    if (viewMode === 'calendar') {
      return bookings.filter((item) => item.status === 'accepted').sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }

    const getDistanceFromArtistKm = (item) => {
      const cachedDistance = distanceByBookingId[item.id];
      if (typeof cachedDistance === 'number') {
        return cachedDistance;
      }

      const artistLat = currentProfile?.latitude;
      const artistLng = currentProfile?.longitude;
      const organizerLat = item.organizer?.latitude;
      const organizerLng = item.organizer?.longitude;

      if (artistLat == null || artistLng == null || organizerLat == null || organizerLng == null) {
        return null;
      }

      return haversineDistance(artistLat, artistLng, organizerLat, organizerLng);
    };

    const sorted = [...bookings];

    if (requestSort === 'payment_high') {
      sorted.sort((a, b) => Number(b.offer_amount || 0) - Number(a.offer_amount || 0));
      return sorted;
    }

    if (requestSort === 'distance_nearest' || requestSort === 'distance_farthest') {
      sorted.sort((a, b) => {
        const aDistance = getDistanceFromArtistKm(a);
        const bDistance = getDistanceFromArtistKm(b);
        const aValue = aDistance == null ? Number.POSITIVE_INFINITY : aDistance;
        const bValue = bDistance == null ? Number.POSITIVE_INFINITY : bDistance;

        if (requestSort === 'distance_nearest') {
          return aValue - bValue;
        }

        // Farthest first, but still keep unknown distances at the end.
        if (aDistance == null && bDistance == null) return 0;
        if (aDistance == null) return 1;
        if (bDistance == null) return -1;
        return bValue - aValue;
      });
      return sorted;
    }

    // Default keeps latest incoming requests first.
    sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted;
  }, [bookings, currentProfile?.latitude, currentProfile?.longitude, distanceByBookingId, requestSort, viewMode]);

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
        {bookingStats.map((stat) => (
          <button
            key={stat.key}
            type="button"
            onClick={() => {
              setActiveStatKey((prev) => (prev === stat.key ? null : stat.key));
              setSelectedShowId(null);
            }}
            className={`group relative overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-md transition-colors hover:bg-white/10 sm:rounded-3xl sm:p-4 md:p-6 ${activeStatKey === stat.key ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/5'}`}
          >
            <div className={`absolute right-0 top-0 p-2 opacity-20 transition-opacity duration-500 group-hover:scale-110 group-hover:opacity-100 sm:p-4 ${stat.color}`}><stat.icon size={32} /></div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 sm:mb-2 sm:text-xs">{stat.label}</p>
            <p className="mb-0.5 text-2xl font-black text-white sm:mb-1 sm:text-3xl">{stat.value}</p>
            <p className={`text-[10px] font-medium sm:text-xs ${stat.color}`}>{stat.trend}</p>
          </button>
        ))}
      </div>

      {activeStatKey && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-white/5 p-3 sm:p-4 md:p-6">
            <h2 className="text-base font-bold text-white sm:text-lg">{statDetail.title}</h2>
            <button
              type="button"
              onClick={() => {
                setActiveStatKey(null);
                setSelectedShowId(null);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 sm:text-sm"
            >
              Close
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {statDetail.items.length > 0 ? (
              statDetail.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedShowId(item.eventId || null)}
                  className={`flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 ${selectedShowId === item.eventId ? 'bg-white/10' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white sm:text-base">{item.primary}</p>
                    <p className="mt-1 text-xs text-gray-400 sm:text-sm">{item.secondary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">{item.status}</span>
                    <span className="text-sm font-bold text-emerald-300 sm:text-base">{item.amount}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">No details available for this metric yet.</div>
            )}
          </div>

          {selectedShowDetail && (
            <div className="border-t border-white/10 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-white">Show Details</h3>
              <div className="mt-3 grid gap-2 text-sm text-gray-300 sm:grid-cols-2">
                <p><span className="text-gray-500">Title:</span> {selectedShowDetail.title}</p>
                <p><span className="text-gray-500">Status:</span> {selectedShowDetail.status}</p>
                <p><span className="text-gray-500">Date:</span> {selectedShowDetail.dateValue ? new Date(selectedShowDetail.dateValue).toLocaleString() : 'TBD'}</p>
                <p><span className="text-gray-500">Location:</span> {selectedShowDetail.location}</p>
                <p><span className="text-gray-500">Offer/Budget:</span> {formatINR(selectedShowDetail.budgetValue || 0)}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-sm font-bold text-white">Whose Event Is This?</p>
                <p className="mt-2 text-sm text-cyan-100">
                  {selectedShowDetail.organizer?.full_name || selectedShowDetail.organizer?.username || 'Organizer'}
                </p>
                {selectedShowDetail.organizer ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/messages?userId=${selectedShowDetail.organizer.id}`)}
                    className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-white/10 sm:text-sm"
                  >
                    Message Organizer
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/5 p-3 sm:p-4 md:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg"><div className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-500 sm:h-2 sm:w-2"></div><span className="hidden sm:inline">My Invitations And Requests</span><span className="sm:hidden">My Requests</span></h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs" htmlFor="artist-request-sort">
                  Sort
                </label>
                <select
                  id="artist-request-sort"
                  value={requestSort}
                  onChange={(event) => setRequestSort(event.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-semibold text-white outline-none transition-colors hover:border-white/30 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-xs"
                >
                  <option value="recent">Latest</option>
                  <option value="payment_high">Highest Payment</option>
                  <option value="distance_nearest">Nearest Distance</option>
                  <option value="distance_farthest">Farthest Distance</option>
                </select>
                <Badge color="gray">{bookings.filter((item) => item.status === 'pending').length} Pending</Badge>
              </div>
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
                        {req.payment_status === 'paid' ? (
                          <span className="flex-shrink-0 rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-200 sm:text-[10px]">paid</span>
                        ) : null}
                      </div>
                      <p className="mb-2 text-xs text-gray-400 sm:text-sm">{req.organizer?.full_name || req.organizer?.username || 'Organizer'}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-500 sm:gap-4 sm:text-xs">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {req.events?.location || 'Location TBD'}</span>
                        <span className="flex items-center gap-1 text-emerald-400"><IndianRupee size={10} /> {formatINR(req.offer_amount || 0)}</span>
                        <span>{new Date(req.event_date).toLocaleString()}</span>
                      </div>
                      {req.message ? <p className="mt-2 line-clamp-2 text-xs text-gray-400">"{req.message}"</p> : null}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <button onClick={() => handleBookingStatus(req.id, 'declined')} disabled={updatingId === req.id || req.status !== 'pending'} className="flex-shrink-0 rounded-lg border border-white/5 bg-white/5 p-2 text-gray-400 transition-all hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 sm:rounded-xl sm:p-3"><X size={16} /></button>
                    <button onClick={() => navigate(`/messages?userId=${req.organizer_id}`)} className="flex-shrink-0 rounded-lg border border-white/5 bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white sm:rounded-xl sm:p-3"><MessageCircle size={16} /></button>
                    {req.status === 'accepted' ? (
                      <button
                        onClick={() => handleRequestPayment(req)}
                        disabled={requestingPaymentId === req.id || req.payment_status === 'paid'}
                        className="flex-shrink-0 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-500/25 disabled:opacity-60 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
                      >
                        {req.payment_status === 'paid'
                          ? 'Paid'
                          : requestingPaymentId === req.id
                            ? 'Requesting...'
                            : 'Request Payment'}
                      </button>
                    ) : null}
                    {req.events?.visibility === 'public' ? (
                      req.status === 'pending' ? (
                        <span className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-500 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Awaiting Manager</span>
                      ) : null
                    ) : (
                      <button
                        onClick={() => handleBookingStatus(req.id, 'accepted')}
                        disabled={updatingId === req.id || req.status !== 'pending'}
                        className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-all sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm ${
                          req.status === 'accepted'
                            ? 'cursor-default border border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-100'
                            : req.status === 'pending'
                              ? 'bg-white text-black hover:bg-fuchsia-400 hover:text-white hover:shadow-[0_0_20px_rgba(192,38,211,0.5)]'
                              : 'border border-white/10 bg-white/5 text-gray-300'
                        } disabled:opacity-70`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Check size={14} />
                          {updatingId === req.id ? 'Saving...' : req.status === 'accepted' ? 'Accepted' : req.status === 'declined' ? 'Declined' : 'Accept'}
                        </span>
                      </button>
                    )}
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
                    <p className="mt-1 text-xs text-gray-500">{gig.organizer?.full_name || gig.organizer?.username || 'Organizer'} • {formatINR(gig.budget_max || gig.budget_min || 0)}</p>
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
                    <p className="mt-1 text-xs text-emerald-300">Confirmed for {formatINR(item.offer_amount || 0)}</p>
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


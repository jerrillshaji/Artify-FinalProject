import React, { useEffect, useMemo, useState } from 'react';
import { Zap, IndianRupee, Calendar, Users, Clock, Plus, X, Search, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';
import { formatINR } from '../lib/currency';

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
  return `__BOOKING_ACTION__::${bookingId}::${source}::${title || 'Event Offer'}::${location || 'TBD'}::${amount || 0}::${eventDate || ''}`;
};

const ManagerDashboard = () => {
  const { supabase, user } = useSupabase();
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [activeStatKey, setActiveStatKey] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [managerSummary, setManagerSummary] = useState({
    plannedBudget: 0,
    eventCount: 0,
    thisMonthCount: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState(null);
  const [closingEventId, setClosingEventId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [formError, setFormError] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [form, setForm] = useState({
    visibility: 'public',
    title: '',
    description: '',
    location: '',
    venueName: '',
    city: '',
    country: '',
    date: '',
    time: '',
    durationHours: '2',
    amount: '',
    artistIds: [],
    message: '',
    roleNeeded: 'performer',
  });

  const filteredArtists = useMemo(() => {
    const q = artistSearch.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((artist) => {
      const name = (artist.full_name || '').toLowerCase();
      const username = (artist.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [artistSearch, artists]);

  const selectedArtists = useMemo(() => {
    const selectedSet = new Set(form.artistIds);
    return artists.filter((artist) => selectedSet.has(artist.id));
  }, [artists, form.artistIds]);

  const loadManagerData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [eventsResult, artistsResult] = await Promise.all([
        supabase
          .from('events')
          .select('id,title,description,event_date,end_date,location,status,visibility,budget_min,budget_max,venue_name,city,country,required_roles')
          .eq('organizer_id', user.id)
          .order('event_date', { ascending: true }),
        supabase
          .from('profiles')
          .select('id,full_name,username,avatar_url')
          .eq('role', 'artist')
          .order('created_at', { ascending: false }),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (artistsResult.error) throw artistsResult.error;

      const eventRows = eventsResult.data || [];

      const bookingResult = await supabase
        .from('bookings')
        .select('id,event_id,artist_id,status,offer_amount,message,event_date,created_at,events(title,location)')
        .eq('organizer_id', user.id);

      if (bookingResult.error) throw bookingResult.error;

      const bookings = bookingResult.data || [];
      const trackedEvents = eventRows.filter((eventItem) => eventItem.status === 'published' || eventItem.status === 'completed');
      const now = new Date();

      const thisMonthCount = trackedEvents.filter((eventItem) => {
        const date = new Date(eventItem.event_date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;

      const plannedBudget = trackedEvents.reduce((sum, eventItem) => sum + Number(eventItem.budget_max || eventItem.budget_min || 0), 0);
      const pendingOffers = bookings.filter((booking) => booking.status === 'pending').length;
      const acceptedOffers = bookings.filter((booking) => booking.status === 'accepted').length;

      const bookingArtistIds = [...new Set(bookings.map((booking) => booking.artist_id).filter(Boolean))];
      let bookingArtistMap = new Map();
      if (bookingArtistIds.length > 0) {
        const { data: bookingArtistProfiles, error: bookingArtistError } = await supabase
          .from('profiles')
          .select('id,full_name,username,avatar_url')
          .in('id', bookingArtistIds);

        if (bookingArtistError) throw bookingArtistError;
        bookingArtistMap = new Map((bookingArtistProfiles || []).map((item) => [item.id, item]));
      }

      const enrichedBookings = bookings.map((booking) => ({
        ...booking,
        artistProfile: bookingArtistMap.get(booking.artist_id) || null,
      }));

      setBookingDetails(enrichedBookings);

      setManagerSummary({
        plannedBudget,
        eventCount: trackedEvents.length,
        thisMonthCount,
        pendingOffers,
        acceptedOffers,
      });

      const countsByEvent = bookings.reduce((acc, booking) => {
        if (!acc[booking.event_id]) {
          acc[booking.event_id] = { pending: 0, accepted: 0, declined: 0 };
        }
        if (booking.status === 'pending') acc[booking.event_id].pending += 1;
        if (booking.status === 'accepted') acc[booking.event_id].accepted += 1;
        if (booking.status === 'declined') acc[booking.event_id].declined += 1;
        return acc;
      }, {});

      const enriched = eventRows.map((eventItem) => ({
        ...eventItem,
        offers: countsByEvent[eventItem.id] || { pending: 0, accepted: 0, declined: 0 },
      }));

      setEvents(enriched);

      const pendingArtistRequests = enrichedBookings
        .filter((booking) => {
          if (booking.status !== 'pending') return false;
          const messageText = (booking.message || '').toLowerCase();
          return messageText.includes('artist requested') || messageText.includes('ready for this gig');
        })
        .sort((left, right) => new Date(left.event_date) - new Date(right.event_date));

      setIncomingRequests(pendingArtistRequests.map((item) => ({
        ...item,
      })));
      setArtists(artistsResult.data || []);
    } catch (error) {
      console.error('Error loading manager dashboard:', error);
      setEvents([]);
      setIncomingRequests([]);
      setArtists([]);
      setBookingDetails([]);
      setManagerSummary({
        plannedBudget: 0,
        eventCount: 0,
        thisMonthCount: 0,
        pendingOffers: 0,
        acceptedOffers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, [supabase, user?.id]);

  const managerStats = useMemo(() => {
    return [
      { key: 'budget', label: 'Budget Planned', value: formatINR(Math.round(managerSummary.plannedBudget || 0)), icon: IndianRupee, color: 'text-emerald-400', trend: 'Across active events' },
      { key: 'events', label: 'Events', value: String(managerSummary.eventCount).padStart(2, '0'), icon: Calendar, color: 'text-fuchsia-400', trend: `${managerSummary.thisMonthCount} this month` },
      { key: 'pending', label: 'Pending Offers', value: String(managerSummary.pendingOffers).padStart(2, '0'), icon: Clock, color: 'text-yellow-400', trend: 'Awaiting response' },
      { key: 'accepted', label: 'Accepted', value: String(managerSummary.acceptedOffers).padStart(2, '0'), icon: Users, color: 'text-cyan-400', trend: 'Booked artists' },
    ];
  }, [managerSummary]);

  const statDetail = useMemo(() => {
    const trackedEvents = events.filter((eventItem) => eventItem.status === 'published' || eventItem.status === 'completed');

    if (activeStatKey === 'budget') {
      return {
        title: 'Budget Planned Details',
        items: trackedEvents.map((eventItem) => ({
          id: eventItem.id,
          eventId: eventItem.id,
          primary: eventItem.title || 'Untitled Event',
          secondary: `${new Date(eventItem.event_date).toLocaleString()} • ${eventItem.location || 'Location TBD'}`,
          amount: formatINR(eventItem.budget_max || eventItem.budget_min || 0),
          status: eventItem.status,
        })),
      };
    }

    if (activeStatKey === 'events') {
      return {
        title: 'Event Details',
        items: trackedEvents.map((eventItem) => ({
          id: eventItem.id,
          eventId: eventItem.id,
          primary: eventItem.title || 'Untitled Event',
          secondary: `${new Date(eventItem.event_date).toLocaleString()} • ${eventItem.location || 'Location TBD'}`,
          amount: formatINR(eventItem.budget_max || eventItem.budget_min || 0),
          status: eventItem.status,
        })),
      };
    }

    if (activeStatKey === 'pending' || activeStatKey === 'accepted') {
      const targetStatus = activeStatKey === 'pending' ? 'pending' : 'accepted';
      const filtered = bookingDetails.filter((booking) => booking.status === targetStatus);

      return {
        title: targetStatus === 'pending' ? 'Pending Offer Details' : 'Accepted Offer Details',
        items: filtered.map((booking) => ({
          id: booking.id,
          eventId: booking.event_id,
          primary: booking.events?.title || 'Event Offer',
          secondary: `${booking.artistProfile?.full_name || booking.artistProfile?.username || 'Artist'} • ${new Date(booking.event_date).toLocaleString()}`,
          amount: formatINR(booking.offer_amount || 0),
          status: booking.status,
        })),
      };
    }

    return { title: '', items: [] };
  }, [activeStatKey, bookingDetails, events]);

  const selectedShowDetail = useMemo(() => {
    if (!selectedShowId) return null;

    const eventItem = events.find((item) => item.id === selectedShowId);
    if (!eventItem) return null;

    const bookingsForShow = bookingDetails.filter((booking) => booking.event_id === selectedShowId);
    const acceptedArtists = bookingsForShow.filter((booking) => booking.status === 'accepted');

    return {
      event: eventItem,
      totalRequests: bookingsForShow.length,
      acceptedCount: acceptedArtists.length,
      pendingCount: bookingsForShow.filter((booking) => booking.status === 'pending').length,
      bookedArtists: acceptedArtists,
    };
  }, [bookingDetails, events, selectedShowId]);

  const toIsoStart = (dateValue, timeValue) => {
    const localDate = new Date(`${dateValue}T${timeValue}`);
    if (Number.isNaN(localDate.getTime())) return null;
    return localDate.toISOString();
  };

  const toDateInputValue = (isoValue) => {
    if (!isoValue) return '';
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toTimeInputValue = (isoValue) => {
    if (!isoValue) return '';
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const resetForm = () => {
    setArtistSearch('');
    setForm({
      visibility: 'public',
      title: '',
      description: '',
      location: '',
      venueName: '',
      city: '',
      country: '',
      date: '',
      time: '',
      durationHours: '2',
      amount: '',
      artistIds: [],
      message: '',
      roleNeeded: 'performer',
    });
  };

  const handleEditEvent = (eventItem) => {
    const startDate = eventItem?.event_date ? new Date(eventItem.event_date) : null;
    const endDate = eventItem?.end_date ? new Date(eventItem.end_date) : null;
    const durationHours = startDate && endDate && endDate > startDate
      ? String(Math.max(1, Number(((endDate - startDate) / (1000 * 60 * 60)).toFixed(1))))
      : '2';

    setEditingEventId(eventItem.id);
    setFormError('');
    setArtistSearch('');
    setForm({
      visibility: eventItem.visibility || 'public',
      title: eventItem.title || '',
      description: eventItem.description || '',
      location: eventItem.location || '',
      venueName: eventItem.venue_name || '',
      city: eventItem.city || '',
      country: eventItem.country || '',
      date: toDateInputValue(eventItem.event_date),
      time: toTimeInputValue(eventItem.event_date),
      durationHours,
      amount: String(eventItem.budget_max || eventItem.budget_min || ''),
      artistIds: [],
      message: '',
      roleNeeded: eventItem.required_roles?.[0] || 'performer',
    });
    setShowCreateModal(true);
  };

  const toggleArtist = (artistId) => {
    setForm((prev) => {
      const alreadySelected = prev.artistIds.includes(artistId);
      if (alreadySelected) {
        return { ...prev, artistIds: prev.artistIds.filter((id) => id !== artistId) };
      }
      if (prev.artistIds.length >= 5) {
        return prev;
      }
      return { ...prev, artistIds: [...prev.artistIds, artistId] };
    });
  };

  const handleCreateOffer = async (event) => {
    event.preventDefault();
    if (!user?.id) return;

    const startIso = toIsoStart(form.date, form.time);
    const duration = Number(form.durationHours);
    const amount = Number(form.amount);
    const isPrivateInvite = form.visibility === 'private';

    if (!form.title.trim() || !form.location.trim() || !startIso || !duration || !amount) {
      setFormError('Please fill all required fields.');
      return;
    }

    if (isPrivateInvite && (form.artistIds.length === 0 || form.artistIds.length > 5)) {
      setFormError('For private invitations, select 1 to 5 artists.');
      return;
    }

    setCreating(true);
    setFormError('');

    try {
      const startDate = new Date(startIso);
      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000).toISOString();

      if (editingEventId) {
        const { error: updateError } = await supabase
          .from('events')
          .update({
            title: form.title.trim(),
            description: form.description.trim() || null,
            event_date: startIso,
            end_date: endDate,
            location: form.location.trim(),
            venue_name: form.venueName.trim() || null,
            city: form.city.trim() || null,
            country: form.country.trim() || null,
            budget_min: amount,
            budget_max: amount,
            required_roles: [form.roleNeeded.trim()],
            visibility: form.visibility,
          })
          .eq('id', editingEventId)
          .eq('organizer_id', user.id);

        if (updateError) throw updateError;

        setShowCreateModal(false);
        setEditingEventId(null);
        resetForm();
        await loadManagerData();
        return;
      }

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          event_date: startIso,
          end_date: endDate,
          location: form.location.trim(),
          venue_name: form.venueName.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          budget_min: amount,
          budget_max: amount,
          status: 'published',
          visibility: form.visibility,
          required_roles: [form.roleNeeded.trim()],
        })
        .select('id,event_date,title,location')
        .single();

      if (eventError) throw eventError;

      if (isPrivateInvite) {
        const bookingRows = form.artistIds.map((artistId) => ({
          event_id: eventData.id,
          artist_id: artistId,
          organizer_id: user.id,
          status: 'pending',
          offer_amount: amount,
          message: form.message.trim() || null,
          event_date: eventData.event_date,
        }));

        const { data: insertedBookings, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingRows)
          .select('id,artist_id,event_date,offer_amount');

        if (bookingError) throw bookingError;

        const messageRows = await Promise.all((insertedBookings || []).map(async (booking) => {
          const key = await generateKey(user.id, booking.artist_id);
          const payload = createBookingChatPayload({
            bookingId: booking.id,
            title: eventData.title,
            location: eventData.location,
            amount: booking.offer_amount,
            eventDate: booking.event_date,
            source: 'organizer_offer',
          });
          const extraMessage = form.message.trim();
          const messageText = extraMessage ? `${payload}::${extraMessage}` : payload;
          const encryptedContent = await encryptMessage(messageText, key);

          return {
            sender_id: user.id,
            receiver_id: booking.artist_id,
            content: encryptedContent,
            is_read: false,
          };
        }));

        if (messageRows.length > 0) {
          const { error: messageError } = await supabase.from('messages').insert(messageRows);
          if (messageError) throw messageError;
        }
      }

      setShowCreateModal(false);
      setEditingEventId(null);
      resetForm();
      await loadManagerData();
    } catch (error) {
      console.error('Error creating event offer:', error);
      setFormError(error.message || 'Could not create event offer.');
    } finally {
      setCreating(false);
    }
  };

  const handleRequestDecision = async (booking, status) => {
    if (!booking?.id || !user?.id || respondingRequestId) return;

    setRespondingRequestId(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', booking.id)
        .eq('organizer_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      const decisionText = status === 'accepted'
        ? `Your request for ${booking.events?.title || 'this event'} was accepted.`
        : `Your request for ${booking.events?.title || 'this event'} was declined.`;

      const key = await generateKey(user.id, booking.artist_id);
      const encryptedContent = await encryptMessage(decisionText, key);

      const { error: messageError } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: booking.artist_id,
        content: encryptedContent,
        is_read: false,
      });

      if (messageError) throw messageError;

      await loadManagerData();
    } catch (error) {
      console.error('Error responding to artist request:', error);
      setFormError(error.message || 'Could not update this request.');
    } finally {
      setRespondingRequestId(null);
    }
  };

  const handleCloseEvent = async (eventItem) => {
    if (!eventItem?.id || !user?.id || closingEventId) return;
    if (eventItem.status !== 'published') {
      setFormError('Only published events can be closed.');
      return;
    }
    if ((eventItem.offers?.accepted || 0) === 0) {
      setFormError('Accept at least one artist before closing this event.');
      return;
    }

    setClosingEventId(eventItem.id);
    setFormError('');
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'completed' })
        .eq('id', eventItem.id)
        .eq('organizer_id', user.id)
        .eq('status', 'published');

      if (error) throw error;

      await loadManagerData();
    } catch (error) {
      console.error('Error closing event:', error);
      setFormError(error.message || 'Could not close this event.');
    } finally {
      setClosingEventId(null);
    }
  };

  const handleDeleteEvent = async (eventItem) => {
    if (!eventItem?.id || !user?.id || deletingEventId) return;

    const shouldDelete = window.confirm(`Delete "${eventItem.title}"? This will also remove related bookings.`);
    if (!shouldDelete) return;

    setDeletingEventId(eventItem.id);
    setFormError('');
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventItem.id)
        .eq('organizer_id', user.id);

      if (error) throw error;

      await loadManagerData();
    } catch (error) {
      console.error('Error deleting event:', error);
      setFormError(error.message || 'Could not delete this event.');
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <div className="space-y-4 pb-12 sm:space-y-6 md:space-y-8">
      <div className="mb-4 flex items-center sm:mb-6">
        <BackButton />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Event Command</h1>
          <p className="text-sm text-gray-400 sm:text-base">Create public gigs for the feed or private invitations for selected artists.</p>
        </div>
        <Button className="self-start px-3 text-xs sm:px-5 sm:text-sm" onClick={() => setShowCreateModal(true)}>
          <Zap size={16} />
          <span className="hidden sm:inline">Create Event Offer</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {managerStats.map((stat) => (
          <button
            key={stat.key}
            type="button"
            onClick={() => {
              setActiveStatKey((prev) => (prev === stat.key ? null : stat.key));
              setSelectedShowId(null);
            }}
            className={`group relative overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-md transition-colors hover:bg-white/10 sm:rounded-3xl sm:p-4 md:p-6 ${activeStatKey === stat.key ? 'border-white/20 bg-white/10' : 'border-white/5 bg-white/5'}`}
          >
            <div className={`absolute right-0 top-0 p-2 opacity-20 transition-opacity duration-500 group-hover:scale-110 group-hover:opacity-100 sm:p-4 ${stat.color}`}>
              <stat.icon size={32} />
            </div>
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
            <Button
              type="button"
              variant="secondary"
              className="px-3 py-1.5 text-xs sm:text-sm"
              onClick={() => {
                setActiveStatKey(null);
                setSelectedShowId(null);
              }}
            >
              Close
            </Button>
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
                <p><span className="text-gray-500">Title:</span> {selectedShowDetail.event.title || 'Untitled Event'}</p>
                <p><span className="text-gray-500">Status:</span> {selectedShowDetail.event.status}</p>
                <p><span className="text-gray-500">Date:</span> {new Date(selectedShowDetail.event.event_date).toLocaleString()}</p>
                <p><span className="text-gray-500">Location:</span> {selectedShowDetail.event.venue_name || selectedShowDetail.event.location || 'TBD'}</p>
                <p><span className="text-gray-500">Budget:</span> {formatINR(selectedShowDetail.event.budget_max || selectedShowDetail.event.budget_min || 0)}</p>
                <p><span className="text-gray-500">Requests:</span> {selectedShowDetail.totalRequests} total, {selectedShowDetail.pendingCount} pending</p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-bold text-white">Booked Artists ({selectedShowDetail.acceptedCount})</p>
                {selectedShowDetail.bookedArtists.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {selectedShowDetail.bookedArtists.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                        <p className="truncate text-sm text-emerald-100">
                          {booking.artistProfile?.full_name || booking.artistProfile?.username || 'Artist'}
                        </p>
                        <span className="text-xs font-bold text-emerald-300">{formatINR(booking.offer_amount || 0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">No artist has been booked for this show yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/5 p-3 sm:p-4 md:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-500 sm:h-2 sm:w-2"></div>
            <span className="hidden sm:inline">Active Gig Events</span>
            <span className="sm:hidden">Events</span>
          </h2>
          <Button variant="secondary" className="px-3 py-1.5 text-xs sm:text-sm" onClick={loadManagerData}>Refresh</Button>
        </div>

        <div className="space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-6">
          {loading ? (
            [1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl border border-white/5 bg-black/20"></div>
            ))
          ) : events.length > 0 ? (
            events.map((eventItem) => (
              <div key={eventItem.id} className="flex flex-col gap-4 rounded-xl border border-white/5 bg-black/20 p-4 transition-all hover:border-white/10 sm:rounded-2xl sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white sm:text-lg">{eventItem.title}</h3>
                    <p className="mt-1 text-xs text-gray-400 sm:text-sm">{new Date(eventItem.event_date).toLocaleString()} • {eventItem.venue_name || eventItem.location}</p>
                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">{eventItem.city || ''}{eventItem.city && eventItem.country ? ', ' : ''}{eventItem.country || ''}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">{eventItem.status}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${eventItem.visibility === 'private' ? 'border border-amber-400/30 bg-amber-500/10 text-amber-200' : 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-200'}`}>
                      {eventItem.visibility === 'private' ? 'private' : 'public'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs sm:gap-3 sm:text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-gray-500">Offer</p>
                    <p className="font-bold text-white">{formatINR(eventItem.budget_max || eventItem.budget_min || 0)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-gray-500">Pending</p>
                    <p className="font-bold text-yellow-300">{eventItem.offers.pending}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-gray-500">Accepted</p>
                    <p className="font-bold text-emerald-300">{eventItem.offers.accepted}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1.5 text-xs sm:text-sm"
                      onClick={() => handleEditEvent(eventItem)}
                    >
                      Edit Gig
                    </Button>
                    <Button
                      type="button"
                      className="px-3 py-1.5 text-xs sm:text-sm"
                      onClick={() => handleCloseEvent(eventItem)}
                      disabled={closingEventId === eventItem.id || deletingEventId === eventItem.id || eventItem.status === 'completed'}
                    >
                      {closingEventId === eventItem.id
                        ? 'Closing...'
                        : eventItem.status === 'completed'
                          ? 'Closed'
                          : (eventItem.offers?.accepted || 0) === 0
                            ? 'Close Event (Accept artist first)'
                            : 'Close Event'}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="px-3 py-1.5 text-xs sm:text-sm"
                      onClick={() => handleDeleteEvent(eventItem)}
                      disabled={deletingEventId === eventItem.id || closingEventId === eventItem.id}
                    >
                      {deletingEventId === eventItem.id ? 'Deleting...' : 'Delete Gig'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
              <h3 className="text-xl font-bold text-white">No event gigs yet</h3>
              <p className="mt-2 text-sm text-gray-400">Create your first event offer and send it to artists.</p>
              <div className="mt-5 flex justify-center">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus size={16} />
                  Create Event Offer
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/5 p-3 sm:p-4 md:p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500 sm:h-2 sm:w-2"></div>
            <span className="hidden sm:inline">Incoming Artist Requests</span>
            <span className="sm:hidden">Requests</span>
          </h2>
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200 sm:text-xs">{incomingRequests.length} pending</span>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            [1, 2].map((item) => <div key={item} className="h-24 animate-pulse bg-black/20"></div>)
          ) : incomingRequests.length > 0 ? (
            incomingRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-white sm:text-lg">{request.events?.title || 'Event Request'}</p>
                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">{new Date(request.event_date).toLocaleString()} • {request.events?.location || 'Location TBD'}</p>
                  <p className="mt-1 text-xs text-gray-500">Requested by {request.artistProfile?.full_name || request.artistProfile?.username || 'Artist'} • {formatINR(request.offer_amount || 0)}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-3 py-2 text-xs sm:text-sm"
                    onClick={() => handleRequestDecision(request, 'declined')}
                    disabled={respondingRequestId === request.id}
                  >
                    Decline
                  </Button>
                  <Button
                    type="button"
                    className="px-3 py-2 text-xs sm:text-sm"
                    onClick={() => handleRequestDecision(request, 'accepted')}
                    disabled={respondingRequestId === request.id}
                  >
                    {respondingRequestId === request.id ? 'Saving...' : 'Accept'}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400">No incoming artist requests right now.</div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#111111] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">{editingEventId ? 'Edit Gig Event' : 'New Gig Event'}</p>
                <h3 className="mt-1 text-2xl font-black text-white">{editingEventId ? 'Update Gig Details' : 'Create Event And Send Offers'}</h3>
              </div>
              <button onClick={() => { setShowCreateModal(false); setEditingEventId(null); }} className="rounded-full p-2 text-white hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Event Title *</span>
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="Friday Night Corporate Gig" />
                </label>
                <div className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Gig Visibility *</span>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, visibility: 'public', artistIds: [] }))}
                      className={`rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-wider transition-colors sm:text-sm ${form.visibility === 'public' ? 'border border-cyan-400/40 bg-cyan-500/20 text-cyan-200' : 'border border-white/10 text-gray-300 hover:bg-white/5'}`}
                    >
                      Public Feed
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, visibility: 'private' }))}
                      className={`rounded-xl px-3 py-3 text-xs font-bold uppercase tracking-wider transition-colors sm:text-sm ${form.visibility === 'private' ? 'border border-amber-400/40 bg-amber-500/20 text-amber-200' : 'border border-white/10 text-gray-300 hover:bg-white/5'}`}
                    >
                      Private Invite
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Public gigs are visible to all artists in Feed. Private invitations are sent only to selected artists.
                  </p>
                </div>
              </div>

              {form.visibility === 'private' ? (
                <div className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Artists * (up to 5)</span>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                      <input
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-fuchsia-400/60"
                        placeholder="Search artist name or username"
                      />
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {selectedArtists.length > 0 ? selectedArtists.map((artist) => (
                        <span key={artist.id} className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-1 text-xs text-fuchsia-200">
                          {artist.full_name || artist.username || 'Artist'}
                          <button type="button" onClick={() => toggleArtist(artist.id)} className="text-fuchsia-200/80 hover:text-white">×</button>
                        </span>
                      )) : <span className="text-xs text-gray-500">No artists selected</span>}
                    </div>
                    <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                      {filteredArtists.map((artist) => {
                        const checked = form.artistIds.includes(artist.id);
                        const disabled = !checked && form.artistIds.length >= 5;
                        return (
                          <button
                            type="button"
                            key={artist.id}
                            onClick={() => !disabled && toggleArtist(artist.id)}
                            className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors ${checked ? 'bg-fuchsia-500/15 text-white' : 'text-gray-300 hover:bg-white/5'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            <span>{artist.full_name || artist.username || artist.id}</span>
                            {checked ? <Check size={14} className="text-fuchsia-300" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Description</span>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="Audience details, genre expectation, stage setup, and anything important." />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Date *</span>
                  <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Time *</span>
                  <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Length (hours) *</span>
                  <input type="number" min="1" step="0.5" value={form.durationHours} onChange={(e) => setForm((p) => ({ ...p, durationHours: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Offer Amount (INR) *</span>
                  <input type="number" min="1" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block lg:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-white">Location *</span>
                  <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="Downtown Convention Center" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">City</span>
                  <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="Kochi" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Country</span>
                  <input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="India" />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Venue Name</span>
                  <input value={form.venueName} onChange={(e) => setForm((p) => ({ ...p, venueName: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="Grand Hall A" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Role Needed</span>
                  <input value={form.roleNeeded} onChange={(e) => setForm((p) => ({ ...p, roleNeeded: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="DJ, Vocalist, Band" />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">
                  {form.visibility === 'private' ? 'Offer Message To Artists' : 'Public Gig Note'}
                </span>
                <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="We would love you to headline this set. Please accept or decline in chat." />
              </label>

              {formError ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{formError}</div> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={creating}>
                  {creating
                    ? (editingEventId ? 'Saving...' : 'Creating...')
                    : (editingEventId
                      ? 'Save Changes'
                      : (form.visibility === 'private' ? 'Create Private Event + Send Invites' : 'Publish Public Gig'))}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowCreateModal(false); setEditingEventId(null); setFormError(''); resetForm(); }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;


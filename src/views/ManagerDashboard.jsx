import React, { useEffect, useMemo, useState } from 'react';
import { Zap, DollarSign, Calendar, Users, Clock, Plus, X, Search, Check } from 'lucide-react';
import Button from '../components/ui/Button';
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
  return `__BOOKING_ACTION__::${bookingId}::${source}::${title || 'Event Offer'}::${location || 'TBD'}::${amount || 0}::${eventDate || ''}`;
};

const ManagerDashboard = () => {
  const { supabase, user } = useSupabase();
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [respondingRequestId, setRespondingRequestId] = useState(null);
  const [formError, setFormError] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [form, setForm] = useState({
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
          .select('id,title,event_date,end_date,location,status,budget_min,budget_max,venue_name,city,country')
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

      const pendingArtistRequests = bookings
        .filter((booking) => booking.status === 'pending' && (booking.message || '').toLowerCase().includes('artist requested'))
        .sort((left, right) => new Date(left.event_date) - new Date(right.event_date));

      const artistIdsFromRequests = [...new Set(pendingArtistRequests.map((booking) => booking.artist_id))];
      let artistNameMap = new Map();

      if (artistIdsFromRequests.length > 0) {
        const { data: requestArtistProfiles, error: requestArtistsError } = await supabase
          .from('profiles')
          .select('id,full_name,username,avatar_url')
          .in('id', artistIdsFromRequests);

        if (requestArtistsError) throw requestArtistsError;
        artistNameMap = new Map((requestArtistProfiles || []).map((item) => [item.id, item]));
      }

      setIncomingRequests(pendingArtistRequests.map((item) => ({
        ...item,
        artistProfile: artistNameMap.get(item.artist_id) || null,
      })));
      setArtists(artistsResult.data || []);
    } catch (error) {
      console.error('Error loading manager dashboard:', error);
      setEvents([]);
      setIncomingRequests([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, [supabase, user?.id]);

  const managerStats = useMemo(() => {
    const now = new Date();
    const thisMonth = events.filter((eventItem) => {
      const date = new Date(eventItem.event_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const pendingOffers = events.reduce((sum, eventItem) => sum + (eventItem.offers?.pending || 0), 0);
    const acceptedOffers = events.reduce((sum, eventItem) => sum + (eventItem.offers?.accepted || 0), 0);
    const totalBudget = events.reduce((sum, eventItem) => sum + Number(eventItem.budget_max || eventItem.budget_min || 0), 0);

    return [
      { label: 'Budget Planned', value: `$${Math.round(totalBudget).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', trend: 'Across Events' },
      { label: 'Events', value: String(events.length).padStart(2, '0'), icon: Calendar, color: 'text-fuchsia-400', trend: `${thisMonth.length} this month` },
      { label: 'Pending Offers', value: String(pendingOffers).padStart(2, '0'), icon: Clock, color: 'text-yellow-400', trend: 'Awaiting response' },
      { label: 'Accepted', value: String(acceptedOffers).padStart(2, '0'), icon: Users, color: 'text-cyan-400', trend: 'Booked artists' },
    ];
  }, [events]);

  const toIsoStart = (dateValue, timeValue) => {
    const localDate = new Date(`${dateValue}T${timeValue}`);
    if (Number.isNaN(localDate.getTime())) return null;
    return localDate.toISOString();
  };

  const resetForm = () => {
    setArtistSearch('');
    setForm({
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

    if (!form.title.trim() || !form.location.trim() || !startIso || form.artistIds.length === 0 || form.artistIds.length > 5 || !duration || !amount) {
      setFormError('Please fill all required fields and select 1 to 5 artists.');
      return;
    }

    setCreating(true);
    setFormError('');

    try {
      const startDate = new Date(startIso);
      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000).toISOString();

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
          required_roles: [form.roleNeeded.trim()],
        })
        .select('id,event_date,title,location')
        .single();

      if (eventError) throw eventError;

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

      setShowCreateModal(false);
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

  return (
    <div className="space-y-4 pb-12 sm:space-y-6 md:space-y-8">
      <div className="mb-4 flex items-center sm:mb-6">
        <BackButton />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Event Command</h1>
          <p className="text-sm text-gray-400 sm:text-base">Create event gigs and send booking offers directly to up to 5 artists.</p>
        </div>
        <Button className="self-start px-3 text-xs sm:px-5 sm:text-sm" onClick={() => setShowCreateModal(true)}>
          <Zap size={16} />
          <span className="hidden sm:inline">Create Event Offer</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {managerStats.map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-3 backdrop-blur-md transition-colors hover:bg-white/10 sm:rounded-3xl sm:p-4 md:p-6">
            <div className={`absolute right-0 top-0 p-2 opacity-20 transition-opacity duration-500 group-hover:scale-110 group-hover:opacity-100 sm:p-4 ${stat.color}`}>
              <stat.icon size={32} />
            </div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 sm:mb-2 sm:text-xs">{stat.label}</p>
            <p className="mb-0.5 text-2xl font-black text-white sm:mb-1 sm:text-3xl">{stat.value}</p>
            <p className={`text-[10px] font-medium sm:text-xs ${stat.color}`}>{stat.trend}</p>
          </div>
        ))}
      </div>

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
                  <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">{eventItem.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs sm:gap-3 sm:text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-gray-500">Offer</p>
                    <p className="font-bold text-white">${Number(eventItem.budget_max || eventItem.budget_min || 0).toLocaleString()}</p>
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
                  <p className="mt-1 text-xs text-gray-500">Requested by {request.artistProfile?.full_name || request.artistProfile?.username || 'Artist'} • ${Number(request.offer_amount || 0).toLocaleString()}</p>
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
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">New Gig Event</p>
                <h3 className="mt-1 text-2xl font-black text-white">Create Event And Send Offers</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-full p-2 text-white hover:bg-white/10">
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
              </div>

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
                  <span className="mb-2 block text-sm font-semibold text-white">Offer Amount (USD) *</span>
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
                <span className="mb-2 block text-sm font-semibold text-white">Offer Message To Artists</span>
                <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400/60" placeholder="We would love you to headline this set. Please accept or decline in chat." />
              </label>

              {formError ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{formError}</div> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Event + Send Offers'}</Button>
                <Button type="button" variant="secondary" onClick={() => { setShowCreateModal(false); setFormError(''); resetForm(); }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;


import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, UserRound, IndianRupee, RefreshCw } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';
import Button from '../components/ui/Button';
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

const formatDateTime = (value) => {
  if (!value) return 'Date TBD';
  return new Date(value).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const FeedOffersView = () => {
  const navigate = useNavigate();
  const { supabase, user, profile } = useSupabase();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingEventId, setActingEventId] = useState(null);

  const isArtist = profile?.role === 'artist';

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, organizer_id, title, description, event_date, location, venue_name, city, country, budget_min, budget_max, required_roles, status, visibility, created_at')
        .or('visibility.eq.public,visibility.is.null')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(80);

      if (eventsError) throw eventsError;

      const organizerIds = [...new Set((eventsData || []).map((eventItem) => eventItem.organizer_id).filter(Boolean))];

      const profilesResult = organizerIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, is_verified')
            .in('id', organizerIds)
        : { data: [] };

      if (profilesResult.error) throw profilesResult.error;

      const organizerById = new Map((profilesResult.data || []).map((item) => [item.id, item]));

      const merged = (eventsData || []).map((eventItem) => ({
        ...eventItem,
        organizer: organizerById.get(eventItem.organizer_id) || null,
      }));

      setOffers(merged);
    } catch (err) {
      console.error('Error loading feed offers:', err);
      setOffers([]);
      setError(err?.message || 'Could not load event offers right now.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleReadyForGig = async (eventItem) => {
    if (!isArtist || !user?.id || actingEventId) return;

    setActingEventId(eventItem.id);
    try {
      const { data: existingBooking, error: existingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('event_id', eventItem.id)
        .eq('artist_id', user.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingBooking) {
        navigate(`/messages?userId=${eventItem.organizer_id}`);
        return;
      }

      const amount = Number(eventItem.budget_max || eventItem.budget_min || 1);
      const { data: insertedBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          event_id: eventItem.id,
          artist_id: user.id,
          organizer_id: eventItem.organizer_id,
          status: 'pending',
          offer_amount: amount > 0 ? amount : 1,
          message: 'Artist requested this gig from public feed.',
          event_date: eventItem.event_date,
        })
        .select('id, event_date, offer_amount')
        .single();

      if (bookingError) throw bookingError;

      const key = await generateKey(user.id, eventItem.organizer_id);
      const payload = createBookingChatPayload({
        bookingId: insertedBooking.id,
        title: eventItem.title,
        location: eventItem.location,
        amount: insertedBooking.offer_amount,
        eventDate: insertedBooking.event_date,
        source: 'artist_request',
      });

      const encryptedContent = await encryptMessage(`${payload}::Artist is ready for this gig.`, key);

      const { error: messageError } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: eventItem.organizer_id,
        content: encryptedContent,
        is_read: false,
      });

      if (messageError) throw messageError;

      await loadOffers();
    } catch (err) {
      console.error('Error requesting gig from feed:', err);
      alert(err?.message || 'Could not send your gig request.');
    } finally {
      setActingEventId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Feed</p>
          <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Live Gig Requests</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-400 sm:text-base">
            Public gig requests from managers and event organizers are listed here for everyone.
          </p>
        </div>
        <Button variant="secondary" className="px-4 py-2 text-sm" onClick={loadOffers}>
          <RefreshCw size={15} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 sm:text-xs">Open Public Offers</p>
        <p className="mt-2 text-2xl font-black text-white">{offers.length}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5"></div>
          ))
        ) : offers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
            <h3 className="text-xl font-bold text-white">No gig requests right now</h3>
            <p className="mt-2 text-sm text-gray-400">Check back soon for new organizer offers.</p>
          </div>
        ) : (
          offers.map((eventItem) => {
            return (
              <div key={eventItem.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-white sm:text-xl">{eventItem.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400 sm:text-sm">
                      <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {formatDateTime(eventItem.event_date)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={14} /> {eventItem.venue_name || eventItem.location}</span>
                      <span className="inline-flex items-center gap-1"><IndianRupee size={14} /> {formatINR(eventItem.budget_max || eventItem.budget_min || 0)}</span>
                    </div>

                    <p className="mt-3 text-sm text-gray-300">{eventItem.description || 'No additional details provided by organizer.'}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                        <UserRound size={12} /> {eventItem.organizer?.full_name || eventItem.organizer?.username || 'Organizer'}
                      </span>
                      {(eventItem.required_roles || []).slice(0, 3).map((roleItem) => (
                        <span key={roleItem} className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-1 text-fuchsia-200">
                          {roleItem}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:flex-col sm:items-end">
                    {isArtist ? (
                      <button
                        onClick={() => handleReadyForGig(eventItem)}
                        disabled={actingEventId === eventItem.id}
                        className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition-all hover:bg-fuchsia-500 hover:text-white disabled:opacity-60 sm:text-sm"
                      >
                        {actingEventId === eventItem.id ? 'Sending...' : "I'm Ready for this Gig"}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/messages?userId=${eventItem.organizer_id}`)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-200 hover:bg-white/10 sm:text-sm"
                      >
                        Contact Organizer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FeedOffersView;

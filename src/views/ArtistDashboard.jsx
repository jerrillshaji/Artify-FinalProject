import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, List, DollarSign, Zap, TrendingUp, Star, MapPin, MessageCircle, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import BackButton from '../components/layout/BackButton';
import { useSupabase } from '../context/SupabaseContext';

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { supabase, user } = useSupabase();
  const [viewMode, setViewMode] = useState('list');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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

      const enriched = (bookingsData || []).map((booking) => ({
        ...booking,
        organizer: organizerMap.get(booking.organizer_id) || null,
      }));

      setBookings(enriched);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
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
    const upcoming = bookings.filter((item) => new Date(item.event_date) > new Date()).length;

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
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .eq('artist_id', user.id);

      if (error) throw error;

      setBookings((prev) => prev.map((item) => (item.id === bookingId ? { ...item, status } : item)));
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert(error.message || 'Could not update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = useMemo(() => {
    if (viewMode === 'calendar') {
      return bookings.filter((item) => item.status === 'accepted').sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }
    return bookings;
  }, [bookings, viewMode]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-12">
      <div className="flex items-center mb-4 sm:mb-6">
        <BackButton />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage incoming gig offers, accept or decline, and contact organizers instantly.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-fit self-start">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 ${viewMode === 'list' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'text-gray-400 hover:text-white'}`}
          >
            <List size={14} sm={16} /> <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 ${viewMode === 'calendar' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'text-gray-400 hover:text-white'}`}
          >
            <Calendar size={14} sm={16} /> <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {bookingStats.map((stat, i) => (
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
      {viewMode === 'list' ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-3 sm:p-4 md:p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-fuchsia-500 animate-pulse"></div>
              <span className="hidden sm:inline">Incoming Bookings</span>
              <span className="sm:hidden">Bookings</span>
            </h2>
            <Badge color="gray">{bookings.filter((item) => item.status === 'pending').length} Pending</Badge>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              [1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse bg-black/20"></div>)
            ) : grouped.length > 0 ? grouped.map((req) => (
              <div key={req.id} className="group flex flex-col gap-3 p-3 transition-colors hover:bg-white/5 sm:gap-4 sm:p-4 md:gap-6 md:p-6">
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex flex-col items-center justify-center text-white flex-shrink-0 shadow-inner">
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase text-gray-400">{new Date(req.event_date).toLocaleString([], { month: 'short' })}</span>
                    <span className="text-base sm:text-xl font-black">{new Date(req.event_date).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-fuchsia-400 transition-colors truncate">{req.events?.title || 'Event Offer'}</h3>
                      <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border uppercase tracking-wider flex-shrink-0 ${req.status === 'accepted' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : req.status === 'declined' ? 'bg-red-500/20 border-red-500/30 text-red-300' : 'bg-white/10 text-gray-300 border-white/5'}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-2">{req.organizer?.full_name || req.organizer?.username || 'Organizer'}</p>
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} sm={12} /> {req.events?.location || 'Location TBD'}</span>
                      <span className="flex items-center gap-1 text-emerald-400"><DollarSign size={10} sm={12} /> ${Number(req.offer_amount || 0).toLocaleString()}</span>
                      <span>{new Date(req.event_date).toLocaleString()}</span>
                    </div>
                    {req.message && <p className="mt-2 text-xs text-gray-400 line-clamp-2">"{req.message}"</p>}
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => handleBookingStatus(req.id, 'declined')}
                    disabled={updatingId === req.id || req.status !== 'pending'}
                    className="flex-shrink-0 rounded-lg border border-white/5 bg-white/5 p-2 text-gray-400 transition-all hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 sm:rounded-xl sm:p-3"
                  >
                    <X size={16} sm={20} />
                  </button>
                  <button
                    onClick={() => navigate(`/messages?userId=${req.organizer_id}`)}
                    className="flex-shrink-0 rounded-lg border border-white/5 bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white sm:rounded-xl sm:p-3"
                  >
                    <MessageCircle size={16} sm={20} />
                  </button>
                  <button
                    onClick={() => handleBookingStatus(req.id, 'accepted')}
                    disabled={updatingId === req.id || req.status !== 'pending'}
                    className="flex-shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition-all hover:bg-fuchsia-400 hover:text-white hover:shadow-[0_0_20px_rgba(192,38,211,0.5)] disabled:opacity-50 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Check size={14} /> Accept
                    </span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-gray-400">No booking offers yet.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-xl sm:rounded-3xl sm:p-6">
          <h2 className="mb-4 text-xl font-black text-white">Accepted Bookings</h2>
          {grouped.length > 0 ? (
            <div className="space-y-3">
              {grouped.map((item) => (
                <div key={item.id} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="font-bold text-white">{item.events?.title || 'Event Offer'}</p>
                  <p className="mt-1 text-sm text-gray-300">{new Date(item.event_date).toLocaleString()} • {item.events?.location || 'Location TBD'}</p>
                  <p className="mt-1 text-sm text-emerald-300">Confirmed for ${Number(item.offer_amount || 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No accepted bookings yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistDashboard;
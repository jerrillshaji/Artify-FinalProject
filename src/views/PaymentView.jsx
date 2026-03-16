import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle2 } from 'lucide-react';
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

const createPaymentChatPayload = ({ bookingId, title, location, amount, eventDate, source }) => {
  return `__PAYMENT_ACTION__::${bookingId}::${source}::${title || 'Event Payment'}::${location || 'TBD'}::${amount || 0}::${eventDate || ''}`;
};

const PaymentView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { supabase, user } = useSupabase();

  const bookingId = searchParams.get('bookingId');
  const eventId = searchParams.get('eventId');

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [cardForm, setCardForm] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [gatewayError, setGatewayError] = useState('');

  useEffect(() => {
    const loadBookings = async () => {
      if (!user?.id) return;

      setLoading(true);
      setStatusMessage('');
      try {
        let query = supabase
          .from('bookings')
          .select('id,event_id,artist_id,organizer_id,status,payment_status,paid_at,offer_amount,event_date,events(title,location,status)')
          .eq('organizer_id', user.id)
          .eq('status', 'accepted')
          .order('event_date', { ascending: true });

        if (bookingId) {
          query = query.eq('id', bookingId);
        }
        if (eventId) {
          query = query.eq('event_id', eventId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const rows = (data || []).filter((row) => row.payment_status !== 'paid');
        const artistIds = [...new Set(rows.map((row) => row.artist_id).filter(Boolean))];

        let artistMap = new Map();
        if (artistIds.length > 0) {
          const { data: artistProfiles, error: profileError } = await supabase
            .from('profiles')
            .select('id,full_name,username,avatar_url')
            .in('id', artistIds);

          if (profileError) throw profileError;
          artistMap = new Map((artistProfiles || []).map((item) => [item.id, item]));
        }

        setBookings(rows.map((row) => ({
          ...row,
          artist: artistMap.get(row.artist_id) || null,
        })));
      } catch (error) {
        console.error('Error loading payment bookings:', error);
        setStatusMessage(error.message || 'Could not load payment details.');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [bookingId, eventId, supabase, user?.id]);

  const totalAmount = useMemo(() => bookings.reduce((sum, b) => sum + Number(b.offer_amount || 0), 0), [bookings]);

  const completeDummyPayment = async (booking, methodLabel) => {
    if (!booking?.id || !user?.id || processingId) return;

    setProcessingId(booking.id);
    setStatusMessage('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const { error: paymentUpdateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        .eq('organizer_id', user.id)
        .neq('payment_status', 'paid');

      if (paymentUpdateError) throw paymentUpdateError;

      const key = await generateKey(user.id, booking.artist_id);
      const payload = createPaymentChatPayload({
        bookingId: booking.id,
        title: booking.events?.title,
        location: booking.events?.location,
        amount: booking.offer_amount,
        eventDate: booking.event_date,
        source: 'manager_payment_completed',
      });

      const encryptedContent = await encryptMessage(`${payload}::Dummy ${methodLabel} payment marked as completed by manager.`, key);

      const { error: messageError } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: booking.artist_id,
        content: encryptedContent,
        is_read: false,
      });

      if (messageError) throw messageError;

      setStatusMessage(`Payment message sent to ${booking.artist?.full_name || booking.artist?.username || 'artist'} via ${methodLabel}.`);
      setSelectedPaymentBooking(null);
      setBookings((prev) => prev.filter((item) => item.id !== booking.id));
    } catch (error) {
      console.error('Error processing dummy payment:', error);
      setStatusMessage(error.message || 'Payment could not be completed.');
    } finally {
      setProcessingId(null);
    }
  };

  const openGatewayForBooking = (booking) => {
    setSelectedPaymentBooking(booking);
    setPaymentMethod('upi');
    setGatewayError('');
    setCardForm({ name: '', number: '', expiry: '', cvv: '' });
  };

  const validateCardForm = () => {
    const digits = cardForm.number.replace(/\s+/g, '');
    const expiryPattern = /^(0[1-9]|1[0-2])\/[0-9]{2}$/;
    const cvvPattern = /^[0-9]{3,4}$/;

    if (!cardForm.name.trim()) return 'Card holder name is required.';
    if (!/^\d{16}$/.test(digits)) return 'Card number must be 16 digits.';
    if (!expiryPattern.test(cardForm.expiry.trim())) return 'Expiry must be in MM/YY format.';
    if (!cvvPattern.test(cardForm.cvv.trim())) return 'CVV must be 3 or 4 digits.';

    return '';
  };

  const handleGatewayPayment = async () => {
    if (!selectedPaymentBooking) return;

    if (paymentMethod === 'card') {
      const validationError = validateCardForm();
      if (validationError) {
        setGatewayError(validationError);
        return;
      }
    }

    setGatewayError('');
    const methodLabel = paymentMethod === 'upi' ? 'UPI' : 'Card';
    await completeDummyPayment(selectedPaymentBooking, methodLabel);
  };

  const upiQrUrl = useMemo(() => {
    if (!selectedPaymentBooking) return '';
    const amount = Number(selectedPaymentBooking.offer_amount || 0).toFixed(2);
    const note = encodeURIComponent(`Artify payment ${selectedPaymentBooking.id}`);
    const upiUri = `upi://pay?pa=artify.payments@upi&pn=Artify%20Events&am=${amount}&cu=INR&tn=${note}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
  }, [selectedPaymentBooking]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center">
        <BackButton />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h1 className="text-2xl font-black text-white sm:text-3xl">Event Payments</h1>
        <p className="mt-2 text-sm text-gray-400">Dummy payment mode is active. Payment completion will send a payment card message to the artist.</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-300">Total payable</p>
          <p className="text-xl font-bold text-emerald-300">{formatINR(totalAmount)}</p>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          {statusMessage}
        </div>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400">Loading payment items...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400">No accepted unpaid bookings available for payment.</div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-bold text-white">{booking.events?.title || 'Event'}</p>
                  <p className="mt-1 text-xs text-gray-400">{booking.events?.location || 'Location TBD'} • {new Date(booking.event_date).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-gray-400">Artist: {booking.artist?.full_name || booking.artist?.username || 'Artist'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">{formatINR(booking.offer_amount || 0)}</span>
                  <button
                    type="button"
                    onClick={() => openGatewayForBooking(booking)}
                    disabled={processingId === booking.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-black hover:bg-cyan-400 hover:text-white disabled:opacity-60 sm:text-sm"
                  >
                    <CreditCard size={14} />
                    Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/messages?userId=${booking.artist_id}`)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10 sm:text-sm"
                  >
                    Message Artist
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPaymentBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121216] p-5 sm:p-6">
            <h3 className="text-xl font-black text-white">Payment Gateway</h3>
            <p className="mt-1 text-xs text-gray-400">{selectedPaymentBooking.events?.title || 'Event'} • {formatINR(selectedPaymentBooking.offer_amount || 0)}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${paymentMethod === 'upi' ? 'bg-cyan-500 text-black' : 'text-gray-300 hover:bg-white/5'}`}
              >
                UPI QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${paymentMethod === 'card' ? 'bg-cyan-500 text-black' : 'text-gray-300 hover:bg-white/5'}`}
              >
                ATM / Card
              </button>
            </div>

            {paymentMethod === 'upi' ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                <img src={upiQrUrl} alt="UPI QR" className="mx-auto h-52 w-52 rounded-xl border border-white/10 bg-white p-2" />
                <p className="mt-3 text-xs text-gray-400">Scan with any UPI app to pay {formatINR(selectedPaymentBooking.offer_amount || 0)}.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <input
                  type="text"
                  placeholder="Card Holder Name"
                  value={cardForm.name}
                  onChange={(e) => setCardForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                />
                <input
                  type="text"
                  placeholder="Card Number (16 digits)"
                  value={cardForm.number}
                  onChange={(e) => setCardForm((prev) => ({ ...prev, number: e.target.value.replace(/[^\d\s]/g, '').slice(0, 19) }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, expiry: e.target.value.slice(0, 5) }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, cvv: e.target.value.replace(/[^\d]/g, '').slice(0, 4) }))}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
                  />
                </div>
              </div>
            )}

            {gatewayError ? (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{gatewayError}</div>
            ) : null}

            <p className="mt-3 text-[11px] text-gray-500">Dummy mode: No real charge is made. Completion sends payment confirmation card to the artist.</p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedPaymentBooking(null)}
                className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGatewayPayment}
                disabled={processingId === selectedPaymentBooking.id}
                className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-cyan-400 hover:text-white disabled:opacity-60"
              >
                {processingId === selectedPaymentBooking.id ? 'Processing...' : `Pay ${formatINR(selectedPaymentBooking.offer_amount || 0)}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PaymentView;

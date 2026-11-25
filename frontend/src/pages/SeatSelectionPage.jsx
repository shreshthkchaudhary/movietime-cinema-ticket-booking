import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiFetch from '../services/api';
import { createSeatSocket } from '../services/socket';
import SeatGrid from '../components/SeatGrid';

// Live seat selection and booking confirmation page for a single show
function SeatSelectionPage() {
  const { id: showId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const myUserId = user?.id || user?._id;

  const [show, setShow] = useState(null);
  const [screen, setScreen] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const socketRef = useRef(null);
  const manualUnlockRef = useRef(new Set());
  const selectedSeatsRef = useRef([]);
  const hasConnectedOnceRef = useRef(false);

  // Keep a ref synced with selectedSeats so socket handlers read current selection cleanly
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  // Load show details, screen layout, and booked seats from the REST API
  const loadShow = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/shows/${showId}`);
      setShow(data.show);
      setScreen(data.screen);
      setBookedSeats(data.show.bookedSeats || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    loadShow();
  }, [loadShow]);

  // Connect Socket.IO, join the show room, and handle live seat events
  useEffect(() => {
    if (!myUserId) return;

    const socket = createSeatSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-show', { showId });

      // On reconnect, refresh show data from REST so bookedSeats are never stale
      if (hasConnectedOnceRef.current) {
        loadShow();
      }
      hasConnectedOnceRef.current = true;
    });

    // Initial snapshot of currently locked seats for this show
    socket.on('current-locks', ({ locks }) => {
      const mine = [];
      const others = [];
      for (const [seat, ownerId] of Object.entries(locks || {})) {
        if (ownerId === myUserId) mine.push(seat);
        else others.push(seat);
      }
      setSelectedSeats(mine);
      setLockedSeats(others);
    });

    // Someone locked one or more seats
    socket.on('seats-locked', ({ seats, userId }) => {
      if (userId === myUserId) {
        setSelectedSeats((prev) => Array.from(new Set([...prev, ...seats])));
        setLockedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      } else {
        setLockedSeats((prev) => Array.from(new Set([...prev, ...seats])));
        setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      }
    });

    // Seats were unlocked (manual unlock, disconnect, 2-min expiry, or booking cancelled)
    socket.on('seats-unlocked', ({ seats }) => {
      const lostMySeat = selectedSeatsRef.current.some(
        (s) => seats.includes(s) && !manualUnlockRef.current.has(s)
      );
      if (lostMySeat) {
        setInfoMsg('Your seat lock expired');
      }
      seats.forEach((s) => manualUnlockRef.current.delete(s));

      setLockedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      setBookedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
    });

    // Seats were permanently booked
    socket.on('seats-booked', ({ seats }) => {
      setBookedSeats((prev) => Array.from(new Set([...prev, ...seats])));
      setLockedSeats((prev) => prev.filter((s) => !seats.includes(s)));
      setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
    });

    socket.on('lock-error', ({ message }) => {
      setError(message);
    });

    // Clean up room membership, listeners, and socket connection on unmount
    return () => {
      socket.emit('leave-show', { showId });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showId, myUserId, loadShow]);

  // Toggle seat lock via Socket.IO; wait for server confirmation before marking selected
  function handleSeatClick(seat) {
    setError('');
    setInfoMsg('');

    const socket = socketRef.current;
    if (!socket) return;

    if (selectedSeats.includes(seat)) {
      manualUnlockRef.current.add(seat);
      socket.emit('unlock-seat', { showId, seat });
    } else {
      if (selectedSeats.length >= 6) {
        setError('You can select a maximum of 6 seats');
        return;
      }
      socket.emit('lock-seat', { showId, seat });
    }
  }

  // Confirm the booking via REST API and redirect to My Bookings
  async function handleConfirmBooking() {
    if (selectedSeats.length === 0) return;

    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ showId, seats: selectedSeats }),
      });
      navigate('/my-bookings');
    } catch (err) {
      setError(err.message);
      loadShow();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container">Loading show...</div>;
  if (!show || !screen) {
    return (
      <div className="container">
        <div className="error-msg">{error || 'Show or screen not found'}</div>
      </div>
    );
  }

  const totalDisplay = selectedSeats.length * show.price;

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h1>{show.movie?.title}</h1>
        <p className="muted">
          {show.theatre?.name} ({show.theatre?.city}) • {show.screenName} •{' '}
          {new Date(show.startTime).toLocaleString()} • ₹{show.price} per seat
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {infoMsg && <div className="success-msg">{infoMsg}</div>}

      <div className="card">
        <SeatGrid
          rows={screen.rows}
          seatsPerRow={screen.seatsPerRow}
          bookedSeats={bookedSeats}
          lockedSeats={lockedSeats}
          selectedSeats={selectedSeats}
          onSeatClick={handleSeatClick}
        />

        <div className="row-between" style={{ marginTop: '1.5rem' }}>
          <div>
            <p>
              <strong>Selected Seats:</strong>{' '}
              {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
            </p>
            <p className="muted">
              Total (estimated): <strong>₹{totalDisplay}</strong>
            </p>
          </div>

          <button
            type="button"
            className="btn"
            disabled={selectedSeats.length === 0 || submitting}
            onClick={handleConfirmBooking}
          >
            {submitting ? 'Booking...' : 'Confirm booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeatSelectionPage;

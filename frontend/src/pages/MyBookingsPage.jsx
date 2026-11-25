import { useEffect, useState } from 'react';
import apiFetch from '../services/api';

// Displays the logged-in user's booking history, ticket codes, and cancel option
function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch the logged-in user's booking history from the API
  async function loadBookings() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/bookings/my');
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  // Cancel a future confirmed booking and refresh the list
  async function handleCancel(bookingId) {
    setError('');
    setMessage('');
    try {
      await apiFetch(`/api/bookings/${bookingId}/cancel`, { method: 'PATCH' });
      setMessage('Booking cancelled and seats released.');
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>My Bookings</h1>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}
      {loading && <p className="muted">Loading bookings...</p>}

      {!loading && bookings.length === 0 && (
        <p className="muted">You have not booked any tickets yet.</p>
      )}

      <div className="stack">
        {bookings.map((booking) => {
          const showTime = booking.show?.startTime
            ? new Date(booking.show.startTime)
            : null;
          const canCancel =
            booking.status === 'confirmed' && showTime && showTime > new Date();

          return (
            <div key={booking._id} className="card row-between">
              <div className="stack" style={{ gap: '0.35rem' }}>
                <h3>{booking.show?.movie?.title || 'Movie'}</h3>
                <p className="muted">
                  {booking.show?.theatre?.name} ({booking.show?.screenName}) •{' '}
                  {showTime ? showTime.toLocaleString() : 'N/A'}
                </p>
                <p>
                  <strong>Seats:</strong> {booking.seats.join(', ')} |{' '}
                  <strong>Total:</strong> ₹{booking.totalAmount}
                </p>
                <p>
                  <strong>Ticket Code:</strong>{' '}
                  <span className="badge">{booking.ticketCode}</span>{' '}
                  <span className={`badge badge-${booking.status}`}>
                    {booking.status}
                  </span>
                </p>
              </div>

              {canCancel && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleCancel(booking._id)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyBookingsPage;

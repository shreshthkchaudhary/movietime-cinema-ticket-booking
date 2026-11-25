// Reports tab for superAdmin and theatreAdmin: shows movie and show collection tables
import { useEffect, useState } from 'react';
import apiFetch from '../../services/api';

// Fetches and renders the collection per movie and collection per show tables
function ReportsTab() {
  const [movieReports, setMovieReports] = useState([]);
  const [showReports, setShowReports] = useState([]);
  const [error, setError] = useState('');

  // Load aggregated movie and show reports from the backend
  async function loadReports() {
    setError('');
    try {
      const [mrData, srData] = await Promise.all([
        apiFetch('/api/reports/movies'),
        apiFetch('/api/reports/shows'),
      ]);
      setMovieReports(mrData.report);
      setShowReports(srData.report);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="stack">
      {error && <div className="error-msg">{error}</div>}

      <div className="card table-wrap">
        <h2>Collection Per Movie</h2>
        <table>
          <thead>
            <tr>
              <th>Movie</th>
              <th>Bookings</th>
              <th>Seats Sold</th>
              <th>Revenue (₹)</th>
            </tr>
          </thead>
          <tbody>
            {movieReports.map((r) => (
              <tr key={r._id}>
                <td>{r.title}</td>
                <td>{r.totalBookings}</td>
                <td>{r.seatsSold}</td>
                <td>₹{r.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card table-wrap">
        <h2>Collection Per Show</h2>
        <table>
          <thead>
            <tr>
              <th>Movie</th>
              <th>Theatre</th>
              <th>Start Time</th>
              <th>Bookings</th>
              <th>Seats Sold</th>
              <th>Revenue (₹)</th>
            </tr>
          </thead>
          <tbody>
            {showReports.map((r) => (
              <tr key={r._id}>
                <td>{r.movieTitle}</td>
                <td>{r.theatreName}</td>
                <td>{new Date(r.startTime).toLocaleString()}</td>
                <td>{r.totalBookings}</td>
                <td>{r.seatsSold}</td>
                <td>₹{r.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportsTab;

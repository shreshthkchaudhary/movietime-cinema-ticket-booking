// Add Show tab for theatreAdmin: schedules a movie show on an owned theatre screen
import { useEffect, useState } from 'react';
import apiFetch from '../../services/api';

// Manages the schedule show form for the logged-in theatreAdmin
function AddShowTab() {
  const [myTheatres, setMyTheatres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState({
    theatre: '',
    screenName: '',
    movie: '',
    startTime: '',
    price: 250,
  });

  // Load owned theatres and available movies to populate dropdowns
  async function loadShowOptions() {
    setError('');
    try {
      const [tData, mData] = await Promise.all([
        apiFetch('/api/theatres/my'),
        apiFetch('/api/movies'),
      ]);
      setMyTheatres(tData.theatres);
      setMovies(mData.movies);
      if (tData.theatres.length > 0 && !showForm.theatre) {
        const first = tData.theatres[0];
        setShowForm((prev) => ({
          ...prev,
          theatre: first._id,
          screenName: first.screens[0]?.name || '',
          movie: mData.movies[0]?._id || '',
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadShowOptions();
  }, []);

  // Schedule a new show in an owned theatre (theatreAdmin)
  async function handleAddShow(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await apiFetch('/api/shows', {
        method: 'POST',
        body: JSON.stringify({
          ...showForm,
          price: Number(showForm.price),
        }),
      });
      setMessage('Show scheduled successfully.');
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedTheatreObj = myTheatres.find((t) => t._id === showForm.theatre);

  return (
    <div className="stack">
      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Schedule a Show</h2>
        <form onSubmit={handleAddShow}>
          <div className="form-group">
            <label>Theatre</label>
            <select
              className="select"
              value={showForm.theatre}
              onChange={(e) => {
                const chosen = myTheatres.find((t) => t._id === e.target.value);
                setShowForm({
                  ...showForm,
                  theatre: e.target.value,
                  screenName: chosen?.screens[0]?.name || '',
                });
              }}
              required
            >
              {myTheatres.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Screen</label>
            <select
              className="select"
              value={showForm.screenName}
              onChange={(e) => setShowForm({ ...showForm, screenName: e.target.value })}
              required
            >
              {(selectedTheatreObj?.screens || []).map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Movie</label>
            <select
              className="select"
              value={showForm.movie}
              onChange={(e) => setShowForm({ ...showForm, movie: e.target.value })}
              required
            >
              {movies.map((m) => (
                <option key={m._id} value={m._id}>{m.title}</option>
              ))}
            </select>
          </div>

          <div className="filter-bar">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Start Time</label>
              <input
                type="datetime-local"
                className="input"
                value={showForm.startTime}
                onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Ticket Price (₹)</label>
              <input
                type="number"
                min="1"
                className="input"
                value={showForm.price}
                onChange={(e) => setShowForm({ ...showForm, price: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn">Add Show</button>
        </form>
      </div>
    </div>
  );
}

export default AddShowTab;

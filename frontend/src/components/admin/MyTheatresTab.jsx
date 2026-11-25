// My Theatres tab for theatreAdmin: displays owned theatres and their screens
import { useEffect, useState } from 'react';
import apiFetch from '../../services/api';

// Fetches and lists the theatres owned by the logged-in theatreAdmin
function MyTheatresTab() {
  const [myTheatres, setMyTheatres] = useState([]);
  const [error, setError] = useState('');

  // Load owned theatres for the current theatreAdmin
  async function loadMyTheatres() {
    setError('');
    try {
      const data = await apiFetch('/api/theatres/my');
      setMyTheatres(data.theatres);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMyTheatres();
  }, []);

  return (
    <div className="stack">
      {error && <div className="error-msg">{error}</div>}
      {myTheatres.map((t) => (
        <div key={t._id} className="card">
          <h3>{t.name}</h3>
          <p className="muted">{t.city} • {t.address}</p>
          <p style={{ marginTop: '0.5rem' }}>
            <strong>Screens:</strong>{' '}
            {t.screens.map((s) => `${s.name} (${s.rows}x${s.seatsPerRow})`).join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
}

export default MyTheatresTab;

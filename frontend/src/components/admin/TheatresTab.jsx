// Theatres management tab for superAdmin: lists theatres and creates new ones
import { useEffect, useState } from 'react';
import apiFetch from '../../services/api';

// Manages the theatres list and create theatre form for superAdmin
function TheatresTab() {
  const [theatres, setTheatres] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    city: '',
    address: '',
    owner: '',
    screenName: 'Screen 1',
    rows: 6,
    seatsPerRow: 8,
  });

  // Fetch all theatres and available theatreAdmin users
  async function loadTheatres() {
    setError('');
    try {
      const [tData, aData] = await Promise.all([
        apiFetch('/api/theatres'),
        apiFetch('/api/auth/theatre-admins'),
      ]);
      setTheatres(tData.theatres);
      setAdmins(aData.admins);
      if (aData.admins.length > 0 && !theatreForm.owner) {
        setTheatreForm((prev) => ({ ...prev, owner: aData.admins[0]._id }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTheatres();
  }, []);

  // Create a new theatre with one initial screen (superAdmin)
  async function handleAddTheatre(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await apiFetch('/api/theatres', {
        method: 'POST',
        body: JSON.stringify({
          name: theatreForm.name,
          city: theatreForm.city,
          address: theatreForm.address,
          owner: theatreForm.owner,
          screens: [
            {
              name: theatreForm.screenName,
              rows: Number(theatreForm.rows),
              seatsPerRow: Number(theatreForm.seatsPerRow),
            },
          ],
        }),
      });
      setMessage('Theatre created successfully.');
      setTheatreForm((prev) => ({ ...prev, name: '', city: '', address: '' }));
      loadTheatres();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Create Theatre</h2>
        <form onSubmit={handleAddTheatre}>
          <div className="filter-bar">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Theatre Name</label>
              <input
                className="input"
                value={theatreForm.name}
                onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>City</label>
              <input
                className="input"
                value={theatreForm.city}
                onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input
              className="input"
              value={theatreForm.address}
              onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Theatre Owner (theatreAdmin)</label>
            <select
              className="select"
              value={theatreForm.owner}
              onChange={(e) => setTheatreForm({ ...theatreForm, owner: e.target.value })}
              required
            >
              {admins.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
          </div>
          <div className="filter-bar">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Screen Name</label>
              <input
                className="input"
                value={theatreForm.screenName}
                onChange={(e) => setTheatreForm({ ...theatreForm, screenName: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Rows</label>
              <input
                type="number"
                min="1"
                max="26"
                className="input"
                value={theatreForm.rows}
                onChange={(e) => setTheatreForm({ ...theatreForm, rows: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Seats Per Row</label>
              <input
                type="number"
                min="1"
                className="input"
                value={theatreForm.seatsPerRow}
                onChange={(e) => setTheatreForm({ ...theatreForm, seatsPerRow: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn">Create Theatre</button>
        </form>
      </div>

      <div className="card">
        <h2>All Theatres</h2>
        <div className="stack" style={{ marginTop: '0.75rem' }}>
          {theatres.map((t) => (
            <div key={t._id}>
              <strong>{t.name}</strong> — {t.city} (Owner: {t.owner?.name || 'N/A'})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TheatresTab;

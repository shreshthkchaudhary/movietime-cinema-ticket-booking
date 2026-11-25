// Movies management tab for superAdmin: lists, adds, and deletes movies
import { useEffect, useState } from 'react';
import apiFetch from '../../services/api';

// Manages the movies list and add/delete movie form for superAdmin
function MoviesTab() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: 'Sci-Fi',
    language: 'English',
    durationMins: 120,
    posterUrl: '',
    releaseDate: '',
  });

  // Fetch all movies from the backend
  async function loadMovies() {
    setError('');
    try {
      const data = await apiFetch('/api/movies');
      setMovies(data.movies);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  // Create a new movie (superAdmin)
  async function handleAddMovie(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await apiFetch('/api/movies', {
        method: 'POST',
        body: JSON.stringify({
          ...movieForm,
          durationMins: Number(movieForm.durationMins),
        }),
      });
      setMessage('Movie added successfully.');
      setMovieForm({
        title: '',
        description: '',
        genre: 'Sci-Fi',
        language: 'English',
        durationMins: 120,
        posterUrl: '',
        releaseDate: '',
      });
      loadMovies();
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete a movie (superAdmin)
  async function handleDeleteMovie(movieId) {
    setError('');
    setMessage('');
    try {
      await apiFetch(`/api/movies/${movieId}`, { method: 'DELETE' });
      setMessage('Movie deleted.');
      loadMovies();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>Add Movie</h2>
        <form onSubmit={handleAddMovie}>
          <div className="form-group">
            <label>Title</label>
            <input
              className="input"
              value={movieForm.title}
              onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="textarea"
              value={movieForm.description}
              onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
              required
            />
          </div>
          <div className="filter-bar">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Genre</label>
              <input
                className="input"
                value={movieForm.genre}
                onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Language</label>
              <input
                className="input"
                value={movieForm.language}
                onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Duration (mins)</label>
              <input
                type="number"
                className="input"
                value={movieForm.durationMins}
                onChange={(e) => setMovieForm({ ...movieForm, durationMins: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="filter-bar">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Poster URL</label>
              <input
                className="input"
                value={movieForm.posterUrl}
                onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Release Date</label>
              <input
                type="date"
                className="input"
                value={movieForm.releaseDate}
                onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn">Add Movie</button>
        </form>
      </div>

      <div className="card">
        <h2>All Movies</h2>
        <div className="stack" style={{ marginTop: '0.75rem' }}>
          {movies.map((m) => (
            <div key={m._id} className="row-between">
              <span>
                <strong>{m.title}</strong> ({m.genre}, {m.language})
              </span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteMovie(m._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MoviesTab;

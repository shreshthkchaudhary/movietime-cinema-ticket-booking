import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../services/api';

// Home page displaying movie cards with title search and genre filter
function HomePage() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch movies whenever search or genre filter changes
  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (genre) params.set('genre', genre);

        const data = await apiFetch(`/api/movies?${params.toString()}`);
        setMovies(data.movies);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [search, genre]);

  return (
    <div className="container">
      <h1>Now Showing</h1>

      <div className="filter-bar">
        <input
          type="text"
          className="input"
          placeholder="Search movies by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          <option value="Sci-Fi">Sci-Fi</option>
          <option value="Comedy">Comedy</option>
          <option value="Action">Action</option>
          <option value="Drama">Drama</option>
          <option value="Thriller">Thriller</option>
        </select>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Loading movies...</p>}

      {!loading && movies.length === 0 && (
        <p className="muted" style={{ marginTop: '1rem' }}>No movies found.</p>
      )}

      <div className="movie-grid">
        {movies.map((movie) => (
          <Link to={`/movies/${movie._id}`} key={movie._id} className="movie-card">
            <img
              src={movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'}
              alt={movie.title}
              className="movie-poster"
            />
            <div className="movie-card-body">
              <h3>{movie.title}</h3>
              <div>
                <span className="badge">{movie.genre}</span>{' '}
                <span className="badge">{movie.language}</span>
              </div>
              <p className="muted">{movie.durationMins} mins</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage;

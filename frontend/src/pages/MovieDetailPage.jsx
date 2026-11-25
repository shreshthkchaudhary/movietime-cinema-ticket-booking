import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiFetch from '../services/api';

// Shows movie details and a list of scheduled shows with theatre name and booking link
function MovieDetailPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load the selected movie and its scheduled shows
    async function loadMovie() {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch(`/api/movies/${id}`);
        setMovie(data.movie);
        setShows(data.shows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  if (loading) return <div className="container">Loading movie...</div>;
  if (error) return <div className="container"><div className="error-msg">{error}</div></div>;
  if (!movie) return <div className="container">Movie not found.</div>;

  return (
    <div className="container">
      <div className="detail-header">
        <img
          src={movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'}
          alt={movie.title}
          className="detail-poster"
        />
        <div className="stack">
          <h1>{movie.title}</h1>
          <div>
            <span className="badge">{movie.genre}</span>{' '}
            <span className="badge">{movie.language}</span>{' '}
            <span className="badge">{movie.durationMins} mins</span>
          </div>
          <p>{movie.description}</p>
        </div>
      </div>

      <h2>Available Shows</h2>
      {shows.length === 0 ? (
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          No shows scheduled for this movie yet.
        </p>
      ) : (
        <div className="stack" style={{ marginTop: '0.75rem' }}>
          {shows.map((show) => (
            <div key={show._id} className="card row-between">
              <div>
                <h3>{show.theatre?.name || 'Theatre'}</h3>
                <p className="muted">
                  {show.theatre?.city} • {show.screenName} •{' '}
                  {new Date(show.startTime).toLocaleString()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <strong>₹{show.price}</strong>
                <Link to={`/shows/${show._id}`} className="btn">
                  Book seats
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MovieDetailPage;

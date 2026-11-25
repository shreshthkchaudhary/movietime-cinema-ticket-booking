const Movie = require('../models/Movie');
const Show = require('../models/Show');

// Escape special regex characters so user search strings cannot crash MongoDB $regex
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/movies — List movies with optional title search and genre filter
async function getMovies(req, res, next) {
  try {
    const filter = {};

    // Filter by title (case-insensitive partial match)
    if (req.query.search) {
      filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };
    }

    // Filter by exact genre (case-insensitive)
    if (req.query.genre) {
      filter.genre = { $regex: `^${escapeRegex(req.query.genre)}$`, $options: 'i' };
    }

    const movies = await Movie.find(filter).sort({ releaseDate: -1 });
    res.json({ movies });
  } catch (error) {
    next(error);
  }
}

// GET /api/movies/:id — Get a single movie and its shows with theatre name populated
async function getMovieById(req, res, next) {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Fetch shows for this movie and include the theatre name, city, and address
    const shows = await Show.find({ movie: movie._id })
      .populate('theatre', 'name city address')
      .sort({ startTime: 1 });

    res.json({ movie, shows });
  } catch (error) {
    next(error);
  }
}

// POST /api/movies — Create a new movie (superAdmin only)
async function createMovie(req, res, next) {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json({ movie });
  } catch (error) {
    next(error);
  }
}

// PUT /api/movies/:id — Update an existing movie (superAdmin only)
async function updateMovie(req, res, next) {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({ movie });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/movies/:id — Permanently delete a movie (superAdmin only)
async function deleteMovie(req, res, next) {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};

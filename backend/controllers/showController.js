const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Movie = require('../models/Movie');

// GET /api/shows — List shows with optional movie or theatre filters
async function getShows(req, res, next) {
  try {
    const filter = {};
    if (req.query.movie) filter.movie = req.query.movie;
    if (req.query.theatre) filter.theatre = req.query.theatre;

    const shows = await Show.find(filter)
      .populate('movie', 'title genre language durationMins')
      .populate('theatre', 'name city')
      .sort({ startTime: 1 });

    res.json({ shows });
  } catch (error) {
    next(error);
  }
}

// GET /api/shows/:id — Get a single show along with its screen dimensions
async function getShowById(req, res, next) {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title genre language durationMins posterUrl')
      .populate('theatre', 'name city address screens');

    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    // Find the matching screen layout so the frontend can build the seat grid
    const screen = show.theatre.screens.find(
      (s) => s.name === show.screenName
    );

    res.json({ show, screen: screen || null });
  } catch (error) {
    next(error);
  }
}

// POST /api/shows — Create a new show (superAdmin or owning theatreAdmin)
async function createShow(req, res, next) {
  try {
    const { movie, theatre, screenName, startTime, price } = req.body;

    const movieDoc = await Movie.findById(movie);
    if (!movieDoc) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const theatreDoc = await Theatre.findById(theatre);
    if (!theatreDoc) {
      return res.status(404).json({ message: 'Theatre not found' });
    }

    // Theatre admins can only schedule shows in their own theatre
    if (
      req.user.role === 'theatreAdmin' &&
      theatreDoc.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Forbidden: you can only add shows to your own theatre',
      });
    }

    // Make sure the chosen screen exists in that theatre
    const screenExists = theatreDoc.screens.some((s) => s.name === screenName);
    if (!screenExists) {
      return res.status(400).json({
        message: `Screen "${screenName}" does not exist in this theatre`,
      });
    }

    // Duplicate (theatre, screenName, startTime) is blocked by the unique index
    const show = await Show.create({
      movie,
      theatre,
      screenName,
      startTime,
      price,
    });

    res.status(201).json({ show });
  } catch (error) {
    next(error);
  }
}

// PUT /api/shows/:id — Update a show (superAdmin or owning theatreAdmin)
async function updateShow(req, res, next) {
  try {
    const show = await Show.findById(req.params.id).populate('theatre');
    if (!show || !show.theatre) {
      return res.status(404).json({ message: 'Show or theatre not found' });
    }

    if (
      req.user.role === 'theatreAdmin' &&
      show.theatre.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Forbidden: you can only update shows in your own theatre',
      });
    }

    const { screenName, startTime, price } = req.body;
    if (screenName !== undefined) {
      const screenExists = show.theatre.screens.some((s) => s.name === screenName);
      if (!screenExists) {
        return res.status(400).json({
          message: `Screen "${screenName}" does not exist in this theatre`,
        });
      }
      show.screenName = screenName;
    }
    if (startTime !== undefined) show.startTime = startTime;
    if (price !== undefined) show.price = price;

    await show.save();
    res.json({ show });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/shows/:id — Permanently delete a show (superAdmin or owning theatreAdmin)
async function deleteShow(req, res, next) {
  try {
    const show = await Show.findById(req.params.id).populate('theatre');
    if (!show || !show.theatre) {
      return res.status(404).json({ message: 'Show or theatre not found' });
    }

    if (
      req.user.role === 'theatreAdmin' &&
      show.theatre.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Forbidden: you can only delete shows in your own theatre',
      });
    }

    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: 'Show deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
};

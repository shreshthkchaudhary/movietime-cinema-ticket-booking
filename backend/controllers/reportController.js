const Booking = require('../models/Booking');
const Theatre = require('../models/Theatre');

// Helper: build the optional theatre filter stage for theatreAdmin users
async function getTheatreFilterStage(user) {
  if (user.role !== 'theatreAdmin') {
    return null;
  }

  const ownedTheatreIds = await Theatre.find({ owner: user.id }).distinct('_id');
  return { $match: { 'showDoc.theatre': { $in: ownedTheatreIds } } };
}

// GET /api/reports/movies — Total bookings, seats sold, and revenue per movie
async function getMovieReport(req, res, next) {
  try {
    const pipeline = [
      // Stage 1: Include only confirmed bookings
      { $match: { status: 'confirmed' } },

      // Stage 2: Join the Show document to get movie and theatre IDs
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'showDoc',
        },
      },
      { $unwind: '$showDoc' },
    ];

    // Stage 3 (theatreAdmin only): Restrict to shows in theatres they own
    const theatreFilter = await getTheatreFilterStage(req.user);
    if (theatreFilter) {
      pipeline.push(theatreFilter);
    }

    pipeline.push(
      // Stage 4: Join the Movie document to get the movie title
      {
        $lookup: {
          from: 'movies',
          localField: 'showDoc.movie',
          foreignField: '_id',
          as: 'movieDoc',
        },
      },
      { $unwind: '$movieDoc' },

      // Stage 5: Group by movie and sum bookings, seats sold, and revenue
      {
        $group: {
          _id: '$movieDoc._id',
          title: { $first: '$movieDoc.title' },
          totalBookings: { $sum: 1 },
          seatsSold: { $sum: { $size: '$seats' } },
          revenue: { $sum: '$totalAmount' },
        },
      },

      // Stage 6: Sort highest revenue first
      { $sort: { revenue: -1 } }
    );

    const report = await Booking.aggregate(pipeline);
    res.json({ report });
  } catch (error) {
    next(error);
  }
}

// GET /api/reports/shows — Total bookings, seats sold, and revenue per show
async function getShowReport(req, res, next) {
  try {
    const pipeline = [
      // Stage 1: Include only confirmed bookings
      { $match: { status: 'confirmed' } },

      // Stage 2: Join the Show document
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'showDoc',
        },
      },
      { $unwind: '$showDoc' },
    ];

    // Stage 3 (theatreAdmin only): Restrict to shows in theatres they own
    const theatreFilter = await getTheatreFilterStage(req.user);
    if (theatreFilter) {
      pipeline.push(theatreFilter);
    }

    pipeline.push(
      // Stage 4: Join Movie and Theatre documents for readable names
      {
        $lookup: {
          from: 'movies',
          localField: 'showDoc.movie',
          foreignField: '_id',
          as: 'movieDoc',
        },
      },
      { $unwind: '$movieDoc' },
      {
        $lookup: {
          from: 'theatres',
          localField: 'showDoc.theatre',
          foreignField: '_id',
          as: 'theatreDoc',
        },
      },
      { $unwind: '$theatreDoc' },

      // Stage 5: Group by show and calculate totals
      {
        $group: {
          _id: '$showDoc._id',
          movieTitle: { $first: '$movieDoc.title' },
          theatreName: { $first: '$theatreDoc.name' },
          startTime: { $first: '$showDoc.startTime' },
          totalBookings: { $sum: 1 },
          seatsSold: { $sum: { $size: '$seats' } },
          revenue: { $sum: '$totalAmount' },
        },
      },

      // Stage 6: Sort by show start time
      { $sort: { startTime: 1 } }
    );

    const report = await Booking.aggregate(pipeline);
    res.json({ report });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMovieReport, getShowReport };

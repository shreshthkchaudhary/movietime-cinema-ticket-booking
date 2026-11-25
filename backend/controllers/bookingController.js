const crypto = require('crypto');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const { getLocks, unlockSeat } = require('../sockets/seatLocks');
const { isValidSeatForScreen } = require('../utils/seatUtils');

// POST /api/bookings — Create a confirmed booking with an atomic seat-lock update
async function createBooking(req, res, next) {
  try {
    const { showId, seats } = req.body;

    // 1. Basic validation on seats array
    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: 'showId and a non-empty seats array are required' });
    }

    if (seats.length > 6) {
      return res.status(400).json({ message: 'You can book a maximum of 6 seats at once' });
    }

    if (new Set(seats).size !== seats.length) {
      return res.status(400).json({ message: 'Duplicate seats are not allowed' });
    }

    // 2. Load the show and verify it exists and has not started yet
    const show = await Show.findById(showId).populate('theatre');
    if (!show || !show.theatre) {
      return res.status(404).json({ message: 'Show or theatre not found' });
    }

    if (new Date(show.startTime) <= new Date()) {
      return res.status(400).json({ message: 'Cannot book seats for a show that has already started' });
    }

    // 3. Validate every seat against the screen dimensions
    const screen = show.theatre.screens.find((s) => s.name === show.screenName);
    if (!screen) {
      return res.status(400).json({ message: 'Screen configuration not found for this show' });
    }

    const allValid = seats.every((seat) => isValidSeatForScreen(seat, screen));
    if (!allValid) {
      return res.status(400).json({ message: 'One or more seats are invalid for this screen' });
    }

    // 4. Reject if any requested seat is currently locked by another user
    const activeLocks = getLocks(showId.toString());
    for (const seat of seats) {
      if (activeLocks[seat] && activeLocks[seat] !== req.user.id) {
        return res.status(409).json({
          message: `Seat ${seat} is currently locked by another user`,
        });
      }
    }

    // 5. Calculate total amount on the server (never trust client price)
    const totalAmount = seats.length * show.price;

    // 6. Atomic update: only push seats if NONE of them are already in bookedSeats
    const updatedShow = await Show.findOneAndUpdate(
      { _id: showId, bookedSeats: { $nin: seats } },
      { $push: { bookedSeats: { $each: seats } } },
      { new: true }
    );

    if (!updatedShow) {
      return res.status(409).json({ message: 'Some seats are already booked' });
    }

    // 7. Create the booking record; rollback Show.bookedSeats if creating Booking fails
    const ticketCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    let booking;
    try {
      booking = await Booking.create({
        user: req.user.id,
        show: showId,
        seats,
        totalAmount,
        ticketCode,
        status: 'confirmed',
      });
    } catch (bookingError) {
      // Rollback the seats pushed to the show so they don't stay stuck as booked
      await Show.findByIdAndUpdate(showId, {
        $pull: { bookedSeats: { $in: seats } },
      });
      return next(bookingError);
    }

    // 8. Clear this user's locks for the booked seats
    for (const seat of seats) {
      unlockSeat(showId.toString(), seat, req.user.id);
    }

    // Broadcast to everyone viewing this show that these seats are now booked
    const io = req.app.get('io');
    if (io) {
      io.to(`show:${showId}`).emit('seats-booked', {
        showId: showId.toString(),
        seats,
      });
    }

    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
}

// GET /api/bookings/my — List logged-in user's bookings, newest first
async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'show',
        select: 'startTime screenName price movie theatre',
        populate: [
          { path: 'movie', select: 'title genre language durationMins posterUrl' },
          { path: 'theatre', select: 'name city address' },
        ],
      });

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
}

// GET /api/bookings/:id — Get a single booking (only owner or superAdmin)
async function getBookingById(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'show',
      select: 'startTime screenName price movie theatre',
      populate: [
        { path: 'movie', select: 'title genre language durationMins' },
        { path: 'theatre', select: 'name city address' },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only the booking owner or superAdmin can view this booking
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== 'superAdmin'
    ) {
      return res.status(403).json({
        message: 'Forbidden: you cannot view another user\'s booking',
      });
    }

    res.json({ booking });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/bookings/:id/cancel — Cancel a confirmed booking before showtime
async function cancelBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('show');
    if (!booking || !booking.show) {
      return res.status(404).json({ message: 'Booking or show not found' });
    }

    // Only the booking owner can cancel
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Forbidden: you can only cancel your own bookings',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (new Date(booking.show.startTime) <= new Date()) {
      return res.status(400).json({
        message: 'Cannot cancel booking after the show has started',
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Free the booked seats back on the Show document
    await Show.findByIdAndUpdate(booking.show._id, {
      $pull: { bookedSeats: { $in: booking.seats } },
    });

    // Broadcast to everyone viewing this show that the cancelled seats are free again
    const io = req.app.get('io');
    if (io) {
      io.to(`show:${booking.show._id}`).emit('seats-unlocked', {
        showId: booking.show._id.toString(),
        seats: booking.seats,
      });
    }

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};

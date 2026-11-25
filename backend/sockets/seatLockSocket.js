const jwt = require('jsonwebtoken');
const Show = require('../models/Show');
const { isValidSeatForScreen } = require('../utils/seatUtils');
const {
  getLocks,
  lockSeat,
  unlockSeat,
  countUserLocks,
  releaseUserLocks,
} = require('./seatLocks');

// Attach JWT authentication and seat-locking event handlers to Socket.IO
function setupSeatLockSocket(io) {
  // Verify the JWT access token during the socket handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a show room and send back all seats currently locked for that show
    socket.on('join-show', ({ showId }) => {
      if (!showId) return;
      socket.join(`show:${showId}`);
      socket.emit('current-locks', {
        showId,
        locks: getLocks(showId),
      });
    });

    // Leave a show room and release any locks this user held in that show
    socket.on('leave-show', ({ showId }) => {
      if (!showId) return;
      socket.leave(`show:${showId}`);

      const released = releaseUserLocks(socket.user.id, showId);
      for (const item of released) {
        io.to(`show:${item.showId}`).emit('seats-unlocked', {
          showId: item.showId,
          seats: item.seats,
        });
      }
    });

    // Lock a seat for the connected user after checking DB and lock limits
    socket.on('lock-seat', async ({ showId, seat }) => {
      try {
        if (!showId || !seat) {
          return socket.emit('lock-error', { message: 'showId and seat are required' });
        }

        const show = await Show.findById(showId).populate('theatre');
        if (!show || !show.theatre) {
          return socket.emit('lock-error', { message: 'Show or theatre not found' });
        }

        // Validate the seat label against the screen's rows and seatsPerRow
        const screen = show.theatre.screens.find(
          (s) => s.name === show.screenName
        );
        if (!isValidSeatForScreen(seat, screen)) {
          return socket.emit('lock-error', {
            message: `Seat ${seat} is invalid for this screen`,
          });
        }

        // Reject if the seat is already permanently booked in MongoDB
        if (show.bookedSeats.includes(seat)) {
          return socket.emit('lock-error', {
            message: `Seat ${seat} is already booked`,
          });
        }

        // Enforce maximum 6 locked seats per user per show
        if (countUserLocks(showId, socket.user.id) >= 6) {
          return socket.emit('lock-error', {
            message: 'You can lock a maximum of 6 seats at once',
          });
        }

        // Try to acquire the lock; broadcast seats-unlocked if it auto-expires after 2 mins
        const locked = lockSeat(
          showId,
          seat,
          socket.user.id,
          (expiredShowId, expiredSeat) => {
            io.to(`show:${expiredShowId}`).emit('seats-unlocked', {
              showId: expiredShowId,
              seats: [expiredSeat],
            });
          }
        );

        if (!locked) {
          return socket.emit('lock-error', {
            message: `Seat ${seat} is locked by another user`,
          });
        }

        io.to(`show:${showId}`).emit('seats-locked', {
          showId,
          seats: [seat],
          userId: socket.user.id,
        });
      } catch (error) {
        socket.emit('lock-error', { message: 'Failed to lock seat' });
      }
    });

    // Unlock a seat owned by the connected user
    socket.on('unlock-seat', ({ showId, seat }) => {
      if (!showId || !seat) return;

      const unlocked = unlockSeat(showId, seat, socket.user.id);
      if (!unlocked) {
        return socket.emit('lock-error', {
          message: 'Cannot unlock a seat you do not hold',
        });
      }

      io.to(`show:${showId}`).emit('seats-unlocked', {
        showId,
        seats: [seat],
      });
    });

    // Release all locks held by this user when their socket disconnects
    socket.on('disconnect', () => {
      const released = releaseUserLocks(socket.user.id);
      for (const item of released) {
        io.to(`show:${item.showId}`).emit('seats-unlocked', {
          showId: item.showId,
          seats: item.seats,
        });
      }
    });
  });
}

module.exports = setupSeatLockSocket;

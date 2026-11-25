// In-memory store of active seat locks: Map<showId, Map<seatLabel, { userId, timer }>>
const seatLocks = new Map();

// Auto-release timeout for a seat lock (2 minutes)
const LOCK_DURATION_MS = 2 * 60 * 1000;

// Return an object of currently locked seats for a show: { A1: userId, ... }
function getLocks(showId) {
  const showMap = seatLocks.get(showId);
  if (!showMap) return {};

  const result = {};
  for (const [seat, info] of showMap.entries()) {
    result[seat] = info.userId;
  }
  return result;
}

// Lock a seat for a user and set a 2-minute timer to auto-unlock it
function lockSeat(showId, seat, userId, onExpire) {
  if (!seatLocks.has(showId)) {
    seatLocks.set(showId, new Map());
  }

  const showMap = seatLocks.get(showId);
  const existing = showMap.get(seat);

  // Reject if another user already holds the lock
  if (existing && existing.userId !== userId) {
    return false;
  }

  // Clear previous timer if the same user is refreshing their lock
  if (existing && existing.timer) {
    clearTimeout(existing.timer);
  }

  // Auto-release the lock after 2 minutes if not booked or unlocked
  const timer = setTimeout(() => {
    const current = showMap.get(seat);
    if (current && current.userId === userId) {
      showMap.delete(seat);
      if (showMap.size === 0) {
        seatLocks.delete(showId);
      }
      if (typeof onExpire === 'function') {
        onExpire(showId, seat);
      }
    }
  }, LOCK_DURATION_MS);

  showMap.set(seat, { userId, timer });
  return true;
}

// Unlock a seat if it belongs to the given user (or force-unlock if userId is omitted)
function unlockSeat(showId, seat, userId) {
  const showMap = seatLocks.get(showId);
  if (!showMap) return false;

  const existing = showMap.get(seat);
  if (!existing) return false;

  if (userId && existing.userId !== userId) {
    return false;
  }

  clearTimeout(existing.timer);
  showMap.delete(seat);

  if (showMap.size === 0) {
    seatLocks.delete(showId);
  }
  return true;
}

// Count how many seats a user currently has locked in a given show
function countUserLocks(showId, userId) {
  const showMap = seatLocks.get(showId);
  if (!showMap) return 0;

  let count = 0;
  for (const info of showMap.values()) {
    if (info.userId === userId) count++;
  }
  return count;
}

// Release all locks held by a user (for one show, or all shows if showId is null)
function releaseUserLocks(userId, targetShowId = null) {
  const released = [];

  for (const [showId, showMap] of seatLocks.entries()) {
    if (targetShowId && showId !== targetShowId) continue;

    const freedSeats = [];
    for (const [seat, info] of showMap.entries()) {
      if (info.userId === userId) {
        clearTimeout(info.timer);
        showMap.delete(seat);
        freedSeats.push(seat);
      }
    }

    if (showMap.size === 0) {
      seatLocks.delete(showId);
    }

    if (freedSeats.length > 0) {
      released.push({ showId, seats: freedSeats });
    }
  }

  return released;
}

module.exports = {
  seatLocks,
  getLocks,
  lockSeat,
  unlockSeat,
  countUserLocks,
  releaseUserLocks,
};

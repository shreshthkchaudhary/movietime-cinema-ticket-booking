// Check that a seat label is in exact canonical form (e.g. "A1") and fits the screen
function isValidSeatForScreen(seat, screen) {
  if (typeof seat !== 'string' || seat.length < 2 || !screen) {
    return false;
  }

  const rowLetter = seat[0];
  const rowIndex = rowLetter.charCodeAt(0) - 64; // 'A' -> 1, 'B' -> 2, etc.
  if (rowIndex < 1 || rowIndex > screen.rows) {
    return false;
  }

  const seatNumber = parseInt(seat.slice(1), 10);
  if (
    !Number.isInteger(seatNumber) ||
    seatNumber < 1 ||
    seatNumber > screen.seatsPerRow
  ) {
    return false;
  }

  // Exact match rejects non-canonical strings like "A01", "A 1", or "A1e0"
  return seat === rowLetter + seatNumber;
}

module.exports = { isValidSeatForScreen };

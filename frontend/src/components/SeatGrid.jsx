// Renders the cinema seat grid (A1, A2, ...) with a screen bar and status legend
function SeatGrid({
  rows,
  seatsPerRow,
  bookedSeats,
  lockedSeats,
  selectedSeats,
  onSeatClick,
}) {
  const rowIndexes = Array.from({ length: rows }, (_, i) => i);
  const colNumbers = Array.from({ length: seatsPerRow }, (_, i) => i + 1);

  return (
    <div className="seat-map-wrap">
      <div className="screen-bar">SCREEN</div>

      <div className="seat-grid">
        {rowIndexes.map((rowIdx) => {
          const rowLetter = String.fromCharCode(65 + rowIdx);

          return (
            <div key={rowLetter} className="seat-row">
              <span className="row-label">{rowLetter}</span>
              <div className="seat-row-buttons">
                {colNumbers.map((num) => {
                  const seatLabel = `${rowLetter}${num}`;
                  const isBooked = bookedSeats.includes(seatLabel);
                  const isLockedByOther = lockedSeats.includes(seatLabel);
                  const isSelectedByMe = selectedSeats.includes(seatLabel);

                  let statusClass = 'seat-available';
                  if (isBooked) statusClass = 'seat-booked';
                  else if (isSelectedByMe) statusClass = 'seat-selected';
                  else if (isLockedByOther) statusClass = 'seat-locked';

                  const isDisabled = isBooked || isLockedByOther;

                  return (
                    <button
                      key={seatLabel}
                      type="button"
                      disabled={isDisabled}
                      className={`seat-btn ${statusClass}`}
                      onClick={() => onSeatClick(seatLabel)}
                    >
                      {seatLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="seat-legend">
        <span><i className="legend-box seat-available" /> Available</span>
        <span><i className="legend-box seat-selected" /> Selected by you</span>
        <span><i className="legend-box seat-locked" /> Locked by other</span>
        <span><i className="legend-box seat-booked" /> Booked</span>
      </div>
    </div>
  );
}

export default SeatGrid;

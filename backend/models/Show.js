const mongoose = require('mongoose');

// Schema for a scheduled movie show in a specific theatre screen
const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie is required'],
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre is required'],
    },
    screenName: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    price: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [1, 'Price must be greater than 0'],
    },
    // Stores seat labels like ['A1', 'A2'] that are already booked
    bookedSeats: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Unique compound index prevents two shows at the exact same theatre, screen, and start time
showSchema.index({ theatre: 1, screenName: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Show', showSchema);

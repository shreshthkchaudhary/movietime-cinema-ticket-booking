const mongoose = require('mongoose');

// Embedded schema for each screen inside a theatre
const screenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Screen name is required'],
      trim: true,
    },
    rows: {
      type: Number,
      required: [true, 'Number of rows is required'],
      min: [1, 'Rows must be at least 1'],
      max: [26, 'Rows cannot exceed 26 (A-Z)'],
    },
    seatsPerRow: {
      type: Number,
      required: [true, 'Seats per row is required'],
      min: [1, 'Seats per row must be at least 1'],
    },
  },
  { _id: false }
);

// Schema for cinema theatres owned by a theatreAdmin user
const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Theatre owner is required'],
    },
    screens: {
      type: [screenSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes to quickly look up theatres by owner or city
theatreSchema.index({ owner: 1 });
theatreSchema.index({ city: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);

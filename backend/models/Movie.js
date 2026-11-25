const mongoose = require('mongoose');

// Schema for movies listed on MovieTime
const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    durationMins: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    posterUrl: {
      type: String,
      default: '',
      trim: true,
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index to speed up filtering active movies sorted by release date
movieSchema.index({ isActive: 1, releaseDate: -1 });

module.exports = mongoose.model('Movie', movieSchema);

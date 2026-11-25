const express = require('express');
const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public browse routes
router.get('/', getMovies);
router.get('/:id', getMovieById);

// SuperAdmin-only management routes
router.post('/', protect, authorizeRoles('superAdmin'), createMovie);
router.put('/:id', protect, authorizeRoles('superAdmin'), updateMovie);
router.delete('/:id', protect, authorizeRoles('superAdmin'), deleteMovie);

module.exports = router;

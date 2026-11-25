const express = require('express');
const {
  getTheatres,
  getMyTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getTheatres);

// Protected route for theatreAdmin to view their own theatres (placed before /:id)
router.get('/my', protect, authorizeRoles('theatreAdmin', 'superAdmin'), getMyTheatres);

router.get('/:id', getTheatreById);

// Management routes
router.post('/', protect, authorizeRoles('superAdmin'), createTheatre);
router.put('/:id', protect, authorizeRoles('superAdmin', 'theatreAdmin'), updateTheatre);
router.delete('/:id', protect, authorizeRoles('superAdmin'), deleteTheatre);

module.exports = router;

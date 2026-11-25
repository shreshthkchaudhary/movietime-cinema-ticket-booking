const express = require('express');
const {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getShows);
router.get('/:id', getShowById);

// Management routes
router.post('/', protect, authorizeRoles('superAdmin', 'theatreAdmin'), createShow);
router.put('/:id', protect, authorizeRoles('superAdmin', 'theatreAdmin'), updateShow);
router.delete('/:id', protect, authorizeRoles('superAdmin', 'theatreAdmin'), deleteShow);

module.exports = router;

const express = require('express');
const { getMovieReport, getShowReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Only superAdmin and theatreAdmin can access collection reports
router.get('/movies', protect, authorizeRoles('superAdmin', 'theatreAdmin'), getMovieReport);
router.get('/shows', protect, authorizeRoles('superAdmin', 'theatreAdmin'), getShowReport);

module.exports = router;

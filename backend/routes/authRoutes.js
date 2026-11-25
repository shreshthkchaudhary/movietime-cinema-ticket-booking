const express = require('express');
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  getTheatreAdmins,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected authentication routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/theatre-admins', protect, authorizeRoles('superAdmin'), getTheatreAdmins);

module.exports = router;

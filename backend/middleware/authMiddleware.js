const jwt = require('jsonwebtoken');

// Verify JWT access token from the Authorization header and attach user info to req.user
function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Expect header format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach minimal user payload for downstream controllers and role checks
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    error.statusCode = 401;
    error.message = 'Not authorized, invalid or expired token';
    next(error);
  }
}

module.exports = { protect };

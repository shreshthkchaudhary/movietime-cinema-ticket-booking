require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const setupSeatLockSocket = require('./sockets/seatLockSocket');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const server = http.createServer(app);
const rawClientOrigin = process.env.CLIENT_ORIGIN;
const clientOrigin = rawClientOrigin ? rawClientOrigin.replace(/\/+$/, '') : null;

const io = new Server(
  server,
  clientOrigin ? { cors: { origin: clientOrigin, methods: ['GET', 'POST'] } } : {}
);

// Allow cross-origin requests from the deployed frontend when CLIENT_ORIGIN is set
if (clientOrigin) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', clientOrigin);
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });
}

// Make io available inside controllers via req.app.get('io')
app.set('io', io);
setupSeatLockSocket(io);

// Parse incoming JSON request bodies
app.use(express.json());

// Simple health-check route to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MovieTime API is running' });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reports', reportRoutes);

// 404 and centralised error-handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening for requests
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

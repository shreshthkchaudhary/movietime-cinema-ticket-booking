# MovieTime – Viva Preparation Notes

## Capstone Requirements Mapping

| Requirement | Exact File | Function / Implementation |
| :--- | :--- | :--- |
| **Backend MVC Structure** | `backend/` | `config/`, `models/`, `controllers/`, `routes/`, `middleware/` |
| **Environment Variables & Security** | `backend/.env.example`, `.gitignore` | `dotenv.config()` in `backend/server.js`; `.env` is gitignored |
| **Password Hashing (`bcrypt`)** | `backend/controllers/authController.js` | `register()` (`bcrypt.hash`) and `login()` (`bcrypt.compare`) |
| **JWT Access & Refresh Tokens** | `backend/controllers/authController.js` | `generateTokens()`, `login()`, `refresh()`, `logout()` |
| **Protected Route Middleware** | `backend/middleware/authMiddleware.js` | `protect()` verifies `Bearer` token and sets `req.user` |
| **RBAC Middleware** | `backend/middleware/roleMiddleware.js` | `authorizeRoles(...allowedRoles)` checks `user` / `theatreAdmin` / `superAdmin` |
| **Mongoose Validation** | `backend/models/*.js` | Required fields, `min`/`max`, `enum`, `unique`, and `seats` array validator in `Booking.js` |
| **Collection Relationships** | `backend/models/Theatre.js`, `Show.js`, `Booking.js` | `ObjectId` refs (`owner -> User`, `movie -> Movie`, `theatre -> Theatre`, `show -> Show`, `user -> User`) |
| **MongoDB Indexes** | `backend/models/Show.js`, `Booking.js`, `Movie.js`, `Theatre.js` | Unique `Show({ theatre: 1, screenName: 1, startTime: 1 })`, `Booking({ user: 1, createdAt: -1 })`, `Movie({ isActive: 1, releaseDate: -1 })`, `Theatre({ owner: 1 })` & `Theatre({ city: 1 })` |
| **Aggregation Pipelines** | `backend/controllers/reportController.js` | `getMovieReport()` & `getShowReport()` (`$match`, `$lookup`, `$unwind`, `$group`, `$sort`) |
| **Centralised Error Middleware** | `backend/middleware/errorMiddleware.js` | `notFound()` and `errorHandler()` handling CastError, ValidationError, 11000, JWT errors |
| **Atomic Double-Booking Guard** | `backend/controllers/bookingController.js` | `createBooking()` uses `Show.findOneAndUpdate` with `bookedSeats: { $nin: seats }` |
| **Ticket Code Generation (`crypto`)** | `backend/controllers/bookingController.js` | `createBooking()` uses `crypto.randomBytes(4).toString('hex').toUpperCase()` |
| **Live Seat Locking (Socket.IO)** | `backend/sockets/seatLockSocket.js`, `seatLocks.js` | `setupSeatLockSocket()` + in-memory `Map` with 2-min `setTimeout` auto-release |
| **Postman Collection** | `postman_collection.json` | Exportable Postman v2.1 collection with auto-saved variables & negative tests |
| **React Routing** | `frontend/src/App.jsx` | `BrowserRouter`, `Routes`, `Route` for `/`, `/movies/:id`, `/shows/:id`, `/my-bookings`, `/login`, `/register`, `/admin` |
| **Context API** | `frontend/src/context/AuthContext.jsx` | `AuthProvider` and `useAuth()` managing `user`, `login()`, `register()`, `logout()` |
| **Controlled Forms** | `frontend/src/pages/LoginPage.jsx`, `RegisterPage.jsx`, `AdminDashboardPage.jsx` | React `useState` bound to `value` and `onChange` on all inputs |
| **Protected & Role-Based Pages** | `frontend/src/components/ProtectedRoute.jsx`, `RoleRoute.jsx` | Redirects unauthenticated users to `/login`; restricts `/admin` to `theatreAdmin` and `superAdmin` |
| **Live Seat Map UI** | `frontend/src/components/SeatGrid.jsx`, `pages/SeatSelectionPage.jsx` | Renders `rows x seatsPerRow` grid, syncs `seats-locked`, `seats-unlocked`, `seats-booked` |

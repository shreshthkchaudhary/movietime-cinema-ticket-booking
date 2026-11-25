const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Booking = require('../models/Booking');

const BASE_URL = 'http://localhost:5000';

// Helper to make JSON fetch requests and return { status, data }
async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// Print PASS or FAIL line for each audit check
function logResult(num, label, passed, detail = '') {
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`[${tag}] Test ${num}: ${label}${detail ? ' -> ' + detail : ''}`);
}

// Run all 10 end-to-end REST checks and clean up any test data created
async function runAudit() {
  const ts = Date.now();
  const user1Email = `audit1_${ts}@test.com`;
  const user2Email = `audit2_${ts}@test.com`;

  let tempShowId = null;
  let adminToken = null;
  const createdUserIds = [];

  try {
    // 1. Register ignores "role": "superAdmin"
    const reg1 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Audit User 1',
        email: user1Email,
        password: 'password123',
        role: 'superAdmin',
      }),
    });
    if (reg1.data.user?.id) createdUserIds.push(reg1.data.user.id);
    const t1Pass = reg1.status === 201 && reg1.data.user?.role === 'user';
    logResult(1, 'Register ignores role: superAdmin', t1Pass, `status=${reg1.status}, role=${reg1.data.user?.role}`);

    // Register a second user for cross-user tests
    const reg2 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Audit User 2',
        email: user2Email,
        password: 'password123',
      }),
    });
    if (reg2.data.user?.id) createdUserIds.push(reg2.data.user.id);
    const user2Token = reg2.data.accessToken;

    // 2. Login, /me, refresh, logout, old refresh returns 401
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user1Email, password: 'password123' }),
    });
    const u1Access = loginRes.data.accessToken;
    const u1Refresh = loginRes.data.refreshToken;

    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${u1Access}` },
    });
    const refRes = await request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: u1Refresh }),
    });
    const newAccess = refRes.data.accessToken;
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${newAccess}` },
    });
    const refAfterLogout = await request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: u1Refresh }),
    });
    const t2Pass =
      loginRes.status === 200 &&
      meRes.status === 200 &&
      refRes.status === 200 &&
      Boolean(newAccess) &&
      logoutRes.status === 200 &&
      refAfterLogout.status === 401;
    logResult(
      2,
      'Login -> /me -> refresh -> logout -> old refresh 401',
      t2Pass,
      `login=${loginRes.status}, me=${meRes.status}, refresh=${refRes.status}, logout=${logoutRes.status}, oldRefresh=${refAfterLogout.status}`
    );

    // Re-login user 1 for booking tests
    const relogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user1Email, password: 'password123' }),
    });
    const user1Token = relogin.data.accessToken;

    // 3. Normal user gets 403 on POST /api/movies and GET /api/reports/movies
    const userCreateMovie = await request('/api/movies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({
        title: 'Blocked',
        description: 'Blocked',
        genre: 'Drama',
        language: 'English',
        durationMins: 90,
        releaseDate: '2025-01-01',
      }),
    });
    const userReport = await request('/api/reports/movies', {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const t3Pass = userCreateMovie.status === 403 && userReport.status === 403;
    logResult(
      3,
      'Normal user gets 403 on POST /api/movies and GET /api/reports/movies',
      t3Pass,
      `movie=${userCreateMovie.status}, report=${userReport.status}`
    );

    // 4. Invalid ObjectId in URL returns 400, not 500
    const badIdRes = await request('/api/movies/invalid-object-id');
    const t4Pass = badIdRes.status === 400;
    logResult(4, 'Invalid ObjectId in URL returns 400', t4Pass, `status=${badIdRes.status}`);

    // Log in superAdmin and theatreAdmin to set up a clean temporary show on theatre 1
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@movietime.com', password: 'admin123' }),
    });
    adminToken = adminLogin.data.accessToken;

    const theatreLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'theatre@movietime.com', password: 'theatre123' }),
    });
    const theatreToken = theatreLogin.data.accessToken;
    const theatre1Id = theatreLogin.data.user?.id;

    const moviesList = await request('/api/movies');
    const theatresList = await request('/api/theatres');
    const movieId = moviesList.data.movies?.[0]?._id;
    const ownTheatre = (theatresList.data.theatres || []).find(
      (t) => t.owner?._id === theatre1Id || t.owner === theatre1Id
    );

    const createShowRes = await request('/api/shows', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        movie: movieId,
        theatre: ownTheatre._id,
        screenName: ownTheatre.screens[0].name,
        startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        price: 250,
      }),
    });
    tempShowId = createShowRes.data.show?._id;
    const showPrice = createShowRes.data.show?.price || 250;

    // 5. Booking ["A1"] works, duplicate ["A1"] -> 409, ["A01"] -> 400, 7 seats -> 400, totalAmount ignored
    const bA1 = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ showId: tempShowId, seats: ['A1'], totalAmount: 1 }),
    });
    const bA1Dup = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ showId: tempShowId, seats: ['A1'] }),
    });
    const bA01 = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ showId: tempShowId, seats: ['A01'] }),
    });
    const b7Seats = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({
        showId: tempShowId,
        seats: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'],
      }),
    });
    const t5Pass =
      bA1.status === 201 &&
      bA1.data.booking?.totalAmount === showPrice &&
      bA1Dup.status === 409 &&
      bA01.status === 400 &&
      b7Seats.status === 400;
    logResult(
      5,
      'Booking validation, 409 duplicate, A01->400, 7 seats->400, server totalAmount',
      t5Pass,
      `A1=${bA1.status} (amt=${bA1.data.booking?.totalAmount}), dup=${bA1Dup.status}, A01=${bA01.status}, seven=${b7Seats.status}`
    );

    // 6. Promise.all race condition on free seat C1
    const [race1, race2] = await Promise.all([
      request('/api/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user1Token}` },
        body: JSON.stringify({ showId: tempShowId, seats: ['C1'] }),
      }),
      request('/api/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${user2Token}` },
        body: JSON.stringify({ showId: tempShowId, seats: ['C1'] }),
      }),
    ]);
    const raceStatuses = [race1.status, race2.status].sort((a, b) => a - b);
    const t6Pass = raceStatuses[0] === 201 && raceStatuses[1] === 409;
    logResult(6, 'Promise.all concurrent booking gives one 201 and one 409', t6Pass, `statuses=${raceStatuses.join(',')}`);

    // 7. User 2 gets 403 viewing or cancelling User 1's booking
    const u1BookingId = bA1.data.booking?._id;
    const viewOther = await request(`/api/bookings/${u1BookingId}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const cancelOther = await request(`/api/bookings/${u1BookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const t7Pass = viewOther.status === 403 && cancelOther.status === 403;
    logResult(7, 'Second user gets 403 on viewing/cancelling another booking', t7Pass, `view=${viewOther.status}, cancel=${cancelOther.status}`);

    // 8. Cancel works once, second cancel fails, seat A1 can be booked again
    const cancel1 = await request(`/api/bookings/${u1BookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const cancel2 = await request(`/api/bookings/${u1BookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const rebookA1 = await request('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ showId: tempShowId, seats: ['A1'] }),
    });
    const t8Pass = cancel1.status === 200 && cancel2.status === 400 && rebookA1.status === 201;
    logResult(
      8,
      'Cancel works once, second cancel fails, seat can be rebooked',
      t8Pass,
      `cancel1=${cancel1.status}, cancel2=${cancel2.status}, rebook=${rebookA1.status}`
    );

    // 9. theatre@movietime.com gets 403 on second theatre's show, and 200 editing its own show
    const showsList = await request('/api/shows');
    const otherTheatre = (theatresList.data.theatres || []).find(
      (t) => t.owner?._id !== theatre1Id && t.owner !== theatre1Id
    );
    const otherShow = (showsList.data.shows || []).find(
      (s) => otherTheatre && (s.theatre?._id === otherTheatre._id || s.theatre === otherTheatre._id)
    );

    const editOther = await request(`/api/shows/${otherShow?._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${theatreToken}` },
      body: JSON.stringify({ price: 999 }),
    });
    const delOther = await request(`/api/shows/${otherShow?._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${theatreToken}` },
    });
    const editOwn = await request(`/api/shows/${tempShowId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${theatreToken}` },
      body: JSON.stringify({ price: 275 }),
    });
    const t9Pass = editOther.status === 403 && delOther.status === 403 && editOwn.status === 200;
    logResult(
      9,
      'theatreAdmin gets 403 on other theatre show and 200 on own show',
      t9Pass,
      `editOther=${editOther.status}, delOther=${delOther.status}, editOwn=${editOwn.status}`
    );

    // 10. GET /api/movies?search=( does not return 500
    const regexSearch = await request('/api/movies?search=(');
    const t10Pass = regexSearch.status !== 500 && regexSearch.status === 200;
    logResult(
      10,
      'GET /api/movies?search=( does not return 500',
      t10Pass,
      `status=${regexSearch.status}, message=${regexSearch.data.message || 'ok'}`
    );
  } catch (error) {
    console.error('Audit test crashed:', error.message);
    process.exitCode = 1;
  } finally {
    // Delete temporary show via API and remove test users + bookings via Mongoose
    if (tempShowId && adminToken) {
      await request(`/api/shows/${tempShowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    if (createdUserIds.length > 0) {
      await connectDB();
      await Booking.deleteMany({ user: { $in: createdUserIds } });
      await User.deleteMany({ _id: { $in: createdUserIds } });
      await mongoose.disconnect();
    }
  }
}

runAudit();

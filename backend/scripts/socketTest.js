const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';

// Helper to log in a user and return their accessToken
async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data.accessToken;
}

// Helper to pause briefly between socket actions
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Connect two test sockets to verify live seat locking, conflict errors, and unlocking
async function runSocketTest() {
  // 1. Log in two seeded users
  const token1 = await loginUser('user@movietime.com', 'user123');
  const token2 = await loginUser('theatre@movietime.com', 'theatre123');

  // 2. Fetch the first available show ID
  const showsRes = await fetch(`${BASE_URL}/api/shows`);
  const showsData = await showsRes.json();
  if (!showsData.shows || showsData.shows.length === 0) {
    throw new Error('No shows found. Run npm run seed first.');
  }
  const showId = showsData.shows[0]._id;
  console.log('Testing on showId:', showId);

  // 3. Connect both sockets with JWT tokens in handshake auth
  const socket1 = io(BASE_URL, { auth: { token: token1 } });
  const socket2 = io(BASE_URL, { auth: { token: token2 } });

  // Log events received by User 1
  socket1.on('current-locks', (d) => console.log('[User 1] current-locks:', d));
  socket1.on('seats-locked', (d) => console.log('[User 1] seats-locked:', d));
  socket1.on('seats-unlocked', (d) => console.log('[User 1] seats-unlocked:', d));
  socket1.on('lock-error', (d) => console.log('[User 1] lock-error:', d));

  // Log events received by User 2
  socket2.on('current-locks', (d) => console.log('[User 2] current-locks:', d));
  socket2.on('seats-locked', (d) => console.log('[User 2] seats-locked:', d));
  socket2.on('seats-unlocked', (d) => console.log('[User 2] seats-unlocked:', d));
  socket2.on('lock-error', (d) => console.log('[User 2] lock-error:', d));

  await wait(500);

  // 4. Both users join the same show room
  socket1.emit('join-show', { showId });
  socket2.emit('join-show', { showId });
  await wait(300);

  // 5. User 1 locks seat B1
  console.log('\n--- User 1 locks B1 ---');
  socket1.emit('lock-seat', { showId, seat: 'B1' });
  await wait(400);

  // 6. User 2 tries to lock B1 (should receive lock-error)
  console.log('\n--- User 2 tries to lock B1 (expect lock-error) ---');
  socket2.emit('lock-seat', { showId, seat: 'B1' });
  await wait(400);

  // 7. User 1 unlocks B1
  console.log('\n--- User 1 unlocks B1 ---');
  socket1.emit('unlock-seat', { showId, seat: 'B1' });
  await wait(400);

  // 8. User 2 locks B1 (should succeed now)
  console.log('\n--- User 2 locks B1 (expect success) ---');
  socket2.emit('lock-seat', { showId, seat: 'B1' });
  await wait(400);

  // Clean up sockets
  socket1.disconnect();
  socket2.disconnect();
  console.log('\nSocket test finished.');
  process.exit(0);
}

runSocketTest().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});

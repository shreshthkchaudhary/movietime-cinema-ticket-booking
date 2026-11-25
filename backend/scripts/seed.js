require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');

// Populate the database with starter users, movies, a theatre, and shows
async function seedDatabase() {
  try {
    await connectDB();

    // Clear existing collections so the seed script can be re-run cleanly
    await Booking.deleteMany({});
    await Show.deleteMany({});
    await Theatre.deleteMany({});
    await Movie.deleteMany({});
    await User.deleteMany({});

    // Create sample users for all three roles
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@movietime.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'superAdmin',
    });

    const theatreAdmin = await User.create({
      name: 'Theatre Manager',
      email: 'theatre@movietime.com',
      passwordHash: await bcrypt.hash('theatre123', 10),
      role: 'theatreAdmin',
    });

    const theatreAdmin2 = await User.create({
      name: 'Second Theatre Manager',
      email: 'theatre2@movietime.com',
      passwordHash: await bcrypt.hash('theatre123', 10),
      role: 'theatreAdmin',
    });

    const normalUser = await User.create({
      name: 'John Doe',
      email: 'user@movietime.com',
      passwordHash: await bcrypt.hash('user123', 10),
      role: 'user',
    });

    // Create sample movies
    const movies = await Movie.insertMany([
      {
        title: 'Inception',
        description:
          'A skilled thief enters the dreams of others to steal or plant ideas.',
        genre: 'Sci-Fi',
        language: 'English',
        durationMins: 148,
        posterUrl:
          'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg',
        releaseDate: new Date('2010-07-16'),
      },
      {
        title: 'Interstellar',
        description:
          'Astronauts travel through a wormhole in search of a new home for humanity.',
        genre: 'Sci-Fi',
        language: 'English',
        durationMins: 169,
        posterUrl:
          'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg',
        releaseDate: new Date('2014-11-07'),
      },
      {
        title: '3 Idiots',
        description:
          'Two friends search for their long-lost college companion who inspired them.',
        genre: 'Comedy',
        language: 'Hindi',
        durationMins: 170,
        posterUrl:
          'https://upload.wikimedia.org/wikipedia/en/d/df/3_idiots_poster.jpg',
        releaseDate: new Date('2009-12-25'),
      },
    ]);

    // Create a sample theatre with two screens owned by theatreAdmin
    const theatre = await Theatre.create({
      name: 'PVR Grand Mall',
      city: 'Mumbai',
      address: '123 MG Road, Andheri West',
      owner: theatreAdmin._id,
      screens: [
        { name: 'Screen 1', rows: 6, seatsPerRow: 8 },
        { name: 'Screen 2', rows: 5, seatsPerRow: 6 },
      ],
    });

    // Create a second theatre owned by theatreAdmin2 for ownership tests
    const theatre2 = await Theatre.create({
      name: 'INOX Metro Plaza',
      city: 'Delhi',
      address: '45 Connaught Place',
      owner: theatreAdmin2._id,
      screens: [{ name: 'Screen A', rows: 5, seatsPerRow: 8 }],
    });

    // Schedule upcoming shows for tomorrow and the day after
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(18, 0, 0, 0);

    const tomorrowNight = new Date(tomorrow);
    tomorrowNight.setHours(21, 30, 0, 0);

    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    dayAfter.setHours(19, 0, 0, 0);

    await Show.insertMany([
      {
        movie: movies[0]._id,
        theatre: theatre._id,
        screenName: 'Screen 1',
        startTime: tomorrow,
        price: 250,
      },
      {
        movie: movies[1]._id,
        theatre: theatre._id,
        screenName: 'Screen 1',
        startTime: tomorrowNight,
        price: 300,
      },
      {
        movie: movies[2]._id,
        theatre: theatre._id,
        screenName: 'Screen 2',
        startTime: dayAfter,
        price: 220,
      },
      {
        movie: movies[0]._id,
        theatre: theatre2._id,
        screenName: 'Screen A',
        startTime: dayAfter,
        price: 260,
      },
    ]);

    console.log('Seed completed successfully!');
    console.log('SuperAdmin:', superAdmin.email, '/ admin123');
    console.log('TheatreAdmin:', theatreAdmin.email, '/ theatre123');
    console.log('TheatreAdmin2:', theatreAdmin2.email, '/ theatre123');
    console.log('User:', normalUser.email, '/ user123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();

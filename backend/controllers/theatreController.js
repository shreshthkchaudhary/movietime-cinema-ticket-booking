const Theatre = require('../models/Theatre');
const User = require('../models/User');

// GET /api/theatres — List all theatres with owner name/email
async function getTheatres(req, res, next) {
  try {
    const theatres = await Theatre.find()
      .populate('owner', 'name email role')
      .sort({ name: 1 });
    res.json({ theatres });
  } catch (error) {
    next(error);
  }
}

// GET /api/theatres/my — List theatres owned by the logged-in theatreAdmin
async function getMyTheatres(req, res, next) {
  try {
    const theatres = await Theatre.find({ owner: req.user.id }).sort({ name: 1 });
    res.json({ theatres });
  } catch (error) {
    next(error);
  }
}

// GET /api/theatres/:id — Get a single theatre by ID
async function getTheatreById(req, res, next) {
  try {
    const theatre = await Theatre.findById(req.params.id).populate(
      'owner',
      'name email role'
    );
    if (!theatre) {
      return res.status(404).json({ message: 'Theatre not found' });
    }
    res.json({ theatre });
  } catch (error) {
    next(error);
  }
}

// POST /api/theatres — Create a theatre and assign its owner (superAdmin only)
async function createTheatre(req, res, next) {
  try {
    const { name, city, address, owner, screens } = req.body;

    // Verify that the selected owner exists and has the theatreAdmin role
    const ownerUser = await User.findById(owner);
    if (!ownerUser || ownerUser.role !== 'theatreAdmin') {
      return res.status(400).json({
        message: 'Owner must be an existing user with the theatreAdmin role',
      });
    }

    const theatre = await Theatre.create({
      name,
      city,
      address,
      owner,
      screens: screens || [],
    });

    res.status(201).json({ theatre });
  } catch (error) {
    next(error);
  }
}

// PUT /api/theatres/:id — Update theatre details or screens (superAdmin or owning theatreAdmin)
async function updateTheatre(req, res, next) {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({ message: 'Theatre not found' });
    }

    // Theatre admins can only edit theatres they own
    if (
      req.user.role === 'theatreAdmin' &&
      theatre.owner.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: 'Forbidden: you can only manage your own theatre',
      });
    }

    const { name, city, address, screens } = req.body;
    if (name !== undefined) theatre.name = name;
    if (city !== undefined) theatre.city = city;
    if (address !== undefined) theatre.address = address;
    if (screens !== undefined) theatre.screens = screens;

    await theatre.save();
    res.json({ theatre });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/theatres/:id — Permanently delete a theatre (superAdmin only)
async function deleteTheatre(req, res, next) {
  try {
    const theatre = await Theatre.findByIdAndDelete(req.params.id);
    if (!theatre) {
      return res.status(404).json({ message: 'Theatre not found' });
    }
    res.json({ message: 'Theatre deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTheatres,
  getMyTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};

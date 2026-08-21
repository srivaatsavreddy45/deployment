const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/asyncHandler');

const createActivity = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    partner,
    date,
    location,
    slotsAvailable,
    status,
    category, // --- CATEGORY FEATURE ---
  } = req.body;

  const activity = await Activity.create({
    title,
    description,
    partner,
    date,
    location,
    slotsAvailable,
    status,
    category, // --- CATEGORY FEATURE ---
    createdBy: req.user?._id,
  });

  res.status(201).json({ success: true, data: activity });
});

const getActivities = asyncHandler(async (req, res) => {
  const { status, partner, date, category, page = 1, limit = 10 } = req.query;

  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (partner) filter.partner = partner;
  if (date) filter.date = date;

  // --- CATEGORY FEATURE: filter support alongside status/partner/date ---
  if (category) filter.category = category;
  // --- END CATEGORY FEATURE ---

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate('partner', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Activity.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: activities.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    data: activities,
  });
});

const getActivityById = asyncHandler(async (req, res) => {
  const activity = await Activity.findOne({ _id: req.params.id, isDeleted: false })
    .populate('partner', 'name')
    .populate('createdBy', 'name');

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  res.status(200).json({ success: true, data: activity });
});

const updateActivity = asyncHandler(async (req, res) => {
  const allowedFields = [
    'title',
    'description',
    'partner',
    'date',
    'location',
    'slotsAvailable',
    'status',
    'category', // --- CATEGORY FEATURE ---
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  );

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  res.status(200).json({ success: true, data: activity });
});

const updateActivityStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { status },
    { new: true, runValidators: true }
  );

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  res.status(200).json({ success: true, data: activity });
});

const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  res.status(200).json({ success: true, data: {} });
});

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  updateActivityStatus,
  deleteActivity,
};

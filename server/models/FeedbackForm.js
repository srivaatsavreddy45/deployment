const mongoose = require('mongoose');

const feedbackFormSchema = new mongoose.Schema(
  {
    // Adopted from origin/main (5f6a3fb): a real reference to Activity rather
    // than a free-text string. createdBy is deliberately retained.
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity ID is required'],
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    questions: {
      type: [mongoose.Schema.Types.Mixed],
      required: [true, 'Questions are required'],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: 'At least one question is required',
      },
    },

    createdBy: {
      type: String,
      required: [true, 'Created by is required'],
      trim: true,
    },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeedbackForm', feedbackFormSchema);
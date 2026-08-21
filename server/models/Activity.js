const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Partner is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    slotsAvailable: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'completed', 'cancelled'],
      default: 'draft',
    },

    
    category: {
      type: String,
      enum: ['women_empowerment', 'child_education', 'environment', 'other'],
      required: [true, 'Category is required'],
    },
    

    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);


activitySchema.index({ category: 1 });


module.exports = mongoose.model('Activity', activitySchema);

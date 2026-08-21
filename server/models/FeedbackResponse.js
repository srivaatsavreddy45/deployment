const mongoose = require('mongoose');

const QUESTION_TYPES = [
  'rating',
  'text',
  'single_choice',
  'multi_choice',
  'boolean',
];

const RATING_MIN = 1;
const RATING_MAX = 5;
const TEXT_MAX = 2000;

// One answer to one question of the referenced FeedbackForm.
// questionId is the stable id published by Dev 3's question contract.
const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: [true, 'questionId is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: QUESTION_TYPES,
      required: [true, 'Question type is required'],
    },
    // Shape depends on `type`; validated against the form in feedbackService.
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Answer value is required'],
    },
  },
  { _id: false }
);

const feedbackResponseSchema = new mongoose.Schema(
  {
    // Always taken from req.user._id. Never accepted from the request body.
    respondentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Respondent is required'],
      index: true,
    },
    feedbackFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackForm',
      required: [true, 'Feedback form is required'],
    },
    // Phase 3 decision: responses reference Activity._id as a real ObjectId.
    // FeedbackForm.activityId now matches (adopted from origin/main); the
    // service still verifies the submitted activityId against the form.
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
      required: [true, 'Activity is required'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [RATING_MIN, `Rating must be at least ${RATING_MIN}`],
      max: [RATING_MAX, `Rating must be at most ${RATING_MAX}`],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    whatWentWell: { type: String, trim: true, maxlength: TEXT_MAX },
    whatCouldBeImproved: { type: String, trim: true, maxlength: TEXT_MAX },
    suggestions: { type: String, trim: true, maxlength: TEXT_MAX },
    // Optional dynamic answers, validated against FeedbackForm.questions.
    answers: {
      type: [answerSchema],
      default: undefined,
    },
  },
  { timestamps: true }
);

// One submission per volunteer per feedback form, enforced by the database so
// concurrent duplicate submissions cannot both succeed.
feedbackResponseSchema.index(
  { respondentId: 1, feedbackFormId: 1 },
  { unique: true, name: 'uniq_respondent_form' }
);

const FeedbackResponse = mongoose.model(
  'FeedbackResponse',
  feedbackResponseSchema
);

FeedbackResponse.QUESTION_TYPES = QUESTION_TYPES;
FeedbackResponse.RATING_MIN = RATING_MIN;
FeedbackResponse.RATING_MAX = RATING_MAX;
FeedbackResponse.TEXT_MAX = TEXT_MAX;

module.exports = FeedbackResponse;

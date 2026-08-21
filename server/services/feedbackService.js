const mongoose = require('mongoose');
const FeedbackResponse = require('../models/FeedbackResponse');
const FeedbackForm = require('../models/FeedbackForm');
require('../models/Activity');
const ApiError = require('../utils/ApiError');

const { QUESTION_TYPES, RATING_MIN, RATING_MAX, TEXT_MAX } = FeedbackResponse;

// Fields a volunteer may supply. respondentId is deliberately absent: it is
// always taken from req.user._id.
const SUBMISSION_ALLOWED_FIELDS = [
  'formId',
  'activityId',
  'rating',
  'whatWentWell',
  'whatCouldBeImproved',
  'suggestions',
  'answers',
];

const pick = (source = {}, allowed) =>
  allowed.reduce((acc, field) => {
    if (source[field] !== undefined) acc[field] = source[field];
    return acc;
  }, {});

// Shape returned to the volunteer. respondentId is never echoed back: the
// caller is always the respondent.
const toResponse = (doc) => ({
  _id: doc._id,
  formId: doc.feedbackFormId,
  activityId: doc.activityId,
  rating: doc.rating,
  whatWentWell: doc.whatWentWell,
  whatCouldBeImproved: doc.whatCouldBeImproved,
  suggestions: doc.suggestions,
  answers: doc.answers,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const validationError = (errors) =>
  new ApiError(422, 'Validation failed', errors);

// FeedbackForm.questions is [Mixed] on Dev 3's model, so questions are
// normalised defensively. Accepts `id` or `questionId` as the stable id.
const normalizeQuestion = (question) => {
  if (!question || typeof question !== 'object') return null;
  // Real forms in this project use `key`; accept the other spellings too.
  const id = question.id ?? question.questionId ?? question.key ?? question._id;
  if (id === undefined || id === null) return null;
  return {
    id: String(id),
    type: question.type,
    text: question.text,
    required: question.required === true,
    options: Array.isArray(question.options) ? question.options : [],
  };
};

const optionValues = (question) =>
  question.options
    .map((option) =>
      option && typeof option === 'object' ? option.value : option
    )
    .filter((value) => value !== undefined);

const validateAnswerValue = (question, answer, errors) => {
  const field = `answers.${question.id}`;
  const { value } = answer;

  switch (question.type) {
    case 'rating':
      if (!Number.isInteger(value) || value < RATING_MIN || value > RATING_MAX) {
        errors.push({
          field,
          message: `Answer must be a whole number between ${RATING_MIN} and ${RATING_MAX}`,
        });
      }
      break;
    case 'text':
      if (typeof value !== 'string') {
        errors.push({ field, message: 'Answer must be text' });
      } else if (value.length > TEXT_MAX) {
        errors.push({
          field,
          message: `Answer must be at most ${TEXT_MAX} characters`,
        });
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({ field, message: 'Answer must be true or false' });
      }
      break;
    case 'single_choice': {
      const allowed = optionValues(question);
      if (Array.isArray(value) || !allowed.includes(value)) {
        errors.push({ field, message: 'Answer must be one of the allowed options' });
      }
      break;
    }
    case 'multi_choice': {
      const allowed = optionValues(question);
      if (!Array.isArray(value) || value.length === 0) {
        errors.push({ field, message: 'Answer must be a non-empty list of options' });
      } else if (value.some((entry) => !allowed.includes(entry))) {
        errors.push({ field, message: 'Answer contains an option that is not allowed' });
      }
      break;
    }
    default:
      errors.push({
        field,
        message: `Unsupported question type '${question.type}'`,
      });
  }
};

// Validates submitted answers against the form's questions. Returns the answers
// to persist, normalised with the question's declared type.
const validateAnswers = (form, submittedAnswers) => {
  const errors = [];
  const questions = (form.questions || [])
    .map(normalizeQuestion)
    .filter(Boolean);

  const hasAnswers = Array.isArray(submittedAnswers) && submittedAnswers.length > 0;

  if (questions.length === 0) {
    if (hasAnswers) {
      throw validationError([
        {
          field: 'answers',
          message:
            'This feedback form does not define questions with stable ids, so answers cannot be accepted',
        },
      ]);
    }
    return undefined;
  }

  const byId = new Map(questions.map((question) => [question.id, question]));
  const seen = new Set();
  const normalized = [];

  (submittedAnswers || []).forEach((answer, index) => {
    if (!answer || typeof answer !== 'object') {
      errors.push({ field: `answers[${index}]`, message: 'Answer must be an object' });
      return;
    }
    const questionId = answer.questionId ?? answer.id;
    if (questionId === undefined || questionId === null) {
      errors.push({ field: `answers[${index}].questionId`, message: 'questionId is required' });
      return;
    }
    const question = byId.get(String(questionId));
    if (!question) {
      errors.push({
        field: `answers[${index}].questionId`,
        message: `Unknown questionId '${questionId}' for this feedback form`,
      });
      return;
    }
    if (seen.has(question.id)) {
      errors.push({
        field: `answers.${question.id}`,
        message: 'Duplicate answer for this question',
      });
      return;
    }
    seen.add(question.id);

    if (!QUESTION_TYPES.includes(question.type)) {
      errors.push({
        field: `answers.${question.id}`,
        message: `Unsupported question type '${question.type}'`,
      });
      return;
    }

    validateAnswerValue(question, answer, errors);
    normalized.push({
      questionId: question.id,
      type: question.type,
      value: answer.value,
    });
  });

  questions
    .filter((question) => question.required && !seen.has(question.id))
    .forEach((question) =>
      errors.push({
        field: `answers.${question.id}`,
        message: 'An answer is required for this question',
      })
    );

  if (errors.length) throw validationError(errors);
  return normalized.length ? normalized : undefined;
};

const submitFeedback = async (respondentId, payload) => {
  const input = pick(payload, SUBMISSION_ALLOWED_FIELDS);

  const form = await FeedbackForm.findById(input.formId);
  if (!form) throw new ApiError(404, 'Feedback form not found');

  if (form.status !== 'active') {
    throw new ApiError(422, 'This feedback form is no longer accepting responses');
  }

  // FeedbackForm.activityId is now an ObjectId ref to Activity (adopted from
  // origin/main). The guard is retained as a defence against pre-existing
  // documents that still hold a non-ObjectId string.
  if (!mongoose.isValidObjectId(form.activityId)) {
    throw new ApiError(
      422,
      'This feedback form is not linked to a valid activity'
    );
  }
  if (String(form.activityId) !== String(input.activityId)) {
    throw validationError([
      {
        field: 'activityId',
        message: 'activityId does not match the activity of this feedback form',
      },
    ]);
  }

  const answers = validateAnswers(form, input.answers);

  // Friendly duplicate path; the unique index is the real guarantee.
  const existing = await FeedbackResponse.findOne({
    respondentId,
    feedbackFormId: form._id,
  }).select('_id');
  if (existing) {
    throw new ApiError(409, 'Feedback already submitted for this form');
  }

  try {
    const created = await FeedbackResponse.create({
      respondentId,
      feedbackFormId: form._id,
      activityId: form.activityId,
      rating: input.rating,
      whatWentWell: input.whatWentWell,
      whatCouldBeImproved: input.whatCouldBeImproved,
      suggestions: input.suggestions,
      answers,
    });
    return toResponse(created);
  } catch (error) {
    // Lost the race against a concurrent submission.
    if (error.code === 11000) {
      throw new ApiError(409, 'Feedback already submitted for this form');
    }
    throw error;
  }
};

// Confirmation view for a single submission. Scoped to the owner: a submission
// belonging to someone else is reported as not found rather than forbidden, so
// ids cannot be enumerated. Concept ported from origin/main's public
// GET /:id/confirmation, secured here.
const getMyFeedbackConfirmation = async (respondentId, feedbackId) => {
  const feedback = await FeedbackResponse.findById(feedbackId)
    .populate('activityId', 'title date category')
    .populate('feedbackFormId', 'title');

  if (!feedback || String(feedback.respondentId) !== String(respondentId)) {
    throw new ApiError(404, 'Feedback submission not found');
  }

  return {
    _id: feedback._id,
    activityId: feedback.activityId?._id,
    activityTitle: feedback.activityId?.title,
    activityDomain: feedback.activityId?.category,
    activityDate: feedback.activityId?.date,
    formId: feedback.feedbackFormId?._id,
    formTitle: feedback.feedbackFormId?.title,
    rating: feedback.rating,
    submittedAt: feedback.createdAt,
  };
};

// Volunteer-facing form discovery. Without this a volunteer has no way to learn
// which forms exist: every listing endpoint lives under /api/admin. Returns only
// active forms, with the activity resolved for display, plus whether this
// volunteer has already responded so the UI can disable the form.
const listAvailableForms = async (respondentId) => {
  const forms = await FeedbackForm.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .lean();

  const submitted = new Set(
    (await FeedbackResponse.find({ respondentId }).select('feedbackFormId').lean())
      .map((r) => String(r.feedbackFormId))
  );

  const activityIds = forms
    .map((f) => f.activityId)
    .filter((id) => mongoose.isValidObjectId(id));
  const activities = await mongoose
    .model('Activity')
    .find({ _id: { $in: activityIds } })
    .select('title date category status')
    .lean();
  const byId = new Map(activities.map((a) => [String(a._id), a]));

  return forms.map((form) => ({
    _id: form._id,
    title: form.title,
    description: form.description,
    activityId: form.activityId,
    activity: byId.get(String(form.activityId)) || null,
    questions: (form.questions || []).map(normalizeQuestion).filter(Boolean),
    alreadySubmitted: submitted.has(String(form._id)),
  }));
};

const listMyFeedback = async (respondentId, filters = {}) => {
  const query = { respondentId };
  if (filters.formId) query.feedbackFormId = filters.formId;
  if (filters.activityId) query.activityId = filters.activityId;

  const responses = await FeedbackResponse.find(query).sort({ createdAt: -1 });
  return responses.map(toResponse);
};

module.exports = {
  submitFeedback,
  listAvailableForms,
  listMyFeedback,
  getMyFeedbackConfirmation,
  SUBMISSION_ALLOWED_FIELDS,
};

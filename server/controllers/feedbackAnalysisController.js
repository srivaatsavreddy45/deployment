// Ported from origin/main (5f6a3fb, shivatare17032006) and adapted to the
// attributed FeedbackResponse model. Differences from the original:
//   * reads FeedbackResponse, not the anonymous Feedback model
//   * `answers` is an array of { questionId, type, value }, not a Map, so the
//     numeric aggregation selects answers whose question type is 'rating'
//   * free-text search/grouping covers all three text fields, not just
//     `suggestions`
//   * respondent identity is never exposed by these admin views
const FeedbackResponse = require('../models/FeedbackResponse');
const asyncHandler = require('../middleware/asyncHandler');

const DOMAIN_ALIASES = {
  'Women Empowerment': 'women_empowerment',
  'Child Education': 'child_education',
  Environment: 'environment',
};

const TEXT_FIELDS = ['suggestions', 'whatWentWell', 'whatCouldBeImproved'];

const ACTIVITY_POPULATE = {
  path: 'activityId',
  select: 'title category date partner',
  populate: { path: 'partner', select: 'name' },
};

const round2 = (sum, count) => Number((sum / count).toFixed(2));

// --- GET ALL FEEDBACK WITH FILTERS ---

const getAllFeedback = asyncHandler(async (req, res) => {
  const {
    activityId,
    corporatePartnerId,
    domain,
    rating,
    theme,
    startDate,
    endDate,
  } = req.query;

  const query = {};
  if (activityId) query.activityId = activityId;
  if (rating) query.rating = Number(rating);
  if (theme) {
    // Search every free-text field, not just suggestions.
    query.$or = TEXT_FIELDS.map((field) => ({
      [field]: { $regex: theme, $options: 'i' },
    }));
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const feedbackList = await FeedbackResponse.find(query).populate(
    ACTIVITY_POPULATE
  );

  // Filters on fields that live inside the populated Activity.
  let filtered = feedbackList;
  if (corporatePartnerId || domain) {
    filtered = feedbackList.filter((item) => {
      const activity = item.activityId;
      if (!activity) return false;
      if (
        corporatePartnerId &&
        activity.partner?._id?.toString() !== corporatePartnerId
      ) {
        return false;
      }
      if (domain && activity.category !== (DOMAIN_ALIASES[domain] || domain)) {
        return false;
      }
      return true;
    });
  }

  // respondentId is intentionally omitted from admin analysis output.
  const data = filtered.map((item) => ({
    _id: item._id,
    feedbackFormId: item.feedbackFormId,
    activityId: item.activityId?._id,
    rating: item.rating,
    whatWentWell: item.whatWentWell,
    whatCouldBeImproved: item.whatCouldBeImproved,
    suggestions: item.suggestions,
    answers: item.answers,
    createdAt: item.createdAt,
    activity: item.activityId
      ? {
          _id: item.activityId._id,
          title: item.activityId.title,
          category: item.activityId.category,
          date: item.activityId.date,
        }
      : null,
    corporatePartner: item.activityId?.partner
      ? {
          _id: item.activityId.partner._id,
          name: item.activityId.partner.name,
        }
      : null,
  }));

  res.status(200).json({ success: true, count: data.length, data });
});

// --- DASHBOARD STATISTICS ---

const getFeedbackStats = asyncHandler(async (req, res) => {
  const feedbackList = await FeedbackResponse.find({}).populate({
    path: 'activityId',
    select: 'title category',
  });

  const domainSums = {};
  const domainCounts = {};
  const activitySums = {};
  const activityCounts = {};
  const activityTitles = {};
  const questionSums = {};
  const questionCounts = {};
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  feedbackList.forEach((feedback) => {
    const { rating } = feedback;
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating] += 1;
    }

    const activity = feedback.activityId;
    if (activity) {
      const { category } = activity;
      if (category) {
        domainSums[category] = (domainSums[category] || 0) + rating;
        domainCounts[category] = (domainCounts[category] || 0) + 1;
      }
      const actId = activity._id.toString();
      activitySums[actId] = (activitySums[actId] || 0) + rating;
      activityCounts[actId] = (activityCounts[actId] || 0) + 1;
      activityTitles[actId] = activity.title;
    }

    // answers is an array of { questionId, type, value }; only 'rating'
    // questions carry a numeric value worth averaging.
    (feedback.answers || []).forEach((answer) => {
      if (answer.type !== 'rating' || typeof answer.value !== 'number') return;
      const key = answer.questionId;
      questionSums[key] = (questionSums[key] || 0) + answer.value;
      questionCounts[key] = (questionCounts[key] || 0) + 1;
    });
  });

  const domainStats = Object.keys(domainSums).map((domain) => ({
    domain,
    averageRating: round2(domainSums[domain], domainCounts[domain]),
    submissionCount: domainCounts[domain],
  }));

  const activityStats = Object.keys(activitySums).map((actId) => ({
    activityId: actId,
    activityTitle: activityTitles[actId],
    averageRating: round2(activitySums[actId], activityCounts[actId]),
    submissionCount: activityCounts[actId],
  }));

  const questionStats = Object.keys(questionSums)
    .map((questionId) => ({
      questionId,
      averageRating: round2(questionSums[questionId], questionCounts[questionId]),
      responseCount: questionCounts[questionId],
    }))
    .sort((a, b) => a.questionId.localeCompare(b.questionId));

  const formattedDistribution = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    count: ratingDistribution[r],
  }));

  res.status(200).json({
    success: true,
    data: {
      totalSubmissions: feedbackList.length,
      domainStats,
      activityStats,
      questionStats,
      ratingDistribution: formattedDistribution,
    },
  });
});

// --- FREE-TEXT COMMENTS & SUGGESTIONS BY DOMAIN ---

const getFeedbackThemes = asyncHandler(async (req, res) => {
  const feedbackList = await FeedbackResponse.find({}).populate({
    path: 'activityId',
    select: 'category',
  });

  const byDomain = {};

  feedbackList.forEach((feedback) => {
    const domain = feedback.activityId?.category;
    if (!domain) return;
    if (!byDomain[domain]) byDomain[domain] = [];

    TEXT_FIELDS.forEach((field) => {
      const text = feedback[field];
      if (text && text.trim() !== '') {
        byDomain[domain].push({
          field,
          text,
          createdAt: feedback.createdAt,
        });
      }
    });
  });

  const themes = Object.keys(byDomain).map((domain) => ({
    domain,
    comments: byDomain[domain],
  }));

  res.status(200).json({ success: true, data: themes });
});

// --- ADMIN RECLASSIFICATION ---
// NOTE: ported from origin/main unchanged in capability. This lets an admin
// overwrite volunteer-authored content. Flagged as an open team decision.
const reclassifyFeedback = asyncHandler(async (req, res) => {
  const { rating, suggestions, answers } = req.body;

  const updateFields = {};
  if (rating !== undefined) updateFields.rating = rating;
  if (suggestions !== undefined) updateFields.suggestions = suggestions;
  if (answers !== undefined) updateFields.answers = answers;

  const feedback = await FeedbackResponse.findByIdAndUpdate(
    req.params.id,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!feedback) {
    res.status(404);
    throw new Error('Feedback submission not found');
  }

  res.status(200).json({
    success: true,
    message: 'Feedback reclassified successfully',
    data: feedback,
  });
});

module.exports = {
  getAllFeedback,
  getFeedbackStats,
  getFeedbackThemes,
  reclassifyFeedback,
};

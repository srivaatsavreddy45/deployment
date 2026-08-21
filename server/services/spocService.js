const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');

/*
 * Get overall SPOC dashboard statistics
 */
const getDashboardStats = async () => {
  const [
    totalFeedbackForms,
    activeFeedbackForms,
    totalResponses,
  ] = await Promise.all([
    FeedbackForm.countDocuments(),
    FeedbackForm.countDocuments({ status: 'active' }),
    FeedbackResponse.countDocuments(),
  ]);

  return {
    totalFeedbackForms,
    activeFeedbackForms,
    totalResponses,
  };
};


// SPOC reporting is de-identified: respondentId is excluded from every SPOC
// projection. The FeedbackResponse.respondentId relationship itself is
// unchanged — submissions remain linked to the authenticated volunteer, and the
// unique (respondentId, feedbackFormId) index still enforces one submission per
// volunteer per form. Only the SPOC-facing projection hides it.
const DEIDENTIFIED = '-respondentId';


/*
 * Get all responses for a particular activity
 */
const getActivityResponses = async (activityId) => {
  return await FeedbackResponse.find({ activityId })
    .select(DEIDENTIFIED)
    .sort({ createdAt: -1 });
};


/*
 * Get feedback forms + responses for an activity
 */
const getActivityFeedback = async (activityId) => {
  const [forms, responses] = await Promise.all([
    FeedbackForm.find({ activityId }),
    FeedbackResponse.find({ activityId })
      .select(DEIDENTIFIED)
      .sort({ createdAt: -1 }),
  ]);

  return {
    forms,
    responses,
  };
};


/*
 * Extract free text from a feedback response.
 *
 * Reconciliation note: FeedbackResponse.answers is a typed Mongoose
 * DocumentArray of { questionId, type, value }, not Mixed. Walking a hydrated
 * subdocument with Object.values() follows its $parent back-reference and
 * recurses forever, so values are converted to plain objects first. The
 * response's free-text fields are included too, since on this schema the real
 * comments live there rather than in answers.
 */
const extractText = (response) => {
  const texts = [];
  const seen = new WeakSet();

  const processValue = (value) => {
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      texts.push(value);
      return;
    }

    if (typeof value !== 'object') return;

    const plain =
      typeof value.toObject === 'function' ? value.toObject() : value;

    if (seen.has(plain)) return;
    seen.add(plain);

    if (Array.isArray(plain)) {
      plain.forEach(processValue);
      return;
    }

    Object.values(plain).forEach(processValue);
  };

  if (response && typeof response === 'object' && !Array.isArray(response)) {
    ['whatWentWell', 'whatCouldBeImproved', 'suggestions'].forEach((field) => {
      if (typeof response[field] === 'string') texts.push(response[field]);
    });
    processValue(response.answers);
  } else {
    processValue(response);
  }

  return texts.join(' ');
};


/*
 * Basic keyword extraction.
 *
 * This is intentionally simple for the first version.
 * Later we can replace this with a better NLP approach.
 */
const getKeywords = async (activityId) => {
  const responses = await FeedbackResponse.find({ activityId }).select(
    DEIDENTIFIED
  );

  const text = responses
    .map((response) => extractText(response))
    .join(' ')
    .toLowerCase();

  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = new Set([
    'the',
    'and',
    'was',
    'were',
    'is',
    'are',
    'to',
    'of',
    'in',
    'for',
    'a',
    'an',
    'it',
    'this',
    'that',
    'with',
    'on',
    'very',
    'good',
    'was',
    'have',
    'has',
    'had',
    'i',
    'we',
    'they',
    'you',
    'my',
    'our',
    'their',
    'but',
    'be',
    'as',
    'at',
    'from',
    'or',
    'so',
    'not',
  ]);

  const frequency = {};

  words.forEach((word) => {
    if (
      word.length >= 3 &&
      !stopWords.has(word)
    ) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({
      keyword,
      count,
    }));
};


/*
 * Basic sentiment analysis.
 *
 * This gives us a useful first dashboard.
 * Later we can make this much smarter.
 */
const getSentiment = async (activityId) => {
  const responses = await FeedbackResponse.find({ activityId }).select(
    DEIDENTIFIED
  );

  const positiveWords = [
    'good',
    'great',
    'excellent',
    'useful',
    'helpful',
    'amazing',
    'interesting',
    'clear',
    'effective',
    'happy',
    'enjoyed',
    'best',
    'love',
    'positive',
  ];

  const negativeWords = [
    'bad',
    'poor',
    'difficult',
    'confusing',
    'unclear',
    'slow',
    'boring',
    'problem',
    'issue',
    'improve',
    'negative',
    'waste',
    'disappointed',
  ];

  let positive = 0;
  let negative = 0;
  let neutral = 0;

  responses.forEach((response) => {
    const text = extractText(response).toLowerCase();

    const positiveScore = positiveWords.filter(
      (word) => text.includes(word)
    ).length;

    const negativeScore = negativeWords.filter(
      (word) => text.includes(word)
    ).length;

    if (positiveScore > negativeScore) {
      positive++;
    } else if (negativeScore > positiveScore) {
      negative++;
    } else {
      neutral++;
    }
  });

  return {
    positive,
    neutral,
    negative,
    total: responses.length,
  };
};


/*
 * Complete activity insights
 */
const getActivityInsights = async (activityId) => {
  const [responses, keywords, sentiment] = await Promise.all([
    getActivityResponses(activityId),
    getKeywords(activityId),
    getSentiment(activityId),
  ]);

  return {
    activityId,
    totalResponses: responses.length,
    keywords,
    sentiment,
  };
};


module.exports = {
  getDashboardStats,
  getActivityResponses,
  getActivityFeedback,
  getKeywords,
  getSentiment,
  getActivityInsights,
};

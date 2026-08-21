const express = require('express');

const router = express.Router();

const {
  getSpocDashboard,
  getActivityResponses,
  getActivityFeedback,
  getActivityKeywords,
  getActivitySentiment,
  getActivityInsights,
} = require('../controllers/spocController');
const verifyJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Corporate SPOC reporting. Authenticated and role-scoped to 'spoc' and 'admin'.
// NOTE: requireVerifiedVolunteer is deliberately NOT used here — volunteer
// verification is a volunteer-only workflow and does not apply to SPOC or admin
// accounts. Admin verification of volunteers is unchanged.
router.use(verifyJWT, authorizeRoles('spoc', 'admin'));


/*
 * Overall SPOC dashboard
 */
router.get(
  '/dashboard',
  getSpocDashboard
);


/*
 * Activity feedback
 */
router.get(
  '/activities/:activityId/feedback',
  getActivityFeedback
);


/*
 * Raw responses
 */
router.get(
  '/activities/:activityId/responses',
  getActivityResponses
);


/*
 * Keyword analysis
 */
router.get(
  '/activities/:activityId/keywords',
  getActivityKeywords
);


/*
 * Sentiment analysis
 */
router.get(
  '/activities/:activityId/sentiment',
  getActivitySentiment
);


/*
 * Complete activity insights
 */
router.get(
  '/activities/:activityId/insights',
  getActivityInsights
);


module.exports = router;

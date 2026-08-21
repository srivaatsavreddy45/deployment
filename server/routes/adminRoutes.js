const express = require('express');

const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
} = require('../controllers/adminController');
// Feedback-form CRUD stays in its own controller on this branch; origin/main
// folded it into feedbackController alongside an anonymous submission handler
// that is deliberately not merged.
const {
  createFeedbackForm,
  getFeedbackForms,
  getFeedbackFormById,
  updateFeedbackForm,
  archiveFeedbackForm,
  getFeedbackFormByActivityId,
} = require('../controllers/feedbackFormController');
const {
  getAllFeedback,
  getFeedbackStats,
  getFeedbackThemes,
  reclassifyFeedback,
} = require('../controllers/feedbackAnalysisController');
const { updateVerification } = require('../controllers/authController');
const verifyJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');
const { updateVerificationValidation } = require('../validators/authValidator');
const {
  userIdValidation,
  createUserValidation,
  adminUpdateUserValidation,
} = require('../validators/userValidator');

// Structural guard adopted from PR #7: every admin route is authenticated and
// role-scoped once, rather than repeating the pair on each route.
router.use(verifyJWT, authorizeRoles('admin'));

// --- Dashboard ---
router.get('/dashboard/stats', getDashboardStats);

// --- User administration ---
router
  .route('/users')
  .get(getAllUsers)
  .post(createUserValidation, validate, createUser);

router.get('/users/:id', userIdValidation, validate, getUserById);
router.put('/users/:id', adminUpdateUserValidation, validate, updateUser);
router.delete('/users/:id', userIdValidation, validate, deleteUser);

// --- Volunteer verification (canonical endpoint) ---
// Transitions verificationStatus to 'verified' or 'rejected' and emails the
// volunteer. Volunteer-only target; enforced in authService.
router.patch(
  '/users/:id/verification',
  updateVerificationValidation,
  validate,
  updateVerification
);

// --- Feedback form CRUD ---
router.post('/feedback-forms', createFeedbackForm);
router.get('/feedback-forms', getFeedbackForms);
router.get('/feedback-forms/:id', getFeedbackFormById);
router.put('/feedback-forms/:id', updateFeedbackForm);
router.delete('/feedback-forms/:id', archiveFeedbackForm);
router.get(
  '/activities/:activityId/feedback-form',
  getFeedbackFormByActivityId
);

// --- Feedback analysis & stats (reads the attributed FeedbackResponse) ---
router.get('/feedback', getAllFeedback);
router.get('/feedback/stats', getFeedbackStats);
router.get('/feedback/themes', getFeedbackThemes);
router.post('/feedback/:id/reclassify', reclassifyFeedback);

module.exports = router;

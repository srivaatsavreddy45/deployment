const express = require('express');

const router = express.Router();

const {
  submitFeedback,
  getMyFeedback,
  getMyFeedbackConfirmation,
  getAvailableForms,
} = require('../controllers/feedbackController');
const {
  submitFeedbackValidation,
  listMyFeedbackValidation,
  feedbackIdParamValidation,
} = require('../validators/feedbackValidator');
const validate = require('../middleware/validateMiddleware');
const verifyJWT = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const requireVerifiedVolunteer = require('../middleware/requireVerified');

// Every volunteer feedback route requires an authenticated volunteer.
router.use(verifyJWT, authorizeRoles('volunteer'));

// Submission additionally requires an Admin-verified account.
router.post(
  '/',
  requireVerifiedVolunteer,
  submitFeedbackValidation,
  validate,
  submitFeedback
);

// Active forms this volunteer may respond to. Readable regardless of
// verification so a pending volunteer can see what is waiting for them.
router.get('/forms', getAvailableForms);

// Readable by pending/rejected volunteers so they can see their own history.
router.get('/mine', listMyFeedbackValidation, validate, getMyFeedback);

// Submission confirmation, scoped to the owning volunteer.
router.get(
  '/:id/confirmation',
  feedbackIdParamValidation,
  validate,
  getMyFeedbackConfirmation
);

module.exports = router;

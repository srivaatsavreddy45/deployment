const asyncHandler = require('../middleware/asyncHandler');
const feedbackService = require('../services/feedbackService');

// Volunteer identity always comes from the authenticated request, never the body.
const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.submitFeedback(req.user._id, req.body);
  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: feedback,
  });
});

const getMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.listMyFeedback(req.user._id, {
    formId: req.query.formId,
    activityId: req.query.activityId,
  });
  res.status(200).json({
    success: true,
    count: feedback.length,
    data: feedback,
  });
});

// Ownership-scoped: a volunteer may only confirm their own submission.
const getMyFeedbackConfirmation = asyncHandler(async (req, res) => {
  const confirmation = await feedbackService.getMyFeedbackConfirmation(
    req.user._id,
    req.params.id
  );
  res.status(200).json({
    success: true,
    message: 'Feedback confirmation details',
    data: confirmation,
  });
});

// Lists active forms a volunteer may respond to. Readable by any authenticated
// volunteer (including pending ones) so the UI can explain what is available.
const getAvailableForms = asyncHandler(async (req, res) => {
  const forms = await feedbackService.listAvailableForms(req.user._id);
  res.status(200).json({ success: true, count: forms.length, data: forms });
});

module.exports = {
  submitFeedback,
  getMyFeedback,
  getMyFeedbackConfirmation,
  getAvailableForms,
};

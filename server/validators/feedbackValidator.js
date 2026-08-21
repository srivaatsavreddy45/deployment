const { body, param, query } = require('express-validator');
const FeedbackResponse = require('../models/FeedbackResponse');

const { RATING_MIN, RATING_MAX, TEXT_MAX } = FeedbackResponse;

const optionalText = (field, label) =>
  body(field)
    .optional({ nullable: true })
    .isString().withMessage(`${label} must be text`)
    .bail()
    .trim()
    .isLength({ max: TEXT_MAX })
    .withMessage(`${label} must be at most ${TEXT_MAX} characters`);

const submitFeedbackValidation = [
  body('formId')
    .exists().withMessage('formId is required')
    .bail()
    .isMongoId().withMessage('formId must be a valid ID'),
  body('activityId')
    .exists().withMessage('activityId is required')
    .bail()
    .isMongoId().withMessage('activityId must be a valid ID'),
  body('rating')
    .exists().withMessage('Rating is required')
    .bail()
    .isInt({ min: RATING_MIN, max: RATING_MAX })
    .withMessage(`Rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`)
    .bail()
    .toInt(),
  optionalText('whatWentWell', 'whatWentWell'),
  optionalText('whatCouldBeImproved', 'whatCouldBeImproved'),
  optionalText('suggestions', 'suggestions'),
  body('answers')
    .optional()
    .isArray().withMessage('answers must be an array'),
  body('answers.*.questionId')
    .if(body('answers').exists())
    .exists().withMessage('questionId is required for every answer'),
  // Volunteer identity is derived from the access token. Supplying it is a
  // privilege-escalation attempt and is rejected outright.
  body('respondentId').not().exists()
    .withMessage('respondentId cannot be supplied'),
  body('_id').not().exists()
    .withMessage('_id cannot be supplied'),
];

const listMyFeedbackValidation = [
  query('formId')
    .optional()
    .isMongoId().withMessage('formId must be a valid ID'),
  query('activityId')
    .optional()
    .isMongoId().withMessage('activityId must be a valid ID'),
];

const feedbackIdParamValidation = [
  param('id').isMongoId().withMessage('id must be a valid ID'),
];

module.exports = {
  submitFeedbackValidation,
  listMyFeedbackValidation,
  feedbackIdParamValidation,
};

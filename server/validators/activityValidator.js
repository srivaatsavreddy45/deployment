const { body, param, query } = require('express-validator');

const ACTIVITY_CATEGORIES = ['women_empowerment', 'child_education', 'environment', 'donations', 'other'];


const ACTIVITY_STATUSES = ['draft', 'published', 'completed', 'cancelled'];

const createActivityValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('partner').isMongoId().withMessage('Partner must be a valid id'),
  body('date').isISO8601().toDate().withMessage('Date must be a valid date'),
  body('location').optional().trim(),
  body('slotsAvailable')
    .optional()
    .isInt({ min: 0 })
    .withMessage('slotsAvailable must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(ACTIVITY_STATUSES)
    .withMessage(`status must be one of: ${ACTIVITY_STATUSES.join(', ')}`),

    
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .bail()
    .isIn(ACTIVITY_CATEGORIES)
    .withMessage(`category must be one of: ${ACTIVITY_CATEGORIES.join(', ')}`),
  
];

const updateActivityValidator = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('partner').optional().isMongoId().withMessage('Partner must be a valid id'),
  body('date').optional().isISO8601().toDate().withMessage('Date must be a valid date'),
  body('location').optional().trim(),
  body('slotsAvailable')
    .optional()
    .isInt({ min: 0 })
    .withMessage('slotsAvailable must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(ACTIVITY_STATUSES)
    .withMessage(`status must be one of: ${ACTIVITY_STATUSES.join(', ')}`),


  body('category')
    .optional()
    .isIn(ACTIVITY_CATEGORIES)
    .withMessage(`category must be one of: ${ACTIVITY_CATEGORIES.join(', ')}`),
];

const statusValidator = [
  body('status')
    .isIn(ACTIVITY_STATUSES)
    .withMessage(`status must be one of: ${ACTIVITY_STATUSES.join(', ')}`),
];

const idParamValidator = [
  param('id').isMongoId().withMessage('Invalid activity id'),
];

const listActivitiesValidator = [
  query('status')
    .optional()
    .isIn(ACTIVITY_STATUSES)
    .withMessage(`status must be one of: ${ACTIVITY_STATUSES.join(', ')}`),
  query('partner').optional().isMongoId().withMessage('partner must be a valid id'),
  query('date').optional().isISO8601().withMessage('date must be a valid date'),

  
  query('category')
    .optional()
    .isIn(ACTIVITY_CATEGORIES)
    .withMessage(`category must be one of: ${ACTIVITY_CATEGORIES.join(', ')}`),
  

  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  ACTIVITY_CATEGORIES,
  ACTIVITY_STATUSES,
  createActivityValidator,
  updateActivityValidator,
  statusValidator,
  idParamValidator,
  listActivitiesValidator,
};

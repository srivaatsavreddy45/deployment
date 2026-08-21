const { body, param } = require('express-validator');

const nameValidation = () =>
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .bail()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters');

const emailValidation = () =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail();

const passwordValidation = () =>
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be between 8 and 72 characters');

const userIdValidation = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

const createUserValidation = [
  nameValidation(),
  emailValidation(),
  passwordValidation(),
  body('role')
    .optional()
    .isIn(['volunteer', 'admin', 'spoc'])
    .withMessage('Role must be volunteer, admin, or spoc'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
  body('verificationStatus')
    .not()
    .exists()
    .withMessage('Use the verification endpoint to change verification status'),
  body('isVerified')
    .not()
    .exists()
    .withMessage('isVerified is a derived field and cannot be supplied'),
  body('refreshToken')
    .not()
    .exists()
    .withMessage('Refresh token cannot be supplied'),
];

const updateUserValidation = [
  ...userIdValidation,
  body().custom((_body, { req }) => {
    const allowedFields = ['name', 'email', 'description', 'category'];
    const hasAllowedField = allowedFields.some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (!hasAllowedField) {
      throw new Error('Provide at least one profile field to update');
    }
    return true;
  }),
  nameValidation().optional(),
  emailValidation().optional(),
  body('description').optional().trim().isString(),
  body('category').optional().trim().isString(),
  body('role').not().exists().withMessage('Role cannot be updated here'),
  body('status').not().exists().withMessage('Status cannot be updated here'),
  body('verificationStatus')
    .not()
    .exists()
    .withMessage('Use the verification endpoint to change verification status'),
  body('isVerified')
    .not()
    .exists()
    .withMessage('isVerified is a derived field and cannot be supplied'),
  body('password')
    .not()
    .exists()
    .withMessage('Password cannot be updated through the profile endpoint'),
  body('refreshToken')
    .not()
    .exists()
    .withMessage('Refresh token cannot be supplied'),
];

const adminUpdateUserValidation = [
  ...userIdValidation,
  body().custom((_body, { req }) => {
    const allowedFields = [
      'name',
      'email',
      'description',
      'category',
      'role',
      'status',
    ];
    const hasAllowedField = allowedFields.some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (!hasAllowedField) {
      throw new Error('Provide at least one user field to update');
    }
    return true;
  }),
  nameValidation().optional(),
  emailValidation().optional(),
  body('description').optional().trim().isString(),
  body('category').optional().trim().isString(),
  body('role')
    .optional()
    .isIn(['volunteer', 'admin', 'spoc'])
    .withMessage('Role must be volunteer, admin, or spoc'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending'])
    .withMessage('Status must be active, inactive, or pending'),
  body('verificationStatus')
    .not()
    .exists()
    .withMessage('Use the verification endpoint to change verification status'),
  body('isVerified')
    .not()
    .exists()
    .withMessage('isVerified is a derived field and cannot be supplied'),
  body('password')
    .not()
    .exists()
    .withMessage('Password cannot be updated through this endpoint'),
  body('refreshToken')
    .not()
    .exists()
    .withMessage('Refresh token cannot be supplied'),
];

module.exports = {
  userIdValidation,
  createUserValidation,
  updateUserValidation,
  adminUpdateUserValidation,
};

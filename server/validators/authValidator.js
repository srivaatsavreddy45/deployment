const { body, cookie, param } = require("express-validator");

const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .bail()
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters"),
  body("role").not().exists()
    .withMessage("Role cannot be selected during public registration"),
  body("verificationStatus").not().exists()
    .withMessage("Verification status cannot be supplied"),
  body("isVerified").not().exists()
    .withMessage("Verification status cannot be supplied"),
  body("status").not().exists()
    .withMessage("Account status cannot be supplied"),
  body("corporatePartnerId").not().exists()
    .withMessage("Corporate partner cannot be supplied"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .bail()
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const refreshTokenValidation = [
  cookie("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// Canonical verification endpoint: PATCH /api/admin/users/:id/verification
// (adopted from PR #7). Keeps the stricter `exists()` check and explicit
// message from the previous /api/auth/users/:userId/verify implementation.
const updateVerificationValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("verificationStatus")
    .exists().withMessage("verificationStatus is required")
    .bail()
    .isIn(["verified", "rejected"])
    .withMessage("verificationStatus must be either 'verified' or 'rejected'")
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  updateVerificationValidation,
};

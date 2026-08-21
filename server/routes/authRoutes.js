const express = require("express");
const {
  register,
  login,
  refreshToken,
  logout,
  me,
} = require("../controllers/authController");
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} = require("../validators/authValidator");
const validate = require("../middleware/validateMiddleware");
const verifyJWT = require("../middleware/authMiddleware");

const router = express.Router();

// Session concerns only. Admin verification of volunteers lives on the admin
// router at PATCH /api/admin/users/:id/verification (canonical, from PR #7).
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/refresh-token", refreshTokenValidation, validate, refreshToken);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, me);

module.exports = router;

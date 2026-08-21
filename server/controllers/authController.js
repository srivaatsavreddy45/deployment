const asyncHandler = require("../middleware/asyncHandler");
const authService = require("../services/authService");

const commonCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};
const accessCookieOptions = {
  ...commonCookieOptions,
  maxAge: 15 * 60 * 1000,
};
const refreshCookieOptions = {
  ...commonCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  return res.status(201).json({
    success: true,
    message:
      "Registration successful. Your account is waiting for Admin verification.",
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser({
    email: req.body.email,
    password: req.body.password,
  });
  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json({ success: true, message: "Login successful", data: user });
});

const refreshToken = asyncHandler(async (req, res) => {
  const tokens = await authService.refreshUserTokens(
    req.cookies?.refreshToken,
  );
  return res
    .status(200)
    .cookie("accessToken", tokens.accessToken, accessCookieOptions)
    .cookie("refreshToken", tokens.refreshToken, refreshCookieOptions)
    .json({ success: true, message: "Tokens refreshed successfully" });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user._id);
  return res
    .status(200)
    .clearCookie("accessToken", commonCookieOptions)
    .clearCookie("refreshToken", commonCookieOptions)
    .json({ success: true, message: "Logout successful" });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);
  return res.status(200).json({
    success: true,
    message: "Current user fetched successfully",
    data: user,
  });
});

// Admin-only. Accepts verificationStatus of 'verified' or 'rejected' only.
// Mounted at PATCH /api/admin/users/:id/verification (canonical, from PR #7),
// so the id comes from :id rather than :userId.
const updateVerification = asyncHandler(async (req, res) => {
  const user = await authService.updateVerificationByAdmin(
    req.params.id,
    req.body.verificationStatus,
  );
  return res.status(200).json({
    success: true,
    message: `Volunteer ${user.verificationStatus} successfully`,
    data: user,
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  me,
  updateVerification,
};

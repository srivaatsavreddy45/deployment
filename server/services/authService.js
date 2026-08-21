const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const {
  sendVerificationStatusEmail,
  sendAdminVerificationRequestEmail,
} = require("./emailService");

// Phase 2: token signing lives in the auth service, not on the User model,
// so JWT concerns stay inside the authentication ownership boundary.
const signAccessToken = (user) =>
  jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
  });

const signRefreshToken = (user) =>
  jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  });

// verificationStatus is the source of truth; isVerified is derived only.
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  verificationStatus: user.verificationStatus,
  isVerified: user.verificationStatus === "verified",
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const generateAndStoreTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

// Public registration always creates a pending volunteer. role and
// verificationStatus are never taken from the client.
const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: "volunteer",
    verificationStatus: "pending",
    status: "active",
  });

  // Adopted from PR #7. Email failures are swallowed: registration must still
  // succeed when SMTP is unconfigured (existing tested behaviour).
  try {
    await sendAdminVerificationRequestEmail({
      adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL,
      volunteerName: user.name,
      volunteerEmail: user.email,
    });
  } catch (error) {
    console.error(
      `Admin verification-request email failed for volunteer ${user._id}: ${error.message}`,
    );
  }

  return sanitizeUser(user);
};

// Phase 2 policy: pending and rejected users MAY authenticate so they can see
// their own verification status. Feature access is gated per-route instead.
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password +refreshToken",
  );
  if (!user) throw new ApiError(401, "Incorrect email or password");

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    throw new ApiError(401, "Incorrect email or password");
  }
  if (user.status === "inactive") {
    throw new ApiError(403, "Your account has been deactivated");
  }

  const tokens = await generateAndStoreTokens(user);
  return { user: sanitizeUser(user), ...tokens };
};

const refreshUserTokens = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decodedToken._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been revoked");
  }
  if (user.status === "inactive") {
    throw new ApiError(403, "This account is not permitted to log in");
  }

  return generateAndStoreTokens(user);
};

const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  return sanitizeUser(user);
};

// Admin-only transition. Only 'verified' and 'rejected' are accepted, and only
// volunteers may be transitioned.
const updateVerificationByAdmin = async (userId, verificationStatus) => {
  if (!["verified", "rejected"].includes(verificationStatus)) {
    throw new ApiError(
      422,
      "verificationStatus must be either 'verified' or 'rejected'",
    );
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, role: "volunteer" },
    { $set: { verificationStatus } },
    { new: true, runValidators: true },
  );
  if (!user) throw new ApiError(404, "Volunteer not found");

  // Adopted from PR #7. Swallowed for the same reason as above.
  try {
    await sendVerificationStatusEmail({
      email: user.email,
      name: user.name,
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    console.error(
      `Verification email failed for volunteer ${user._id}: ${error.message}`,
    );
  }

  return sanitizeUser(user);
};

module.exports = {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
  getCurrentUser,
  updateVerificationByAdmin,
};

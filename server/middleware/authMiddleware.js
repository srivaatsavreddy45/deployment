const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("./asyncHandler");

// Phase 2 contract: req.user is a minimal identity, never the full document.
//   req.user = { _id, role, verificationStatus }
// verificationStatus is read from the database on every request so an admin's
// verify/reject decision takes effect immediately rather than when the token
// expires.
const verifyJWT = asyncHandler(async (req, res, next) => {
  const authorizationHeader = req.get("Authorization");
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : null;
  const accessToken = req.cookies?.accessToken || bearerToken;

  if (!accessToken) throw new ApiError(401, "Authentication required");

  let decodedToken;
  try {
    decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }

  const user = await User.findById(decodedToken._id).select(
    "_id role verificationStatus status",
  );
  if (!user) {
    throw new ApiError(401, "User belonging to this token no longer exists");
  }
  if (user.status === "inactive") {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // Verification is NOT enforced here. Pending/rejected users may authenticate
  // so they can read their own status; feature access is gated per-route by
  // requireVerifiedVolunteer.
  req.user = {
    _id: user._id,
    role: user.role,
    verificationStatus: user.verificationStatus,
  };
  return next();
});

module.exports = verifyJWT;

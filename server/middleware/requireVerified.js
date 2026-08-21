const ApiError = require("../utils/ApiError");

// Gate for volunteer functionality that requires an Admin-verified account.
// verificationStatus is the single source of truth; 'pending' and 'rejected'
// are both denied, with distinct messages.
const requireVerifiedVolunteer = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.verificationStatus === "verified") {
    return next();
  }

  if (req.user.verificationStatus === "rejected") {
    return next(
      new ApiError(403, "Your volunteer account has been rejected by an Admin"),
    );
  }

  return next(
    new ApiError(403, "Your account is waiting for Admin verification"),
  );
};

module.exports = requireVerifiedVolunteer;

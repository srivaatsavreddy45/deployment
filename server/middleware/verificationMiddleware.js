const ApiError = require('../utils/ApiError');

const requireVerified = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  if (req.user.verificationStatus !== 'verified') {
    return next(new ApiError(403, 'A verified account is required'));
  }

  return next();
};

module.exports = requireVerified;

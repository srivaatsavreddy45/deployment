const ApiError = require('../utils/ApiError');

// Ownership guard for /api/users/:id.
//
// A non-matching id is reported as 404 rather than 403 so user ids cannot be
// enumerated through the response code — the same convention used by
// GET /api/feedback/:id/confirmation.
const buildGuard = (allowAdmin) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const isSelf = String(req.user._id) === String(req.params.id);
  if (isSelf || (allowAdmin && req.user.role === 'admin')) {
    return next();
  }

  return next(new ApiError(404, 'User not found'));
};

// Read: the owner or an admin.
const requireSelfOrAdmin = buildGuard(true);
// Write: the owner only. Admins manage other users via /api/admin/users/:id.
const requireSelf = buildGuard(false);

module.exports = { requireSelfOrAdmin, requireSelf };

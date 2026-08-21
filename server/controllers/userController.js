// Self-service profile handlers. Ownership is enforced by the route layer
// (requireSelfOrAdmin / requireSelf). Listing, creation and deletion are admin
// operations and live in adminController.
const userService = require('../services/userServices');
const asyncHandler = require('../middleware/asyncHandler');

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

// Restrictive by default: userServices permits only name and email here, and
// rejects any privileged field with 422 rather than dropping it.
const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUserById(req.params.id, req.body);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

module.exports = { getUser, updateUser };

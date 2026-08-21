const express = require('express');

const router = express.Router();

const { getUser, updateUser } = require('../controllers/userController');
const validate = require('../middleware/validateMiddleware');
const {
  userIdValidation,
  updateUserValidation,
} = require('../validators/userValidator');
const verifyJWT = require('../middleware/authMiddleware');
const {
  requireSelfOrAdmin,
  requireSelf,
} = require('../middleware/requireSelfOrAdmin');

// Self-service profile API. Every route is authenticated and ownership-scoped.
//
// Deliberately NOT provided here (Phase 6a):
//   GET    /api/users        user directory  -> use GET /api/admin/users (admin)
//   POST   /api/users        account creation -> POST /api/auth/register (public,
//                            volunteer only) or POST /api/admin/users (admin)
//   DELETE /api/users/:id    destructive     -> DELETE /api/admin/users/:id (admin)
router.use(verifyJWT);

// Own profile, or any profile for an admin.
router.get('/:id', userIdValidation, validate, requireSelfOrAdmin, getUser);

// Own profile only. Admins edit other users via /api/admin/users/:id, which is
// the single path permitted to change role or status.
// Ownership is checked BEFORE body validation so a non-owner always gets a
// uniform 404, whatever the body looks like. Validating first would answer 422
// for a malformed body and 404 for a well-formed one — same information either
// way, but an inconsistent surface.
router.put(
  '/:id',
  userIdValidation,
  validate,
  requireSelf,
  updateUserValidation,
  validate,
  updateUser
);

module.exports = router;

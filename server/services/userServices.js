const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// Phase 6a: two explicit field policies, restrictive by default.
//
//   *_ALLOWED_FIELDS        self-service / generic callers (/api/users)
//   ADMIN_*_ALLOWED_FIELDS  admin user management (/api/admin/users)
//
// Role and status are admin-only. verificationStatus is not settable through
// either path — it moves solely via the admin verification endpoint
// (PATCH /api/admin/users/:id/verification). isVerified is a derived virtual
// and refreshToken is internal, so neither is ever accepted.
const CREATE_ALLOWED_FIELDS = ['name', 'email', 'password'];
const UPDATE_ALLOWED_FIELDS = ['name', 'email'];
const ADMIN_CREATE_ALLOWED_FIELDS = [...CREATE_ALLOWED_FIELDS, 'role', 'status'];
const ADMIN_UPDATE_ALLOWED_FIELDS = [...UPDATE_ALLOWED_FIELDS, 'role', 'status'];

// Privileged fields must never be dropped silently: a caller that supplies one
// without permission gets a 422 rather than a success response that ignored it.
// Roles that are provisioned by an authenticated admin rather than self-registered.
// The admin's act of provisioning IS the authorization decision, so these accounts
// are created verified — matching scripts/seedAdmin.js, which sets
// verificationStatus: 'verified' explicitly for the admin it seeds.
//
// This matters beyond tidiness: authService.updateVerificationByAdmin filters on
// { role: 'volunteer' }, so a non-volunteer left 'pending' could never be verified
// through the API. Verification remains a volunteer-only workflow.
const PRIVILEGED_ROLES = ['admin', 'spoc'];

const PRIVILEGED_FIELDS = [
  'role',
  'status',
  'verificationStatus',
  'isVerified',
  'refreshToken',
];

const assertNoForbiddenPrivilegedFields = (source = {}, allowed) => {
  const forbidden = PRIVILEGED_FIELDS.filter(
    (field) =>
      Object.prototype.hasOwnProperty.call(source, field) &&
      !allowed.includes(field)
  );

  if (forbidden.length) {
    throw new ApiError(
      422,
      'Validation failed',
      forbidden.map((field) => ({
        field,
        message: `${field} cannot be set through this endpoint`,
      }))
    );
  }
};

// Derives verificationStatus server-side from the role. Never reads
// verificationStatus from the caller — clients cannot supply it on any path.
//
//   -> admin | spoc   verified   provisioning by an authenticated admin IS the
//                                authorization decision (matches seedAdmin.js)
//   -> volunteer      pending    a demoted account must pass the volunteer
//                                verification workflow; it may not carry over
//                                the verified state it held while privileged
//
// Only an ACTUAL transition changes verification state: re-writing a user's
// existing role (volunteer -> volunteer) is not a demotion and must not
// silently un-verify someone who already passed verification.
const verificationForRoleTransition = (previousRole, nextRole) => {
  if (!nextRole || previousRole === nextRole) return undefined;
  if (PRIVILEGED_ROLES.includes(nextRole)) return 'verified';
  if (PRIVILEGED_ROLES.includes(previousRole) && nextRole === 'volunteer') {
    return 'pending';
  }
  return undefined;
};

const pick = (source = {}, allowed) =>
  allowed.reduce((acc, field) => {
    if (source[field] !== undefined) acc[field] = source[field];
    return acc;
  }, {});

const getAllUsers = async () => {
  return await User.find();
};

const getUserById = async (id) => {
  return await User.findById(id);
};

const createUser = async (userData, allowedFields = CREATE_ALLOWED_FIELDS) => {
  assertNoForbiddenPrivilegedFields(userData, allowedFields);
  const doc = pick(userData, allowedFields);
  // On create there is no previous role; a privileged role is verified and a
  // volunteer keeps the schema default of 'pending'.
  if (doc.role && PRIVILEGED_ROLES.includes(doc.role)) {
    doc.verificationStatus = 'verified';
  }
  return await User.create(doc);
};

const updateUserById = async (
  id,
  updateData,
  allowedFields = UPDATE_ALLOWED_FIELDS
) => {
  assertNoForbiddenPrivilegedFields(updateData, allowedFields);
  const doc = pick(updateData, allowedFields);

  if (doc.role) {
    const current = await User.findById(id).select('role');
    if (!current) return null;
    const derived = verificationForRoleTransition(current.role, doc.role);
    if (derived) doc.verificationStatus = derived;
  }

  return await User.findByIdAndUpdate(id, doc, {
    new: true,
    runValidators: true,
  });
};

const deleteUserById = async (id) => {
  return await User.findByIdAndDelete(id);
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserById,
  deleteUserById,
  CREATE_ALLOWED_FIELDS,
  UPDATE_ALLOWED_FIELDS,
  ADMIN_CREATE_ALLOWED_FIELDS,
  ADMIN_UPDATE_ALLOWED_FIELDS,
  PRIVILEGED_ROLES,
};

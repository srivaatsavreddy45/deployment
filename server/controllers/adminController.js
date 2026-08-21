const User = require('../models/User');
const userService = require('../services/userServices');
const asyncHandler = require('../middleware/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
	const users = await userService.getAllUsers();
	res.status(200).json({ success: true, count: users.length, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
	const user = await userService.getUserById(req.params.id);
	if (!user) {
		res.status(404);
		throw new Error('User not found');
	}
	res.status(200).json({ success: true, data: user });
});

const createUser = asyncHandler(async (req, res) => {
	// Admin provisioning: may set role (including 'spoc') and status.
	const user = await userService.createUser(
		req.body,
		userService.ADMIN_CREATE_ALLOWED_FIELDS
	);
	res.status(201).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
	const user = await userService.updateUserById(
		req.params.id,
		req.body,
		userService.ADMIN_UPDATE_ALLOWED_FIELDS
	);
	if (!user) {
		res.status(404);
		throw new Error('User not found');
	}
	res.status(200).json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
	const user = await userService.deleteUserById(req.params.id);
	if (!user) {
		res.status(404);
		throw new Error('User not found');
	}
	res.status(200).json({ success: true, data: {} });
});

const getDashboardStats = asyncHandler(async (req, res) => {
	const [total, active, inactive, pending] = await Promise.all([
		User.countDocuments(),
		User.countDocuments({ status: 'active' }),
		User.countDocuments({ status: 'inactive' }),
		User.countDocuments({ status: 'pending' }),
	]);

	res.status(200).json({
		success: true,
		data: { total, active, inactive, pending },
	});
});

module.exports = {
	getAllUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
	getDashboardStats,
};

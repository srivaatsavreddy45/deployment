const express = require('express');
const router = express.Router();
const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  updateActivityStatus,
  deleteActivity,
} = require('../controllers/activityController');
const {
  createActivityValidator,
  updateActivityValidator,
  statusValidator,
  idParamValidator,
  listActivitiesValidator,
} = require('../validators/activityValidator');
const validateRequest = require('../middleware/validateRequest');

router
  .route('/')
  .get(listActivitiesValidator, validateRequest, getActivities)
  .post(createActivityValidator, validateRequest, createActivity);

router
  .route('/:id')
  .get(idParamValidator, validateRequest, getActivityById)
  .put(idParamValidator, updateActivityValidator, validateRequest, updateActivity)
  .delete(idParamValidator, validateRequest, deleteActivity);

router.patch(
  '/:id/status',
  idParamValidator,
  statusValidator,
  validateRequest,
  updateActivityStatus
);

module.exports = router;

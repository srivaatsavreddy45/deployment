const asyncHandler = require('../middleware/asyncHandler');
const spocService = require('../services/spocService');


const getSpocDashboard = asyncHandler(async (req, res) => {
  const stats = await spocService.getDashboardStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});


const getActivityResponses = asyncHandler(async (req, res) => {
  const { activityId } = req.params;

  const responses = await spocService.getActivityResponses(
    activityId
  );

  res.status(200).json({
    success: true,
    count: responses.length,
    data: responses,
  });
});


const getActivityFeedback = asyncHandler(async (req, res) => {
  const { activityId } = req.params;

  const feedback = await spocService.getActivityFeedback(
    activityId
  );

  res.status(200).json({
    success: true,
    data: feedback,
  });
});


const getActivityKeywords = asyncHandler(async (req, res) => {
  const { activityId } = req.params;

  const keywords = await spocService.getKeywords(
    activityId
  );

  res.status(200).json({
    success: true,
    data: keywords,
  });
});


const getActivitySentiment = asyncHandler(async (req, res) => {
  const { activityId } = req.params;

  const sentiment = await spocService.getSentiment(
    activityId
  );

  res.status(200).json({
    success: true,
    data: sentiment,
  });
});


const getActivityInsights = asyncHandler(async (req, res) => {
  const { activityId } = req.params;

  const insights = await spocService.getActivityInsights(
    activityId
  );

  res.status(200).json({
    success: true,
    data: insights,
  });
});


module.exports = {
  getSpocDashboard,
  getActivityResponses,
  getActivityFeedback,
  getActivityKeywords,
  getActivitySentiment,
  getActivityInsights,
};

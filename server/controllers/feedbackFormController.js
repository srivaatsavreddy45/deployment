const FeedbackForm = require("../models/FeedbackForm");

const createFeedbackForm = async (req, res) => {
  try {
    const { activityId, title, description, questions } = req.body;

    if (!activityId || !title || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Activity, title and questions are required"
      });
    }

    const feedbackForm = await FeedbackForm.create({
      activityId,
      title,
      description,
      questions,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: "Feedback form created successfully",
      data: feedbackForm
    });

  } catch (error) {
    console.error("Create feedback form error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create feedback form"
    });
  }
};

const getFeedbackForms = async (req, res) => {
  try {
    const feedbackForms = await FeedbackForm.find({});
    return res.status(200).json({
      success: true,
      data: feedbackForms
    });
  } catch (error) {
    console.error("Get feedback forms error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get feedback forms"
    });
  }
};

const getFeedbackFormById = async (req, res) => {
  try {
    const feedbackForm = await FeedbackForm.findById(req.params.id);
    if (!feedbackForm) {
      return res.status(404).json({
        success: false,
        message: "Feedback form not found"
      });
    }
    return res.status(200).json({
      success: true,
      data: feedbackForm
    });
  } catch (error) {
    console.error("Get feedback form error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get feedback form"
    });
  }
};

const updateFeedbackForm = async (req, res) => {
  try {
    const { title, description, questions, status } = req.body;
    const feedbackForm = await FeedbackForm.findByIdAndUpdate(
      req.params.id,
      { title, description, questions, status },
      { new: true, runValidators: true }
    );
    if (!feedbackForm) {
      return res.status(404).json({
        success: false,
        message: "Feedback form not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Feedback form updated successfully",
      data: feedbackForm
    });
  } catch (error) {
    console.error("Update feedback form error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update feedback form"
    });
  }
};

const archiveFeedbackForm = async (req, res) => {
  try {
    const feedbackForm = await FeedbackForm.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!feedbackForm) {
      return res.status(404).json({
        success: false,
        message: "Feedback form not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Feedback form archived successfully",
      data: feedbackForm
    });
  } catch (error) {
    console.error("Archive feedback form error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to archive feedback form"
    });
  }
};

const getFeedbackFormByActivityId = async (req, res) => {
  try {
    const feedbackForm = await FeedbackForm.findOne({ activityId: req.params.activityId });
    if (!feedbackForm) {
      return res.status(404).json({
        success: false,
        message: "Feedback form not found for this activity"
      });
    }
    return res.status(200).json({
      success: true,
      data: feedbackForm
    });
  } catch (error) {
    console.error("Get activity feedback form error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get feedback form for this activity"
    });
  }
};

module.exports = {
  createFeedbackForm,
  getFeedbackForms,
  getFeedbackFormById,
  updateFeedbackForm,
  archiveFeedbackForm,
  getFeedbackFormByActivityId
};
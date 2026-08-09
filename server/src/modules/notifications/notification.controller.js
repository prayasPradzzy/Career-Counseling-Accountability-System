const Notification = require("./notification.model");
const ApiResponse = require("../../shared/utils/ApiResponse");
const catchAsync = require("../../shared/utils/catchAsync");

const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json(new ApiResponse(200, notifications, "Notifications retrieved."));
});

const markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  res.status(200).json(new ApiResponse(200, null, "All notifications marked as read."));
});

const clearAll = catchAsync(async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id });
  res.status(200).json(new ApiResponse(200, null, "Notifications cleared."));
});

module.exports = {
  getMyNotifications,
  markAllRead,
  clearAll,
};

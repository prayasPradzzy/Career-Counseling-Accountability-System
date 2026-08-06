const catchAsync = require("../../shared/utils/catchAsync");
const profileService = require("./profile.service");

const getProfile = catchAsync(async (req, res) => {
  const result = await profileService.getProfile(req.user);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await profileService.updateProfile(req.user, req.body);
  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: result,
  });
});

const getCompleteness = catchAsync(async (req, res) => {
  const result = await profileService.getCompleteness(req.user);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getCounselorCaseload = catchAsync(async (req, res) => {
  const result = await profileService.getCounselorCaseload(req.user);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getCompleteness,
  getCounselorCaseload,
};

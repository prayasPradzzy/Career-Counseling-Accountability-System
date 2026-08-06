const express = require("express");
const router = express.Router();
const profileController = require("../profiles/profile.controller");
const counselorInviteService = require("./counselorInvite.service");
const User = require("../users/user.model");
const CounselorProfile = require("./counselorProfile.model");
const ApiError = require("../../shared/utils/ApiError");
const catchAsync = require("../../shared/utils/catchAsync");
const { requireAuth, restrictTo } = require("../../shared/middleware/auth.middleware");

router.use(requireAuth);

// GET /api/v1/counselor/caseload
router.get("/caseload", restrictTo("counselor", "admin"), profileController.getCounselorCaseload);

// GET /api/v1/counselor/my-counselor (Student-facing: returns ONLY student's assigned counselor)
router.get(
  "/my-counselor",
  restrictTo("student", "admin"),
  catchAsync(async (req, res) => {
    if (req.user.role === "student" && !req.user.counselorId) {
      return res.status(200).json({
        status: "success",
        data: null,
        message: "No counselor assigned to this student account.",
      });
    }

    const targetCounselorId = req.user.role === "student" ? req.user.counselorId : req.query.counselorId;
    if (!targetCounselorId) {
      throw new ApiError(400, "Counselor ID required.");
    }

    const counselorUser = await User.findOne({ _id: targetCounselorId, role: "counselor" }).select(
      "firstName lastName email phone"
    );

    if (!counselorUser) {
      throw new ApiError(404, "Assigned counselor account not found.");
    }

    const counselorProfile = await CounselorProfile.findOne({ userId: counselorUser._id });

    res.status(200).json({
      status: "success",
      data: {
        id: counselorUser._id,
        firstName: counselorUser.firstName,
        lastName: counselorUser.lastName,
        email: counselorUser.email,
        phone: counselorProfile?.phone || "",
        gender: counselorProfile?.gender || "",
        credentials: counselorProfile?.credentials || {},
        practice: counselorProfile?.practice || {},
        availability: counselorProfile?.availability || {},
      },
    });
  })
);

// GET /api/v1/counselor/invite-code
router.get(
  "/invite-code",
  restrictTo("counselor", "admin"),
  catchAsync(async (req, res) => {
    const result = await counselorInviteService.getActiveInviteCode(req.user);
    res.status(200).json({
      status: "success",
      data: result,
    });
  })
);

// POST /api/v1/counselor/invite-code/regenerate
router.post(
  "/invite-code/regenerate",
  restrictTo("counselor", "admin"),
  catchAsync(async (req, res) => {
    const result = await counselorInviteService.regenerateInviteCode(req.user);
    res.status(200).json({
      status: "success",
      message: "Invite code regenerated successfully. Old code is now deactivated.",
      data: result,
    });
  })
);

module.exports = router;

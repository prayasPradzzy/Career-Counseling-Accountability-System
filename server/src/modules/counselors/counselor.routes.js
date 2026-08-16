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

const StudentProfile = require("../profiles/studentProfile.model");

// GET /api/v1/counselor/my-counselor (Student-facing: returns ONLY student's assigned counselor)
router.get(
  "/my-counselor",
  restrictTo("student", "admin"),
  catchAsync(async (req, res) => {
    let targetCounselorId = req.user.role === "student" ? req.user.counselorId : req.query.counselorId;

    // Fallback: If student User record doesn't have counselorId set directly, check StudentProfile then AssessmentAssignment
    if (req.user.role === "student" && !targetCounselorId) {
      const studentProfile = await StudentProfile.findOne({ userId: req.user._id });
      if (studentProfile) {
        targetCounselorId = studentProfile.assignedCounselorId || studentProfile.invitedBy;
      }

      if (!targetCounselorId) {
        const { AssessmentAssignment } = require("../assessments/assessmentAssignment.model");
        const assignment = await AssessmentAssignment.findOne({ studentId: req.user._id, counselorId: { $ne: null } }).sort({ createdAt: -1 });
        if (assignment && assignment.counselorId) {
          targetCounselorId = assignment.counselorId;
        }
      }

      if (targetCounselorId) {
        // Auto-sync User model for consistency across endpoints
        req.user.counselorId = targetCounselorId;
        await req.user.save().catch((err) =>
          console.error("[MyCounselor] Failed to sync counselorId to User model:", err.message)
        );
      }
    }

    if (req.user.role === "student" && !targetCounselorId) {
      console.log(`[MyCounselor] Student user ${req.user._id} (${req.user.email}) has no assigned counselor.`);
      return res.status(200).json({
        status: "success",
        data: null,
        message: "No counselor assigned to this student account.",
      });
    }

    if (!targetCounselorId) {
      console.error("[MyCounselor Error] Counselor ID required for query but not provided.");
      throw new ApiError(400, "Counselor ID required.");
    }

    const counselorUser = await User.findOne({ _id: targetCounselorId, role: "counselor" }).select(
      "firstName lastName email phone"
    );

    if (!counselorUser) {
      console.error(`[MyCounselor Error] Counselor User ${targetCounselorId} not found in DB for student ${req.user._id}.`);
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

const AssessmentScore = require("../assessments/assessmentScore.model");
const { isSameId, canCounselorAccessStudent } = require("../../shared/utils/ownership.utils");

// GET /api/v1/counselor/students/:id/assessments/ipip-neo-120/results
// NOTE: this route previously had TWO `$or` keys in the same query object — the
// second silently overwrote the first, dropping the student scope so ANY
// student's latest IPIP score was returned (a real data leak, same bug class as
// SCHEMA_CONTRACT.md). Fixed: one $and with both clauses + an ownership check.
router.get(
  "/students/:id/assessments/ipip-neo-120/results",
  restrictTo("counselor", "admin"),
  catchAsync(async (req, res) => {
    const studentId = req.params.id;

    // Ownership: counselors may only pull results for their OWN students
    if (req.user.role === "counselor") {
      const [studentUser, studentProfile] = await Promise.all([
        User.findById(studentId).select("counselorId role"),
        StudentProfile.findOne({ userId: studentId }).select("assignedCounselorId invitedBy"),
      ]);
      if (!canCounselorAccessStudent(req.user._id, studentUser, studentProfile)) {
        throw new ApiError(403, "Access denied: You can only access your own assigned students.");
      }
    }

    const score = await AssessmentScore.findOne({
      $and: [
        { $or: [{ clientId: studentId }, { studentId: studentId }] },
        { $or: [{ assessmentKey: "ipip-neo-120" }, { category: "personality" }] },
      ],
    }).sort({ version: -1, calculatedAt: -1 });

    if (!score) {
      return res.status(404).json({
        status: "fail",
        message: "No scored IPIP-NEO-120 assessment found for this student.",
        data: null,
      });
    }

    res.status(200).json({
      status: "success",
      data: score,
    });
  })
);

const assessmentSessionController = require("../assessments/assessmentSession.controller");

// POST /api/v1/counselor/assessments/:sessionId/retake
router.post(
  "/assessments/:sessionId/retake",
  restrictTo("counselor", "admin"),
  assessmentSessionController.requestRetakeBySessionId
);

module.exports = router;

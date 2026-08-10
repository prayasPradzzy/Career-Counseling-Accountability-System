const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const { AssessmentAssignment } = require("../modules/assessments/assessmentAssignment.model");
const AssessmentDefinition = require("../modules/assessments/assessmentDefinition.model");
const User = require("../modules/users/user.model");
const StudentProfile = require("../modules/profiles/studentProfile.model");
const assessmentAssignmentService = require("../modules/assessments/assessmentAssignment.service");

async function debugRetakeIssue() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Fetch all counselors
  const counselors = await User.find({ role: "counselor" });
  const admins = await User.find({ role: "admin" });
  const allCounselorUsers = [...counselors, ...admins];

  console.log(`Found ${counselors.length} counselors and ${admins.length} admins.`);

  // Fetch all completed / assigned assignments
  const assignments = await AssessmentAssignment.find({})
    .populate("studentId", "firstName lastName email counselorId")
    .populate("counselorId", "firstName lastName email")
    .populate("assessmentDefinitionId", "title code category");

  console.log(`Found total ${assignments.length} assignments in database.\n`);

  for (const assignment of assignments) {
    console.log(`--- Checking Assignment ID: ${assignment._id} ---`);
    console.log(`Title: ${assignment.assessmentDefinitionId?.title || "Unknown"}`);
    console.log(`Status: ${assignment.status}`);
    console.log(`StudentId: ${assignment.studentId?._id || assignment.studentId}`);
    console.log(`CounselorId on assignment: ${assignment.counselorId?._id || assignment.counselorId}`);

    for (const counselorUser of allCounselorUsers) {
      try {
        const counselorId = counselorUser._id;
        const [profiles, users] = await Promise.all([
          StudentProfile.find({
            $or: [{ assignedCounselorId: counselorId }, { invitedBy: counselorId }],
          }).select("userId"),
          User.find({ counselorId, role: "student" }).select("_id"),
        ]);

        const profileUserIds = profiles.map((p) => p.userId).filter(Boolean);
        const userIds = users.map((u) => u._id).filter(Boolean);

        const studentIds = Array.from(
          new Set([...profileUserIds, ...userIds].map((id) => id.toString()))
        );

        const assignmentQuery = {
          _id: assignment._id,
          $or: [
            { counselorId: counselorUser._id },
            { studentId: { $in: studentIds.map(id => new mongoose.Types.ObjectId(id)) } },
          ],
        };

        const match = await AssessmentAssignment.findOne(assignmentQuery);
        if (match) {
          console.log(`   Counselor (${counselorUser.email}): MATCH!`);
          // Try running requestRetake dry run or check if it throws
          try {
            await assessmentAssignmentService.requestRetake(
              { assignmentId: assignment._id, reason: "Debug test retake" },
              counselorUser
            );
            console.log(`   --> requestRetake SUCCESS for ${counselorUser.email}`);
          } catch (retakeErr) {
            console.error(`   --> requestRetake FAILED for ${counselorUser.email}:`, retakeErr.message, retakeErr.stack);
          }
        }
      } catch (err) {
        console.error(`   Error testing counselor ${counselorUser.email}:`, err.message);
      }
    }
  }

  process.exit(0);
}

debugRetakeIssue().catch((e) => {
  console.error("Diagnostic error:", e);
  process.exit(1);
});

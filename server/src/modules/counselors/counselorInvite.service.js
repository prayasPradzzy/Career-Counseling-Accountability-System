const InviteCode = require("../auth/inviteCode.model");
const ApiError = require("../../shared/utils/ApiError");
const { generateUniqueInviteCode } = require("../../shared/utils/inviteCodeGenerator");

class CounselorInviteService {
  /**
   * GET active invite code for counselor (with lazy creation fallback)
   */
  async getActiveInviteCode(counselorUser) {
    if (counselorUser.role !== "counselor" && counselorUser.role !== "admin") {
      throw new ApiError(403, "Only counselors and administrators can access invite codes.");
    }

    let activeInvite = await InviteCode.findOne({
      ownerId: counselorUser._id,
      type: "student-invite",
      active: true,
    });

    // Lazy creation if missing due to data inconsistency or legacy accounts
    if (!activeInvite) {
      const code = await generateUniqueInviteCode();
      activeInvite = await InviteCode.create({
        code,
        type: "student-invite",
        ownerId: counselorUser._id,
        ownerRole: counselorUser.role,
        active: true,
        maxUses: null,
        expiresAt: null,
      });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    return {
      code: activeInvite.code,
      link: `${clientUrl}/signup?code=${activeInvite.code}`,
      usedCount: activeInvite.usedCount,
      createdAt: activeInvite.createdAt,
      active: activeInvite.active,
    };
  }

  /**
   * POST regenerate active invite code for counselor
   * Deactivates old code immediately and returns new active code.
   */
  async regenerateInviteCode(counselorUser) {
    if (counselorUser.role !== "counselor" && counselorUser.role !== "admin") {
      throw new ApiError(403, "Only counselors and administrators can regenerate invite codes.");
    }

    // Soft-deactivate all previous standing codes for this counselor
    await InviteCode.updateMany(
      {
        ownerId: counselorUser._id,
        type: "student-invite",
        active: true,
      },
      { active: false }
    );

    // Create fresh unique code
    const newCode = await generateUniqueInviteCode();
    const newInvite = await InviteCode.create({
      code: newCode,
      type: "student-invite",
      ownerId: counselorUser._id,
      ownerRole: counselorUser.role,
      active: true,
      maxUses: null,
      expiresAt: null,
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    return {
      code: newInvite.code,
      link: `${clientUrl}/signup?code=${newInvite.code}`,
      usedCount: newInvite.usedCount,
      createdAt: newInvite.createdAt,
      active: newInvite.active,
    };
  }
}

module.exports = new CounselorInviteService();

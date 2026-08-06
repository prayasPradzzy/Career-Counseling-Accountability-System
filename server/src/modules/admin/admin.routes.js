const express = require("express");
const router = express.Router();
const User = require("../users/user.model");
const ApiError = require("../../shared/utils/ApiError");
const catchAsync = require("../../shared/utils/catchAsync");
const { requireAuth, restrictTo } = require("../../shared/middleware/auth.middleware");

// POST /api/v1/admin/create-admin (Protected: Admin Only)
router.post(
  "/create-admin",
  requireAuth,
  restrictTo("admin"),
  catchAsync(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw new ApiError(409, "email_already_exists");
    }

    const adminUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password,
      role: "admin",
    });

    const userObj = adminUser.toObject();
    delete userObj.password;

    res.status(201).json({
      status: "success",
      message: "Admin account created successfully",
      data: { user: userObj },
    });
  })
);

module.exports = router;

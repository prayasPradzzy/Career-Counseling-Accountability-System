const express = require("express");
const authController = require("./auth.controller");
const validate = require("../../shared/middleware/validate.middleware");
const { requireAuth } = require("../../shared/middleware/auth.middleware");
const { signupSchema, loginSchema } = require("./auth.validation");

const router = express.Router();

/**
 * Auth Routes
 * Exists to map URLs to specific controller functions, applying middleware like validation.
 */

// POST /api/v1/auth/signup
router.post("/signup", validate(signupSchema), authController.signup);

// POST /api/v1/auth/login
router.post("/login", validate(loginSchema), authController.login);

// GET /api/v1/auth/me
// Uses the requireAuth middleware to ensure only logged-in users can access it
router.get("/me", requireAuth, authController.getMe);

module.exports = router;

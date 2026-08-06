const express = require("express");
const router = express.Router();
const profileController = require("./profile.controller");
const { requireAuth } = require("../../shared/middleware/auth.middleware");

// All profile endpoints require authentication
router.use(requireAuth);

router.get("/", profileController.getProfile);
router.patch("/", profileController.updateProfile);
router.put("/", profileController.updateProfile);
router.get("/completeness", profileController.getCompleteness);

module.exports = router;

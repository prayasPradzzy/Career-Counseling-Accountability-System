const express = require("express");
const router = express.Router();
const controller = require("./notification.controller");
const { requireAuth } = require("../../shared/middleware/auth.middleware");

router.use(requireAuth);

router.get("/", controller.getMyNotifications);
router.patch("/mark-all-read", controller.markAllRead);
router.delete("/clear-all", controller.clearAll);

module.exports = router;

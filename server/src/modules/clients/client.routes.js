const express = require("express");
const clientController = require("./client.controller");
const validate = require("../../shared/middleware/validate.middleware");
const { requireAuth, restrictTo } = require("../../shared/middleware/auth.middleware");
const {
  createClientSchema,
  inviteStudentSchema,
  activateStudentSchema,
  updateClientSchema,
  assignCounselorSchema,
  consentSchema,
} = require("./client.validator");

const router = express.Router();

// Public Activation Endpoint for Flow B & Flow C invited students creating their password
router.post("/activate", validate(activateStudentSchema), clientController.activateStudentAccount);

// Protected endpoints require authentication
router.use(requireAuth);

// Flow B & Flow C: Counselor or Admin creates Student Record & generates invitation token
router.post(
  "/invite",
  restrictTo("counselor", "admin"),
  validate(inviteStudentSchema),
  clientController.inviteStudent
);

// Routes accessible by Counselors & Admins
router
  .route("/")
  .post(restrictTo("counselor", "admin"), validate(createClientSchema), clientController.createClientProfile)
  .get(restrictTo("counselor", "admin"), clientController.getClients);

// Assign Counselor endpoint
router.patch(
  "/:id/counselor",
  restrictTo("counselor", "admin"),
  validate(assignCounselorSchema),
  clientController.assignCounselor
);

// Individual student profile routes (RBAC enforced inside service layer for students)
router
  .route("/:id")
  .get(clientController.getClientProfile)
  .put(validate(updateClientSchema), clientController.updateClientProfile)
  .delete(restrictTo("counselor", "admin"), clientController.softDeleteClientProfile);

// Update consent status
router.patch("/:id/consent", validate(consentSchema), clientController.updateConsentStatus);

// Session history placeholder endpoint
router.get("/:id/sessions", clientController.getClientSessions);

module.exports = router;

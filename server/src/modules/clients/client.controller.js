const clientService = require("./client.service");
const catchAsync = require("../../shared/utils/catchAsync");

/**
 * ClientController
 * Thin controller layer delegating business logic to clientService.
 */
class ClientController {
  createClientProfile = catchAsync(async (req, res) => {
    const profile = await clientService.createStudentProfile(req.body, req.user);
    res.status(201).json({
      status: "success",
      message: "Student profile created successfully",
      data: { profile },
    });
  });

  inviteStudent = catchAsync(async (req, res) => {
    const result = await clientService.inviteStudent(req.body, req.user);
    res.status(201).json({
      status: "success",
      message: "Student record created and invitation token generated successfully",
      data: result,
    });
  });

  activateStudentAccount = catchAsync(async (req, res) => {
    const result = await clientService.activateStudentAccount(req.body);
    res.status(200).json({
      status: "success",
      message: "Student account activated and password created successfully",
      data: result,
    });
  });

  getClientProfile = catchAsync(async (req, res) => {
    const profile = await clientService.getStudentProfile(req.params.id, req.user);
    res.status(200).json({
      status: "success",
      data: { profile },
    });
  });

  getClients = catchAsync(async (req, res) => {
    const result = await clientService.getClients(req.query, req.user);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  updateClientProfile = catchAsync(async (req, res) => {
    const profile = await clientService.updateStudentProfile(req.params.id, req.body, req.user);
    res.status(200).json({
      status: "success",
      message: "Student profile updated successfully",
      data: { profile },
    });
  });

  softDeleteClientProfile = catchAsync(async (req, res) => {
    const result = await clientService.softDeleteStudentProfile(req.params.id, req.user);
    res.status(200).json({
      status: "success",
      message: result.message,
    });
  });

  assignCounselor = catchAsync(async (req, res) => {
    const profile = await clientService.assignCounselor(
      req.params.id,
      req.body.counselorId,
      req.user
    );
    res.status(200).json({
      status: "success",
      message: "Counselor assigned successfully",
      data: { profile },
    });
  });

  updateConsentStatus = catchAsync(async (req, res) => {
    const profile = await clientService.updateConsent(req.params.id, req.body, req.user);
    res.status(200).json({
      status: "success",
      message: "Consent status updated successfully",
      data: { profile },
    });
  });

  getClientSessions = catchAsync(async (req, res) => {
    const result = await clientService.getClientSessionsPlaceholder(req.params.id, req.user);
    res.status(200).json({
      status: "success",
      data: result,
    });
  });
}

module.exports = new ClientController();

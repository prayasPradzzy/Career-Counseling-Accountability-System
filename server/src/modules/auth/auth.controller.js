const authService = require("./auth.service");
const catchAsync = require("../../shared/utils/catchAsync");
const ApiResponse = require("../../shared/utils/ApiResponse");

/**
 * Auth Controller
 * Exists to orchestrate the HTTP request. Extracts data, calls the service, and sends the response.
 */
class AuthController {
  signup = catchAsync(async (req, res) => {
    // Call the service layer to perform business logic
    const user = await authService.signup(req.body);

    // Send a standardized success response
    res.status(201).json(new ApiResponse(201, { user }, "User registered successfully"));
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    
    const { user, token } = await authService.login(email, password);

    // Set the JWT inside an HttpOnly cookie
    // HttpOnly: true prevents XSS (Cross-Site Scripting) by hiding the cookie from JavaScript
    // Secure: true ensures the cookie is only sent over HTTPS (disable in dev so it works on localhost)
    // SameSite: "Lax" protects against CSRF attacks while allowing normal navigation
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds (must match JWT_EXPIRES_IN)
    });

    res.status(200).json(new ApiResponse(200, { user, token }, "Login successful"));
  });

  getMe = catchAsync(async (req, res) => {
    // req.user is guaranteed to exist because this endpoint will be protected
    // by the requireAuth middleware.
    res.status(200).json(new ApiResponse(200, { user: req.user }, "Current user retrieved successfully"));
  });

  logout = catchAsync(async (req, res) => {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      expires: new Date(0),
    });

    res.status(200).json(new ApiResponse(200, null, "Logout successful"));
  });
}

module.exports = new AuthController();

const User = require("../users/user.model");
const signupStrategies = require("./signupStrategies");
const ApiError = require("../../shared/utils/ApiError");
const { generateToken } = require("../../shared/utils/jwt");

class AuthService {
  /**
   * Rebuilt Signup System — Role-Correct & Fully Enforced Dispatcher
   */
  async signup(userData) {
    let { role, name, firstName, lastName, ...rest } = userData;

    // Hard Security Rule: Rejects role = 'admin' unconditionally!
    if (role === "admin") {
      throw new ApiError(403, "role_not_allowed");
    }

    if (!role || !["student", "counselor", "parent"].includes(role)) {
      throw new ApiError(400, "invalid_role");
    }

    // Support single name field or firstName/lastName
    if (!firstName && name) {
      const parts = name.trim().split(" ");
      firstName = parts[0];
      lastName = parts.slice(1).join(" ") || parts[0];
    }

    if (!firstName || !lastName) {
      throw new ApiError(400, "First name and last name are required");
    }

    const handler = signupStrategies[role];
    return await handler({
      firstName,
      lastName,
      ...rest,
    });
  }

  async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = generateToken(user._id, user.role);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return { user: userWithoutPassword, token };
  }
}

module.exports = new AuthService();

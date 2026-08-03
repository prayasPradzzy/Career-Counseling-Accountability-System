const User = require("../users/user.model");
const ApiError = require("../../shared/utils/ApiError");
const { generateToken } = require("../../shared/utils/jwt");

/**
 * Auth Service
 * Exists to handle purely business logic. It does not know about HTTP requests or responses.
 * This makes it easily testable.
 */
class AuthService {
  async signup(userData) {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // 2. Create user (password hashing is handled by the pre-save hook in user.model.js)
    const user = await User.create(userData);

    // 3. Remove password from the returned object for security
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  async login(email, password) {
    // 1. Find the user by email
    // IMPORTANT: Because we set 'select: false' on the password field in our Schema,
    // we must explicitly ask Mongoose to include it for this specific query using '+password'
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // 2. Compare the provided password with the hashed password in the DB
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    // 3. Generate the JWT (Access Token)
    const token = generateToken(user._id, user.role);

    // 4. Remove password before returning
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return { user: userWithoutPassword, token };
  }
}

module.exports = new AuthService();

const jwt = require("jsonwebtoken");

/**
 * JWT Utility
 * Centralizes token generation. We include the user's ID and Role in the payload.
 * The role is included so the frontend (and backend middleware) can quickly check
 * permissions without having to query the database every time.
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

module.exports = {
  generateToken,
};

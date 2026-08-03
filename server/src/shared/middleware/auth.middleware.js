const jwt = require("jsonwebtoken");
const User = require("../../modules/users/user.model");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/**
 * Auth Middleware
 * Intercepts requests, verifies the JWT, and attaches the user to `req.user`.
 * If the user is unauthenticated or the token is invalid, it throws a 401.
 */
const requireAuth = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check if token exists in cookies OR in the Authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. If no token is found, block the request 
  if (!token) {
    return next(new ApiError(401, "You are not logged in. Please log in to get access."));
  }

  // 3. Verify the token signature (throws an error automatically if invalid/expired)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 4. Check if the user still exists in the database
  // (In case the account was deleted but the token hasn't expired yet)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new ApiError(401, "The user belonging to this token no longer exists."));
  }

  // 5. Grant access to protected route: Attach user to the request object
  req.user = currentUser;
  
  next();
});

module.exports = {
  requireAuth,
};

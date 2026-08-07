const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = `Duplicate value entered for ${Object.keys(err.keyValue)}. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message).join(", ");
    error = new ApiError(400, message);
  }

  // Handle Mongoose Cast Error (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    error = new ApiError(404, message);
  }

  // Handle JWT Invalid Token Error
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please log in again.");
  }

  // Handle JWT Expired Token Error
  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Your token has expired. Please log in again.");
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Developer-facing server logs:
  // — Always log 5xx errors (unexpected failures) with full stack trace.
  // — In development, also log 4xx (auth, not found, validation) so bugs are diagnosable without browser devtools.
  if (statusCode >= 500) {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
    console.error(err.stack || err);
  } else if (process.env.NODE_ENV === "development") {
    console.warn(`[WARN ${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
    if (err.stack) {
      console.warn(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;

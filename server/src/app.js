// ============================================================
// app.js — Express Application Configuration
// ============================================================
// This file is responsible for:
//   1. Creating the Express application instance
//   2. Registering global middleware (in correct order)
//   3. Mounting API routes
//   4. Handling 404 (unknown routes)
//   5. Registering the global error handler
//
// NOTE: This file does NOT start the server or connect to the
// database. That happens in server.js. This separation allows
// the app to be imported independently for testing.
// ============================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// ── Create Express App ──────────────────────────────────────
const app = express();

// ============================================================
// MIDDLEWARE PIPELINE
// ============================================================
// Order matters! Middleware executes top-to-bottom.
//
//   1. helmet    → Sets security headers FIRST (before any response)
//   2. cors      → Allows cross-origin requests from our frontend
//   3. morgan    → Logs the incoming request
//   4. json      → Parses JSON request bodies
//   5. urlencoded → Parses URL-encoded form data
//   6. cookieParser → Parses cookies (needed for JWT in HttpOnly cookies)
//   7. routes    → Handle the actual request
//   8. 404       → Catch unmatched routes
//   9. error     → Catch and format all errors
// ============================================================

// 1. Security headers
app.use(helmet());

// 2. CORS — Allow frontend to communicate with backend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // Allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. HTTP request logging
//    - "dev" format in development (colored, concise)
//    - "combined" format in production (Apache-style, for log aggregation)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// 4. Parse JSON request bodies
app.use(express.json({ limit: "10mb" }));

// 5. Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 6. Parse cookies from request headers
app.use(cookieParser());

const authRoutes = require("./modules/auth/auth.routes");
const clientRoutes = require("./modules/clients/client.routes");
const profileRoutes = require("./modules/profiles/profile.routes");
const counselorRoutes = require("./modules/counselors/counselor.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const assessmentAssignmentRoutes = require("./modules/assessments/assessmentAssignment.routes");
const assessmentSessionRoutes = require("./modules/assessments/assessmentSession.routes");
const assessmentDefinitionRoutes = require("./modules/assessments/assessmentDefinition.routes");
const errorHandler = require("./shared/middleware/error.middleware");

// ============================================================
// ROUTES
// ============================================================

// Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Mount feature routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/v1/counselor", counselorRoutes);
app.use("/api/counselor", counselorRoutes);
app.use("/api/v1/counselors", counselorRoutes);
app.use("/api/counselors", counselorRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1/assessment-definitions", assessmentDefinitionRoutes);
app.use("/api/v1/assessments/sessions", assessmentSessionRoutes);
app.use("/api/v1/assessments", assessmentAssignmentRoutes);

// ============================================================
// 404 HANDLER — Catch all unmatched routes
// ============================================================
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use(errorHandler);

module.exports = app;

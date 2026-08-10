// ============================================================
// server.js — Server Entry Point
// ============================================================
// This file is responsible for:
//   1. Loading environment variables (MUST be first)
//   2. Connecting to MongoDB
//   3. Starting the HTTP server
//   4. Handling graceful shutdown
//
// This file contains ALL side effects. The app (app.js) is
// purely configuration. This separation is critical for testing.
// ============================================================

// 1. Load environment variables BEFORE anything else
//    This MUST be the very first line — other modules may
//    read process.env during import.
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("./database/connectDB");
const app = require("./app");

// ── Configuration ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  // Connect to database first — don't accept requests until
  // the database is ready
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health\n`);
  });

  // ============================================================
  // GRACEFUL SHUTDOWN
  // ============================================================
  // When the process receives a termination signal (Ctrl+C, Docker
  // stop, Kubernetes pod termination), we:
  //   1. Stop accepting new connections
  //   2. Close the database connection
  //   3. Exit cleanly
  //
  // Without this, in-flight requests get dropped and database
  // connections leak. In production, this is critical.
  // ============================================================

  const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      console.log("📴 HTTP server closed");

      // Close database connection
      await mongoose.connection.close();
      console.log("📴 MongoDB connection closed");

      console.log("👋 Process terminated gracefully");
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error("❌ Forced shutdown — graceful shutdown timed out");
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // ============================================================
  // UNHANDLED ERRORS
  // ============================================================
  // These are safety nets. They should never fire in well-written
  // code, but they prevent the server from crashing silently.
  // ============================================================

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    // In production, you'd send this to an error tracking service
    // (Sentry, Datadog, etc.) before shutting down
    gracefulShutdown("UNHANDLED_REJECTION");
  });

  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    // Uncaught exceptions leave the process in an undefined state.
    // The only safe action is to shut down and restart.
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });
};

// ── Run ─────────────────────────────────────────────────────
startServer();

const mongoose = require("mongoose");

// ============================================================
// Database Connection Manager
// ============================================================
// This module handles establishing the connection to MongoDB
// and setting up event listeners for the connection lifecycle.
// By isolating this, our server.js stays clean and we can
// easily mock or swap the database in our test suites.
// ============================================================

const connectDB = async () => {
  try {
    // We retrieve the URI from the environment variables.
    // If it's undefined, we throw an error immediately instead of
    // letting Mongoose fail silently or timeout.
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is missing.");
    }

    // Mongoose handles connection pooling automatically.
    // We don't need deprecated options like useNewUrlParser 
    // or useUnifiedTopology in Mongoose 6+.
    const conn = await mongoose.connect(uri);

    console.log(`\n✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📁 Database Name: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`\n❌ Failed to connect to MongoDB Atlas:`);
    console.error(`Message: ${error.message}`);
    // We exit the process with code 1 (failure) because our app
    // cannot function without a database connection.
    process.exit(1);
  }
};

// ============================================================
// Connection Lifecycle Listeners
// ============================================================
// These listeners help us monitor connection health while the
// server is running. If Atlas goes down, or our IP changes,
// these events will fire and log the issue.

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

module.exports = connectDB;

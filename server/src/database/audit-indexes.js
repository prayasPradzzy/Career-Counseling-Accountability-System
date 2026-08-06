const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const connectDB = require("./connectDB");

const auditIndexes = async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    const allCollections = await db.listCollections().toArray();
    const collectionNames = allCollections.map((c) => c.name).sort();

    console.log(`\n📋 INDEX AUDIT — Found ${collectionNames.length} collections\n`);
    console.log("=".repeat(70));

    for (const name of collectionNames) {
      const indexes = await db.collection(name).indexes();
      const count = await db.collection(name).countDocuments();
      console.log(`\n📦 ${name} (${count} docs)`);
      for (const idx of indexes) {
        const keys = JSON.stringify(idx.key);
        const flags = [];
        if (idx.unique) flags.push("UNIQUE");
        if (idx.sparse) flags.push("SPARSE");
        const flagStr = flags.length ? ` [${flags.join(", ")}]` : "";
        console.log(`   • ${idx.name}: ${keys}${flagStr}`);
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ Index audit complete.\n");
    process.exit(0);
  } catch (err) {
    console.error("❌ Audit failed:", err);
    process.exit(1);
  }
};

auditIndexes();

const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const clientService = require("../modules/clients/client.service");
const profileService = require("../modules/profiles/profile.service");

async function testPrayasProfileUpdate() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const user = await db.collection("users").findOne({ email: "pradzzy6969@gmail.com" });
  console.log("=== BEFORE UPDATE (pradzzy6969@gmail.com) ===");

  const adminUser = { _id: "6a71190d86a916fc1f3bf740", role: "admin" };
  const studentUser = { _id: user._id, role: "student" };

  let listRes = await clientService.getClients({ search: "pradzzy6969" }, adminUser);
  let indRes = await profileService.getProfile(studentUser);
  console.log("List View Pct:", listRes.clients[0]?.completionPercentage);
  console.log("Individual View Pct:", indRes.completenessPercentage);
  console.log("MATCHES?", listRes.clients[0]?.completionPercentage === indRes.completenessPercentage);

  console.log("\n--- POPULATING PROFILE FIELDS FOR Prayas Singh (pradzzy6969@gmail.com) ---");
  await db.collection("studentprofiles").updateOne(
    { userId: user._id },
    {
      $set: {
        phone: "9998887770",
        gender: "male",
        education: [{ institution: "IIT Delhi", degree: "B.Tech", fieldOfStudy: "Computer Science", endYear: 2026 }],
        careerGoals: ["Data Scientist", "AI Researcher"],
        skills: ["Python", "Machine Learning"],
      },
    }
  );

  console.log("\n=== AFTER UPDATE (pradzzy6969@gmail.com) ===");
  listRes = await clientService.getClients({ search: "pradzzy6969" }, adminUser);
  indRes = await profileService.getProfile(studentUser);
  console.log("List View Pct:", listRes.clients[0]?.completionPercentage);
  console.log("Individual View Pct:", indRes.completenessPercentage);
  console.log("MATCHES?", listRes.clients[0]?.completionPercentage === indRes.completenessPercentage);

  process.exit(0);
}

testPrayasProfileUpdate().catch((e) => {
  console.error(e);
  process.exit(1);
});

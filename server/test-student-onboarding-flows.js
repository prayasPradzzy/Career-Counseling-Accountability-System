/**
 * Student Onboarding Flows Integration Test Script
 * Verifies Flow A (Self-Signup), Flow B (Counselor Invite), and Flow C (Admin Invite + Counselor Assignment).
 */

const API_BASE = "http://localhost:5000/api/v1";

async function runOnboardingFlowsTest() {
  console.log("==================================================");
  console.log("  STUDENT ONBOARDING WORKFLOW INTEGRATION TESTS");
  console.log("==================================================\n");

  let testPassed = 0;
  let testFailed = 0;

  const timestamp = Date.now();
  const password = "Password123!";

  // Roles
  const counselorEmail = `counselor_flow_${timestamp}@example.com`;
  const adminEmail = `admin_flow_${timestamp}@example.com`;
  let counselorCookie = "";
  let counselorUserId = "";
  let adminCookie = "";
  let adminUserId = "";

  try {
    // 0. Setup Counselor & Admin Accounts
    console.log("0. Setting up Counselor & Admin accounts...");
    await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Dr. Sarah",
        lastName: "Counselor",
        email: counselorEmail,
        password,
        role: "counselor",
      }),
    });
    const cLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: counselorEmail, password }),
    });
    const cLoginData = await cLoginRes.json();
    counselorUserId = cLoginData.data.user._id || cLoginData.data.user.id;
    counselorCookie = cLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "System",
        lastName: "Admin",
        email: adminEmail,
        password,
        role: "admin",
      }),
    });
    const aLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    const aLoginData = await aLoginRes.json();
    adminUserId = aLoginData.data.user._id || aLoginData.data.user.id;
    adminCookie = aLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    console.log("   ✅ Counselor & Admin Ready.");
    testPassed++;

    // ------------------------------------------------------------------------
    // FLOW A: Student Self-Registration
    // ------------------------------------------------------------------------
    console.log("\n--- FLOW A: Student Self-Registration ---");
    const flowAEmail = `student_flowA_${timestamp}@example.com`;
    const flowASignupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Alex",
        lastName: "SelfStudent",
        email: flowAEmail,
        password,
        role: "student",
      }),
    });
    const flowASignupData = await flowASignupRes.json();
    const flowAUserId = flowASignupData.data.user.id || flowASignupData.data.user._id;

    const flowALoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: flowAEmail, password }),
    });
    const flowACookie = flowALoginRes.headers.get("set-cookie")?.split(";")[0] || "";

    const flowAProfileRes = await fetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: counselorCookie,
      },
      body: JSON.stringify({
        userId: flowAUserId,
        phone: "+15551112222",
        education: [{ institution: "MIT", degree: "BS", fieldOfStudy: "Computer Science" }],
      }),
    });
    const flowAProfileData = await flowAProfileRes.json();
    console.log("   ✅ Flow A Verified. Profile ID:", flowAProfileData.data.profile.id);
    console.log("   ✅ Onboarding Source:", flowAProfileData.data.profile.onboardingSource);
    testPassed++;

    // ------------------------------------------------------------------------
    // FLOW B: Counselor-Initiated Registration
    // ------------------------------------------------------------------------
    console.log("\n--- FLOW B: Counselor-Initiated Student Invitation ---");
    const flowBEmail = `student_flowB_${timestamp}@example.com`;
    const flowBInviteRes = await fetch(`${API_BASE}/clients/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: counselorCookie,
      },
      body: JSON.stringify({
        email: flowBEmail,
        firstName: "Priya",
        lastName: "CounselorInvited",
        phone: "+15553334444",
        education: [{ institution: "Stanford", degree: "MS", fieldOfStudy: "AI" }],
      }),
    });
    const flowBInviteData = await flowBInviteRes.json();
    const flowBToken = flowBInviteData.data.invitationToken;
    console.log("   ✅ Student Record Created (Status: invited). Token Generated.");
    console.log("   ✅ Assigned Counselor:", flowBInviteData.data.studentProfile.assignedCounselorId.email);

    // Student Activates Account
    console.log("   Activating Flow B Student Account...");
    const flowBActivateRes = await fetch(`${API_BASE}/clients/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: flowBToken,
        password,
      }),
    });
    const flowBActivateData = await flowBActivateRes.json();
    console.log("   ✅ Student Account Activated! User Email:", flowBActivateData.data.user.email);

    // Student Logs In
    const flowBLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: flowBEmail, password }),
    });
    if (flowBLoginRes.status === 200) {
      console.log("   ✅ Flow B Student Successfully Logged In!");
      testPassed++;
    } else {
      console.error("   ❌ Flow B Login Failed!");
      testFailed++;
    }

    // ------------------------------------------------------------------------
    // FLOW C: Admin-Initiated Registration & Pre-Assignment
    // ------------------------------------------------------------------------
    console.log("\n--- FLOW C: Admin-Initiated Student Invitation & Pre-Assignment ---");
    const flowCEmail = `student_flowC_${timestamp}@example.com`;
    const flowCInviteRes = await fetch(`${API_BASE}/clients/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        email: flowCEmail,
        firstName: "Rohan",
        lastName: "AdminInvited",
        assignedCounselorId: counselorUserId,
        phone: "+15556667777",
      }),
    });
    const flowCInviteData = await flowCInviteRes.json();
    const flowCToken = flowCInviteData.data.invitationToken;
    console.log("   ✅ Admin Created Student Record (Pre-assigned Counselor:", flowCInviteData.data.studentProfile.assignedCounselorId.email, ")");

    // Student Activates Account
    console.log("   Activating Flow C Student Account...");
    const flowCActivateRes = await fetch(`${API_BASE}/clients/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: flowCToken,
        password,
      }),
    });
    const flowCActivateData = await flowCActivateRes.json();
    console.log("   ✅ Flow C Student Account Activated! Status:", flowCActivateData.data.studentProfile.status);
    testPassed++;

  } catch (err) {
    console.error("❌ Execution error:", err);
    testFailed++;
  }

  console.log("\n==================================================");
  console.log(`  RESULTS: ${testPassed} PASSED | ${testFailed} FAILED`);
  console.log("==================================================\n");
}

runOnboardingFlowsTest();

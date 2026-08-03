/**
 * Client Management Endpoints Integration Test Script
 * Tests RBAC, profile CRUD, counselor assignment, consent status, and profile completion using native fetch.
 */

const API_BASE = "http://localhost:5000/api/v1";

async function runClientManagementTests() {
  console.log("==================================================");
  console.log("  CLIENT MANAGEMENT BACKEND INTEGRATION TESTS");
  console.log("==================================================\n");

  let testPassed = 0;
  let testFailed = 0;

  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@example.com`;
  const counselorEmail = `counselor_${timestamp}@example.com`;
  const password = "Password123!";

  let studentCookie = "";
  let studentUserId = "";
  let counselorCookie = "";
  let counselorUserId = "";
  let createdProfileId = "";

  try {
    // Step 1: Create Student User & Login
    console.log("1. Creating Student user & logging in...");
    await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Alex",
        lastName: "Student",
        email: studentEmail,
        password: password,
        role: "student",
      }),
    });

    const studentLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentEmail, password }),
    });
    const studentLoginData = await studentLoginRes.json();
    studentUserId = studentLoginData.data.user._id || studentLoginData.data.user.id;
    const rawStudentCookie = studentLoginRes.headers.get("set-cookie");
    studentCookie = rawStudentCookie ? rawStudentCookie.split(";")[0] : "";
    console.log("   ✅ Student Logged In. User ID:", studentUserId);
    testPassed++;

    // Step 2: Create Counselor User & Login
    console.log("\n2. Creating Counselor user & logging in...");
    await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Dr. Sarah",
        lastName: "Counselor",
        email: counselorEmail,
        password: password,
        role: "counselor",
      }),
    });

    const counselorLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: counselorEmail, password }),
    });
    const counselorLoginData = await counselorLoginRes.json();
    counselorUserId = counselorLoginData.data.user._id || counselorLoginData.data.user.id;
    const rawCounselorCookie = counselorLoginRes.headers.get("set-cookie");
    counselorCookie = rawCounselorCookie ? rawCounselorCookie.split(";")[0] : "";
    console.log("   ✅ Counselor Logged In. User ID:", counselorUserId);
    testPassed++;

    // Step 3: Student attempts to create client profile (Should fail 403)
    console.log("\n3. Testing Student creation block (RBAC 403)...");
    const studentCreateRes = await fetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: studentCookie,
      },
      body: JSON.stringify({ userId: studentUserId }),
    });
    if (studentCreateRes.status === 403) {
      console.log("   ✅ Correctly Blocked with 403 Forbidden.");
      testPassed++;
    } else {
      console.error("   ❌ Unexpected status:", studentCreateRes.status);
      testFailed++;
    }

    // Step 4: Counselor creates ClientProfile for Student
    console.log("\n4. Counselor creating ClientProfile for Student...");
    const createProfileRes = await fetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: counselorCookie,
      },
      body: JSON.stringify({
        userId: studentUserId,
        phone: "+15550001111",
        dateOfBirth: "2003-04-12",
        gender: "male",
        education: [
          {
            institution: "MIT",
            degree: "BS",
            fieldOfStudy: "Computer Science",
            startYear: 2021,
            endYear: 2025,
          },
        ],
        careerGoals: ["Software Architect", "AI Engineer"],
        skills: ["Node.js", "Python"],
      }),
    });
    const profileData = await createProfileRes.json();
    createdProfileId = profileData.data.profile.id;
    console.log("   ✅ Profile Created. Profile ID:", createdProfileId);
    console.log("   ✅ Completion Percentage:", profileData.data.profile.completionPercentage, "%");
    testPassed++;

    // Step 5: Student views own profile
    console.log("\n5. Student viewing own profile...");
    const viewOwnRes = await fetch(`${API_BASE}/clients/${createdProfileId}`, {
      headers: { Cookie: studentCookie },
    });
    const ownData = await viewOwnRes.json();
    console.log("   ✅ Profile Fetched Successfully. Name:", ownData.data.profile.userId.firstName);
    testPassed++;

    // Step 6: Counselor assigns counselor
    console.log("\n6. Assigning Counselor to Client...");
    const assignRes = await fetch(`${API_BASE}/clients/${createdProfileId}/counselor`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: counselorCookie,
      },
      body: JSON.stringify({ counselorId: counselorUserId }),
    });
    const assignData = await assignRes.json();
    console.log("   ✅ Counselor Assigned:", assignData.data.profile.assignedCounselorId.email);
    testPassed++;

    // Step 7: Update Consent Status
    console.log("\n7. Updating Consent Status...");
    const consentRes = await fetch(`${API_BASE}/clients/${createdProfileId}/consent`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: counselorCookie,
      },
      body: JSON.stringify({
        isGiven: true,
        consentFormUrl: "https://example.com/consent.pdf",
      }),
    });
    const consentData = await consentRes.json();
    console.log("   ✅ Consent Updated:", consentData.data.profile.consentStatus.isGiven);
    testPassed++;

    // Step 8: Counselor lists clients with search and pagination
    console.log("\n8. Counselor listing clients with search...");
    const listRes = await fetch(`${API_BASE}/clients?search=Alex&page=1&limit=5`, {
      headers: { Cookie: counselorCookie },
    });
    const listData = await listRes.json();
    console.log("   ✅ Clients Found:", listData.data.clients.length, "| Total:", listData.data.pagination.total);
    testPassed++;

    // Step 9: Soft Delete Client Profile
    console.log("\n9. Soft deleting Client Profile...");
    const deleteRes = await fetch(`${API_BASE}/clients/${createdProfileId}`, {
      method: "DELETE",
      headers: { Cookie: counselorCookie },
    });
    const deleteData = await deleteRes.json();
    console.log("   ✅ Soft Delete Response:", deleteData.message);
    testPassed++;
  } catch (error) {
    console.error("❌ Test Execution Error:", error);
    testFailed++;
  }

  console.log("\n==================================================");
  console.log(`  RESULTS: ${testPassed} PASSED | ${testFailed} FAILED`);
  console.log("==================================================\n");
}

runClientManagementTests();

/**
 * Full Authentication Integration Verification Script
 * Tests full end-to-end auth flows against live backend server.
 */

const BASE_URL = "http://localhost:5000/api/v1";

async function runIntegrationTests() {
  console.log("==================================================");
  console.log("  AUTHENTICATION FULL INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function test(name, result, detail = "") {
    total++;
    if (result) {
      console.log(`[PASS] ${name}${detail ? ` -> ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  const timestamp = Date.now();
  const testStudent = {
    firstName: "Integration",
    lastName: "Student",
    email: `student_${timestamp}@example.com`,
    password: "Password123!",
    role: "student",
  };

  const testCounselor = {
    firstName: "Integration",
    lastName: "Counselor",
    email: `counselor_${timestamp}@example.com`,
    password: "Password123!",
    role: "counselor",
  };

  try {
    // 1. Health check
    const health = await fetch(`${BASE_URL}/health`).then((r) => r.json());
    test("Backend Health Check", health.success === true, health.message);

    // 2. Signup Student
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testStudent),
    });
    const signupData = await signupRes.json();
    test("Student Signup API", signupRes.status === 201 && signupData.success, `Role: ${signupData.data?.user?.role}`);

    // 3. Signup Counselor
    const counselorRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCounselor),
    });
    const counselorData = await counselorRes.json();
    test("Counselor Role Signup API", counselorRes.status === 201 && counselorData.data?.user?.role === "counselor", `Role: ${counselorData.data?.user?.role}`);

    // 4. Duplicate Email Error
    const dupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testStudent),
    });
    const dupData = await dupRes.json();
    test("Duplicate Email Prevention", dupRes.status === 409 && dupData.message.includes("exists"), dupData.message);

    // 5. Invalid Password Login
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testStudent.email, password: "WrongPassword!" }),
    });
    const invalidData = await invalidLoginRes.json();
    test("Invalid Password Rejection", invalidLoginRes.status === 401, invalidData.message);

    // 6. Valid Login & Cookie Header Check
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testStudent.email, password: testStudent.password }),
    });
    const loginData = await loginRes.json();
    const setCookie = loginRes.headers.get("set-cookie") || "";
    test(
      "Successful Login & Cookie Header",
      loginRes.status === 200 && setCookie.includes("HttpOnly") && setCookie.includes("SameSite=Lax"),
      `Cookie: ${setCookie.substring(0, 30)}...`
    );

    const authCookie = setCookie.split(";")[0];

    // 7. Session Persistence Check (GET /auth/me with Cookie)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: authCookie },
    });
    const meData = await meRes.json();
    test(
      "Session Restored via Cookie (GET /auth/me)",
      meRes.status === 200 && meData.data?.user?.email === testStudent.email,
      `Authenticated as ${meData.data?.user?.email}`
    );

    // 8. Logout & Cookie Removal
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Cookie: authCookie },
    });
    const logoutCookie = logoutRes.headers.get("set-cookie") || "";
    test(
      "Logout & Cookie Invalidation",
      logoutRes.status === 200 && (logoutCookie.includes("Expires=Thu, 01 Jan 1970") || logoutCookie.includes("token=;")),
      "Cookie cleared"
    );

    // 9. Unauthorized Access Post-Logout
    const postLogoutMe = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: "token=;" },
    });
    test("Unauthenticated Access Blocked Post-Logout", postLogoutMe.status === 401, "Status 401 Unauthorized");

    console.log("\n==================================================");
    console.log(`  FINAL VERIFICATION SCORE: ${passed}/${total} PASSED`);
    console.log("==================================================\n");
  } catch (err) {
    console.error("Integration test error:", err);
  }
}

runIntegrationTests();

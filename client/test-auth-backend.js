/**
 * Backend Auth Verification Suite
 * Tests signup, login, duplicate email, /me, logout, cookie headers, and roles.
 */

const BASE_URL = "http://localhost:5000/api/v1";

async function runTests() {
  console.log("=== STARTING BACKEND AUTHENTICATION TEST SUITE ===\n");
  let testPassCount = 0;
  let totalTests = 0;

  function assert(condition, description) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      testPassCount++;
    } else {
      console.error(`❌ FAIL: ${description}`);
    }
  }

  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@example.com`;
  const password = "TestPassword123!";

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, "Health Check Endpoint");

    // 2. Signup Test
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: testEmail,
        password: password,
        role: "student",
      }),
    });
    const signupData = await signupRes.json();
    assert(
      signupRes.status === 201 &&
        signupData.success === true &&
        signupData.data?.user?.email === testEmail &&
        signupData.data?.user?.role === "student",
      "Signup Endpoint (Creates new user)"
    );

    // 3. Duplicate Email Signup Test
    const dupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: testEmail,
        password: password,
        role: "student",
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 && dupData.success === false,
      "Duplicate Email Signup Prevention (Returns 409)"
    );

    // 4. Invalid Login Test
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword123!",
      }),
    });
    const invalidLoginData = await invalidLoginRes.json();
    assert(
      invalidLoginRes.status === 401 && invalidLoginData.success === false,
      "Invalid Credentials Login Prevention (Returns 401)"
    );

    // 5. Successful Login & Cookie Creation Test
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: password,
      }),
    });
    const loginData = await loginRes.json();
    const cookieHeader = loginRes.headers.get("set-cookie");

    assert(
      loginRes.status === 200 &&
        loginData.success === true &&
        cookieHeader &&
        cookieHeader.includes("token=") &&
        cookieHeader.includes("HttpOnly"),
      "Login Endpoint & HttpOnly Cookie Creation"
    );

    // Extract cookie value for subsequent requests
    const cookieValue = cookieHeader ? cookieHeader.split(";")[0] : "";

    // 6. /me Protected Route with Cookie Test
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: cookieValue,
      },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 &&
        meData.success === true &&
        meData.data?.user?.email === testEmail,
      "GET /auth/me with Cookie Authentication"
    );

    // 7. /me Protected Route WITHOUT Cookie Test
    const unauthMeRes = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
    });
    const unauthMeData = await unauthMeRes.json();
    assert(
      unauthMeRes.status === 401 && unauthMeData.success === false,
      "GET /auth/me Blocks Unauthenticated Request (Returns 401)"
    );

    // 8. Logout & Cookie Deletion Test
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: cookieValue,
      },
    });
    const logoutData = await logoutRes.json();
    const logoutCookieHeader = logoutRes.headers.get("set-cookie");

    assert(
      logoutRes.status === 200 &&
        logoutData.success === true &&
        logoutCookieHeader &&
        (logoutCookieHeader.includes("Expires=Thu, 01 Jan 1970") ||
          logoutCookieHeader.includes("token=;")),
      "Logout Endpoint & Cookie Invalidation"
    );

    // 9. /me Request After Logout Test
    const postLogoutMeRes = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: "token=;",
      },
    });
    assert(
      postLogoutMeRes.status === 401,
      "Access Blocked After Cookie Cleared"
    );

    console.log(`\n=== BACKEND TEST RESULTS: ${testPassCount}/${totalTests} PASSED ===\n`);
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

runTests();

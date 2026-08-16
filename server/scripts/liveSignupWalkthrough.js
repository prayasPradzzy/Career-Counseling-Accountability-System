/* Live signup walkthrough: counselor signup -> invite code -> login -> /auth/me
 * -> student signup with the code -> student login -> /auth/me.
 * Attaches the real Vercel Origin header to every call and reports whether CORS
 * headers came back, so it doubles as a live CORS check.
 * Usage: node scripts/liveSignupWalkthrough.js [base-url]
 */
// Base URL is required — pass it as an argument or set LIVE_API_URL. No
// hardcoded production URL here so this script never pins branding/deployment
// details into the repo.
const base = (process.argv[2] || process.env.LIVE_API_URL || "").replace(/\/$/, "");
if (!base) {
  console.error("Usage: node scripts/liveSignupWalkthrough.js <base-url>  (or set LIVE_API_URL)");
  process.exit(1);
}
const origin = "https://career-counseling-accountability-sy.vercel.app";
const stamp = Date.now().toString().slice(-8);
const counselorEmail = `cors.verify.${stamp}@example.com`;
const password = "VerifyPass123!";

const H = (extra = {}) => ({ "Content-Type": "application/json", Origin: origin, ...extra });

async function step(label, path, opts) {
  const res = await fetch(`${base}${path}`, { ...opts, signal: AbortSignal.timeout(30000) });
  const body = await res.json().catch(() => null);
  const acao = res.headers.get("access-control-allow-origin");
  console.log(`${label.padEnd(46)} HTTP ${res.status}${acao ? `  [CORS OK: ${acao}]` : "  [NO ACAO - browser would block]"}  ${body?.message || JSON.stringify(body).slice(0, 120)}`);
  return { res, body };
}

(async () => {
  console.log(`Base: ${base}\nOrigin: ${origin}\n`);

  // 1. Counselor signup
  const signup = await step("1) counselor signup", "/auth/signup", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ firstName: "Cors", lastName: "Verify", email: counselorEmail, password, role: "counselor" }),
  });
  const inviteCode = signup.body?.data?.user?.inviteCode?.code;
  console.log(`    invite code: ${inviteCode || "(none)"}\n`);

  // 2. Counselor login
  const login = await step("2) counselor login", "/auth/login", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ email: counselorEmail, password }),
  });
  const setCookie = login.res.headers.get("set-cookie") || "";
  const cookiePart = setCookie.split(";")[0];
  console.log(`    Set-Cookie: ${cookiePart || "(none)"}`);
  const sameSite = /samesite=none/i.test(setCookie) ? "SameSite=None ✓" : "SameSite missing/other";
  const secure = /secure/i.test(setCookie) ? "Secure ✓" : "Secure missing";
  console.log(`    cookie flags: ${sameSite}, ${secure}\n`);

  // 3. Protected route with cookie + Origin (what the browser does)
  const me = await step("3) GET /auth/me with cookie", "/auth/me", {
    headers: H({ Cookie: cookiePart }),
  });

  // 4. Student signup using the generated invite code
  const studentEmail = `cors.student.${stamp}@example.com`;
  const studentSignup = await step("4) student signup w/ invite", "/auth/signup", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ firstName: "Cors", lastName: "Kid", email: studentEmail, password, role: "student", code: inviteCode }),
  });

  // 5. Student login + protected route
  const sLogin = await step("5) student login", "/auth/login", {
    method: "POST",
    headers: H(),
    body: JSON.stringify({ email: studentEmail, password }),
  });
  const sCookie = (sLogin.res.headers.get("set-cookie") || "").split(";")[0];
  await step("6) student GET /auth/me", "/auth/me", { headers: H({ Cookie: sCookie }) });
})();

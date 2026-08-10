/* Auth flow probe — logs in and calls a protected route three ways:
 * 1) no token, 2) Authorization: Bearer header, 3) token cookie.
 * Usage: node scripts/authFlowProbe.js <base-url> [email] [password]
 */
const base = (process.argv[2] || "http://localhost:5000/api/v1").replace(/\/$/, "");
const email = process.argv[3] || "preview.counselor@example.com";
const password = process.argv[4] || "Password123!";

async function call(path, opts, label) {
  try {
    const res = await fetch(`${base}${path}`, {
      ...opts,
      signal: AbortSignal.timeout(8000),
    });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON */ }
    const msg = body && body.message ? body.message : (body && body.success ? "AUTHENTICATED" : JSON.stringify(body));
    console.log(`${label.padEnd(18)} -> HTTP ${res.status}  ${msg}`);
    return { res, body };
  } catch (e) {
    console.log(`${label.padEnd(18)} -> ERROR: ${e.name}: ${e.message}`);
    return null;
  }
}

(async () => {
  console.log(`Base: ${base}\n`);

  const login = await call("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }, "LOGIN");

  if (!login || login.res.status !== 200) {
    console.log("Login failed — can't continue.");
    process.exit(1);
  }

  const token = login.body?.data?.token;
  const setCookie = login.res.headers.get("set-cookie");
  console.log(`  token in body: ${token ? "yes" : "NO"}  |  Set-Cookie: ${setCookie ? setCookie.split(";")[0] : "(none)"}\n`);

  await call("/auth/me", {}, "1) no token");

  if (token) {
    await call("/auth/me", { headers: { Authorization: `Bearer ${token}` } }, "2) Bearer header");
    await call("/auth/me", { headers: { Cookie: `token=${token}` } }, "3) token cookie");
  }
})();

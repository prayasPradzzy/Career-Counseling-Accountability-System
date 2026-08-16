const BASE = "http://localhost:5000/api/v1";
const rid = `probe${Date.now().toString(36)}`;
async function main() {
  const res = await fetch(BASE + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Probe",
      lastName: "Counselor",
      email: `${rid}@example.com`,
      password: "Password123!",
      role: "counselor",
    }),
  });
  console.log("status:", res.status);
  const text = await res.text();
  console.log("body:", text.slice(0, 600));
}
main().catch((e) => { console.error(e); process.exit(1); });

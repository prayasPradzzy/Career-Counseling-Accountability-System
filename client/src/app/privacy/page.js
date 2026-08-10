import Link from "next/link";

// Privacy Policy — mirrors the auth footer link. Content is intentionally minimal.
export const metadata = {
  title: "Privacy Policy",
};

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect the information you provide when creating an account, such as your name, email address, and role. We also store assessment responses and results you generate while using the platform.",
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to operate the platform, deliver assessment results, connect students with counselors, and improve our services.",
  },
  {
    title: "3. Cookies & Authentication",
    body: "We use a secure, HTTP-only cookie to keep you signed in. No third-party advertising cookies are used.",
  },
  {
    title: "4. Sharing of Information",
    body: "Student profiles and assessment results are visible only to the counselor who invited them, unless you choose to share them otherwise.",
  },
  {
    title: "5. Data Retention",
    body: "We retain account and assessment data for as long as your account is active, and delete it upon account closure where technically feasible.",
  },
  {
    title: "6. Your Rights",
    body: "You may request access to, correction of, or deletion of your personal data at any time by contacting us.",
  },
  {
    title: "7. Contact",
    body: "Privacy questions can be directed to support at the address provided on the platform.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← Back to CareerPath
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: August 2026</p>
        <div className="mt-8 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
};

const SUPPORT_EMAIL = "support@margastra.app";
const LAST_UPDATED = "August 11, 2026";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly when using Margastra, including:",
    list: [
      "Account details — your name, email address, and role (student or counselor)",
      "Invite codes and counselor–student relationships established to connect you with a counselor",
      "Assessment responses and results you generate while using the platform",
      "Usage data — pages visited and features used, to understand how the platform is used",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: "Your information is used to operate the platform, deliver assessment results, connect students with their counselor, personalize your experience, and improve our services. We do not sell your personal information to third parties.",
  },
  {
    title: "3. Cookies & Authentication",
    body: "We use a single, secure, HTTP-only cookie to keep you signed in. It is required for the platform to function and cannot be read by client-side scripts. No third-party advertising or tracking cookies are used.",
  },
  {
    title: "4. Sharing of Information",
    body: "Student profiles and assessment results are visible only to the counselor who invited them, unless you choose to share them otherwise. We do not share your personal information with other third parties except as required by law or to provide the service.",
  },
  {
    title: "5. Data Retention",
    body: "We retain account and assessment data for as long as your account is active. You may close your account at any time, and we will delete your personal data where technically feasible, subject to legal or security obligations that require us to keep certain records.",
  },
  {
    title: "6. Your Rights",
    body: "Depending on your jurisdiction, you may have the right to:",
    list: [
      "Access the personal data we hold about you",
      "Request correction of inaccurate or incomplete data",
      "Request deletion of your personal data",
      "Object to or restrict certain processing of your data",
    ],
  },
  {
    title: "7. Contact Us",
    body: "Privacy questions or data requests can be directed to us by email.",
    mailto: true,
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
          ← Back to Margastra
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        <div className="mt-8 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              {section.list && (
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {section.mailto && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Privacy question about Margastra")}`}
                    className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

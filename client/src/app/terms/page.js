import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
};

const SUPPORT_EMAIL = "support@margastra.app";
const LAST_UPDATED = "August 11, 2026";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Margastra, you agree to be bound by these Terms of Service and to comply with all applicable laws. If you do not agree with any part of these Terms, please do not use the platform.",
  },
  {
    title: "2. Accounts & Eligibility",
    body: "You must be at least 13 years old to use Margastra. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate, current information when registering and to update it as needed.",
  },
  {
    title: "3. Acceptable Use",
    body: "You agree not to misuse the platform, including by:",
    list: [
      "Attempting to access another user's account or data without authorization",
      "Interfering with or disrupting the platform, its servers, or connected networks",
      "Uploading or transmitting malicious code, spam, or unlawful content",
      "Using the platform for any purpose that violates applicable law",
    ],
  },
  {
    title: "4. Assessments & Results",
    body: "Margastra provides career assessments and informational guidance. Assessment results are generated for educational purposes only and do not constitute professional career counseling, psychological evaluation, or employment decisions. You are responsible for how you interpret and act on the information you receive.",
  },
  {
    title: "5. Intellectual Property",
    body: "The platform, including its content, branding, software, and design, is owned by Margastra and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works from any part of the platform without prior written permission.",
  },
  {
    title: "6. Disclaimer of Warranties",
    body: "The platform is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied. We do not warrant that the platform will be uninterrupted, error-free, or free of harmful components.",
  },
  {
    title: "7. Limitation of Liability",
    body: "To the maximum extent permitted by law, Margastra shall not be liable for any indirect, incidental, special, or consequential damages, including loss of data, profits, or opportunity, arising from your use of or inability to use the platform.",
  },
  {
    title: "8. Changes to These Terms",
    body: "We may update these Terms from time to time. When we do, we will revise the \"Last updated\" date above. Continued use of the platform after changes take effect constitutes acceptance of the revised Terms. We encourage you to review this page periodically.",
  },
  {
    title: "9. Contact Us",
    body: "Questions about these Terms can be directed to us by email.",
    mailto: true,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-svh bg-background px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ← Back to Margastra
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Terms of Service</h1>
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
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Question about the Terms of Service")}`}
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

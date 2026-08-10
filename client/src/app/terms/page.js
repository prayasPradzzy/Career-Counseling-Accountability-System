import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using CareerPath, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.",
  },
  {
    title: "2. Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information when registering.",
  },
  {
    title: "3. Acceptable Use",
    body: "You agree not to misuse the platform, attempt to gain unauthorized access to other accounts or systems, or use the platform for any unlawful purpose.",
  },
  {
    title: "4. Intellectual Property",
    body: "The platform, including its content, branding, and software, is owned by CareerPath and protected by applicable intellectual property laws.",
  },
  {
    title: "5. Disclaimer of Warranties",
    body: "The platform is provided \"as is\" without warranties of any kind. Assessment results are informational and do not constitute professional career counseling.",
  },
  {
    title: "6. Limitation of Liability",
    body: "To the maximum extent permitted by law, CareerPath shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.",
  },
  {
    title: "7. Changes to These Terms",
    body: "We may update these Terms from time to time. Continued use of the platform after changes take effect constitutes acceptance of the revised Terms.",
  },
  {
    title: "8. Contact",
    body: "Questions about these Terms can be directed to support at the address provided on the platform.",
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
          ← Back to CareerPath
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Terms of Service</h1>
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

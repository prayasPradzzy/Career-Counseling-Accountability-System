import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

/**
 * Inter is used instead of Geist because:
 * - It's the gold-standard variable font for SaaS dashboards
 * - Ships with 9 weights, italic variants, and excellent legibility at all sizes
 * - Widely used by Vercel, Linear, Notion — signals premium product quality
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Margastra — AI-Powered Career Counseling",
    template: "%s | Margastra",
  },
  description:
    "Connect with expert career counselors, take AI-powered assessments, and build a personalized career roadmap. Margastra guides students and professionals to their ideal career.",
  keywords: [
    "career counseling",
    "career guidance",
    "career assessment",
    "AI career advice",
    "job counselor",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    title: "Margastra — AI-Powered Career Counseling",
    description:
      "Personalized career guidance powered by expert counselors and AI.",
    siteName: "Margastra",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

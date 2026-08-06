import { Suspense } from "react";
import { PublicRoute } from "@/components/guards/PublicRoute";
import { SignupForm } from "@/features/auth";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Sign Up",
  description: "Create a new CareerPath account",
};

export default function SignupPage() {
  return (
    <PublicRoute>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </PublicRoute>
  );
}

import { PublicRoute } from "@/components/guards/PublicRoute";
import { SignupForm } from "@/features/auth";

export const metadata = {
  title: "Sign Up",
  description: "Create a new CareerPath account",
};

export default function SignupPage() {
  return (
    <PublicRoute>
      <SignupForm />
    </PublicRoute>
  );
}

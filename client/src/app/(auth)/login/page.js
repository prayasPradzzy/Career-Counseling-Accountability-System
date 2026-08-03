import { PublicRoute } from "@/components/guards/PublicRoute";
import { LoginForm } from "@/features/auth";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your CareerPath account",
};

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginForm />
    </PublicRoute>
  );
}

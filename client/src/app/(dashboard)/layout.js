import { ProtectedRoute } from "@/components/guards/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Margastra",
  },
};

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

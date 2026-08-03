import { ForbiddenView } from "@/components/layout/ForbiddenView";

export const metadata = {
  title: "403 Forbidden Access",
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        <ForbiddenView />
      </div>
    </div>
  );
}

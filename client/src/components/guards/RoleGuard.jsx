"use client";

import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function RoleGuard({ allowedRoles = [], children, fallback }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex min-h-[300px] w-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            You do not have permission to view this content. Required role(s):{" "}
            <span className="font-semibold">{allowedRoles.join(", ")}</span>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
}

export default RoleGuard;

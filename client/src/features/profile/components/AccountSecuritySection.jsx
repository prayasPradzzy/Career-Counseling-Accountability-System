"use client";

import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";

export function AccountSecuritySection({ user }) {
  const createdAtDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Active Member";

  return (
    <SectionCard
      title="Account Security"
      subtitle="Account status and session credentials"
      iconName="ShieldAlert"
    >
      <div className="grid grid-cols-2 gap-4 text-sm pt-1">
        <div>
          <span className="text-xs text-muted-foreground block">Account Role</span>
          <span className="font-medium text-foreground capitalize">{user?.role || "Student"}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Member Since</span>
          <span className="font-medium text-foreground">{createdAtDate}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Security Status</span>
          <StatusBadge status="active" label="Verified Account" />
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Auth Strategy</span>
          <span className="font-medium text-foreground">JWT HttpOnly Cookie</span>
        </div>
      </div>
    </SectionCard>
  );
}

export default AccountSecuritySection;

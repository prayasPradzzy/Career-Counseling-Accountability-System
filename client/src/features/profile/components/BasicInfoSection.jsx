"use client";

import { InfoCard } from "@/components/common/InfoCard";

export function BasicInfoSection({ user, profile }) {
  const phone = profile?.phone || "Not Provided";
  const gender = profile?.gender
    ? profile.gender.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Not Specified";

  return (
    <InfoCard
      title="Basic Information"
      subtitle="Personal identification and contact details"
      iconName="UserCircle"
      items={[
        { label: "First Name", value: user?.firstName || "N/A" },
        { label: "Last Name", value: user?.lastName || "N/A" },
        { label: "Email Address", value: user?.email || "N/A" },
        { label: "Phone Number", value: phone },
        { label: "Gender Identity", value: gender },
        { label: "Account Scope", value: user?.role || "student" },
      ]}
    />
  );
}

export default BasicInfoSection;

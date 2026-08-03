import { InfoCard } from "@/components/common/InfoCard";

/**
 * GuardianCard Component
 * Displays guardian contact and relationship details for a client.
 */
export function GuardianCard({ guardianInfo, className }) {
  const items = [
    { label: "Guardian Name", value: guardianInfo?.name || "Not Provided" },
    { label: "Relationship", value: guardianInfo?.relationship || "Not Specified" },
    { label: "Contact Email", value: guardianInfo?.email || "Not Provided" },
    { label: "Contact Phone", value: guardianInfo?.phone || "Not Provided" },
  ];

  return (
    <InfoCard
      title="Guardian & Emergency Contact"
      subtitle="Parent/Guardian contact details for underage clients"
      iconName="Users"
      items={items}
      cols={2}
      className={className}
    />
  );
}

export default GuardianCard;

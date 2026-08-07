import Link from "next/link";
import { ProfileCard } from "@/components/common/ProfileCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";

/**
 * ClientCard Component
 * Displays grid card summary of a client profile.
 */
export function ClientCard({ client, onDelete, className }) {
  const user = client?.userId || {};
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Client";
  const counselor = client?.assignedCounselorId;
  const counselorName = counselor ? `${counselor.firstName} ${counselor.lastName}` : "Unassigned";

  return (
    <ProfileCard
      name={fullName}
      subtitle={user.email}
      role={user.role || "student"}
      status={client.status || "active"}
      metaItems={[
        { label: "Phone", value: client.phone || "N/A" },
        { label: "Assigned Counselor", value: counselorName },
        { label: "Intake Progress", value: `${client.completionPercentage || 0}%` },
        { label: "Gender", value: client.gender || "Not specified" },
      ]}
      action={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={ROUTES.CLIENT_DETAIL(client.id || client._id)}>
              <Eye className="mr-1.5 size-3.5" />
              View Profile
            </Link>
          </Button>

          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onDelete(client)}
              aria-label={`Delete ${fullName}`}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      }
      className={className}
    />
  );
}

export default ClientCard;

import Link from "next/link";
import { ProfileCard } from "@/components/common/ProfileCard";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";

/**
 * StudentCard Component
 * Displays grid card summary of a student profile.
 */
export function StudentCard({ student, onDelete, isAdmin = false, className }) {
  const user = student?.userId || {};
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Student";
  const counselor = student?.assignedCounselorId;
  const counselorName = counselor
    ? typeof counselor === "object"
      ? `${counselor.firstName || ""} ${counselor.lastName || ""}`.trim() || counselor.email
      : counselor
    : "Unassigned";

  return (
    <ProfileCard
      name={fullName}
      subtitle={user.email}
      role={user.role || "student"}
      status={student.status || "active"}
      metaItems={[
        { label: "Contact Phone", value: student.phone || "N/A" },
        { label: "Assigned Counselor", value: counselorName },
        { label: "Intake Progress", value: `${student.completionPercentage || 0}%` },
        { label: "Gender Identity", value: student.gender || "Not specified" },
      ]}
      action={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={ROUTES.STUDENT_DETAIL(student.id || student._id)}>
              <Eye className="mr-1.5 size-3.5" />
              View Student Profile
            </Link>
          </Button>

          {onDelete && isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onDelete(student)}
              aria-label={`Archive ${fullName}`}
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

export default StudentCard;

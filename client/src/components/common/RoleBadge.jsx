import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Reusable RoleBadge Component
 * Standardized role badge tags for student, counselor, admin, parent.
 */
const ROLE_CONFIGS = {
  student: { label: "Student", className: "bg-blue-500/10 text-blue-600 border-blue-600/30 dark:text-blue-400" },
  counselor: { label: "Counselor", className: "bg-indigo-500/10 text-indigo-600 border-indigo-600/30 dark:text-indigo-400" },
  parent: { label: "Parent", className: "bg-purple-500/10 text-purple-600 border-purple-600/30 dark:text-purple-400" },
  admin: { label: "Administrator", className: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30 dark:text-emerald-400" },
};

export function RoleBadge({ role, className }) {
  const normalizedRole = (role || "student").toLowerCase();
  const config = ROLE_CONFIGS[normalizedRole] || ROLE_CONFIGS.student;

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-semibold capitalize px-2 py-0.5", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export default RoleBadge;

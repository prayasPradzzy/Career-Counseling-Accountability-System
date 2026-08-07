import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RoleBadge } from "@/components/common/RoleBadge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants/routes";

/**
 * StudentTable Component
 * Data table displaying list of registered students with status badges, counselor assignments, and action items.
 * "Transfer Ownership" is strictly restricted to Administrators. Counselors cannot reassign students.
 */
export function StudentTable({ students = [], onDelete, onTransferOwnership, isAdmin = false }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Intake Progress</TableHead>
            <TableHead>Assigned Counselor</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {students.map((student) => {
            const user = student.userId || {};
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Student";
            const initials =
              user.firstName && user.lastName
                ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                : "S";

            const counselor = student.assignedCounselorId;
            const counselorName = counselor
              ? typeof counselor === "object"
                ? `${counselor.firstName || ""} ${counselor.lastName || ""}`.trim() || counselor.email
                : counselor
              : "Unassigned";

            const completion = student.completionPercentage || 0;
            const isFull = completion === 100;

            return (
              <TableRow key={student.id || student._id} className="hover:bg-muted/30 transition-colors">
                {/* Student Name & Email */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 border border-border shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-medium text-foreground text-sm block truncate">
                        {fullName}
                      </span>
                      <span className="text-xs text-muted-foreground block truncate">
                        {user.email || student.invitedEmail}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell>
                  <RoleBadge role={user.role || "student"} />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={student.status || "active"} />
                </TableCell>

                {/* Intake Progress */}
                <TableCell>
                  <div className="flex items-center gap-2 max-w-[110px]">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? "bg-emerald-600 dark:bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        isFull
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-foreground font-semibold"
                      }`}
                    >
                      {completion}%
                    </span>
                  </div>
                </TableCell>

                {/* Assigned Counselor */}
                <TableCell>
                  <span className="text-xs text-muted-foreground font-medium">
                    {counselorName}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Transfer Ownership — Admin Only */}
                    {isAdmin && onTransferOwnership && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onTransferOwnership(student)}
                        title="Transfer Student Ownership (Admin Only)"
                        aria-label="Transfer Student Ownership"
                      >
                        <ShieldCheck className="size-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}

                    <Button variant="ghost" size="icon" asChild title="View Student Profile" aria-label="View Student Profile">
                      <Link href={ROUTES.STUDENT_DETAIL(student.id || student._id)}>
                        <Eye className="size-4 text-muted-foreground hover:text-primary" />
                      </Link>
                    </Button>

                    {onDelete && isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(student)}
                        title="Archive Student (Admin Only)"
                        aria-label="Archive Student"
                      >
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default StudentTable;

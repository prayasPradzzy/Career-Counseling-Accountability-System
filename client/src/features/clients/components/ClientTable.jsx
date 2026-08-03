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
import { Eye, Trash2, UserCheck } from "lucide-react";
import { ROUTES } from "@/constants/routes";

/**
 * ClientTable Component
 * Data table displaying list of clients with status badges, counselor assignments, and action items.
 */
export function ClientTable({ clients = [], onDelete, onAssignCounselor }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Completion</TableHead>
            <TableHead>Assigned Counselor</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clients.map((client) => {
            const user = client.userId || {};
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed Client";
            const initials =
              user.firstName && user.lastName
                ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                : "U";

            const counselor = client.assignedCounselorId;
            const counselorName = counselor
              ? `${counselor.firstName} ${counselor.lastName}`
              : "Unassigned";

            return (
              <TableRow key={client.id || client._id} className="hover:bg-muted/30 transition-colors">
                {/* Client Name & Email */}
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
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={client.status || "active"} />
                </TableCell>

                {/* Completion */}
                <TableCell>
                  <div className="flex items-center gap-2 max-w-[100px]">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${client.completionPercentage || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {client.completionPercentage || 0}%
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
                    {onAssignCounselor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAssignCounselor(client)}
                        title="Assign Counselor"
                        aria-label="Assign Counselor"
                      >
                        <UserCheck className="size-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}

                    <Button variant="ghost" size="icon" asChild title="View Profile" aria-label="View Profile">
                      <Link href={ROUTES.CLIENT_DETAIL(client.id || client._id)}>
                        <Eye className="size-4 text-muted-foreground hover:text-primary" />
                      </Link>
                    </Button>

                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(client)}
                        title="Delete Client"
                        aria-label="Delete Client"
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

export default ClientTable;

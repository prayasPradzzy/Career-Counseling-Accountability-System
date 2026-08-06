"use client";

import { useState } from "react";
import {
  useStudents,
  useDeleteStudent,
  useAssignCounselor,
  TransferOwnershipDialog,
  StudentTable,
  StudentCard,
} from "@/features/students";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Table as TableIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";

import { STUDENT_STATUS_FILTER_OPTIONS } from "@/constants/studentStatus.constants";

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected student for delete/archive dialog
  const [studentToDelete, setStudentToDelete] = useState(null);
  // Selected student for ownership transfer dialog (Admin only)
  const [studentToTransfer, setStudentToTransfer] = useState(null);

  // React Query Fetching
  const { data, isLoading, isError, error } = useStudents({
    search,
    status: statusFilter === "all" || statusFilter === "ALL" ? undefined : statusFilter,
    page,
    limit,
  });

  const deleteStudentMutation = useDeleteStudent();
  const assignCounselorMutation = useAssignCounselor();

  const students = data?.data?.clients || data?.data?.students || [];
  const pagination = data?.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleDeleteConfirm = () => {
    if (!studentToDelete) return;

    deleteStudentMutation.mutate(studentToDelete.id || studentToDelete._id, {
      onSuccess: () => {
        toast.success("Student profile archived successfully");
        setStudentToDelete(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to archive student profile");
      },
    });
  };

  const handleTransferConfirm = (counselorId) => {
    if (!studentToTransfer) return;

    const targetId = studentToTransfer.id || studentToTransfer._id;
    assignCounselorMutation.mutate(
      { id: targetId, counselorId },
      {
        onSuccess: () => {
          toast.success("Student ownership transferred successfully!");
          setStudentToTransfer(null);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to transfer ownership");
        },
      }
    );
  };

  const hasActiveFilters = search !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students Directory"
        subtitle="Manage student registrations, counselor guidance, and lifecycle progression."
        actions={
          isAdmin
            ? [
                {
                  id: "register-student-btn",
                  label: "Register Student",
                  href: ROUTES.STUDENT_NEW,
                  variant: "default",
                  iconName: "Plus",
                },
              ]
            : []
        }
      />

      {/* Filter & View Switcher Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <FilterBar
              searchValue={search}
              onSearchChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onSearchClear={() => {
                setSearch("");
                setPage(1);
              }}
              searchPlaceholder="Search students by name, email..."
              hasActiveFilters={hasActiveFilters}
              onResetFilters={() => {
                setSearch("");
                setStatusFilter("all");
                setPage(1);
              }}
              filters={[
                {
                  id: "status-select",
                  component: (
                    <Select
                      value={statusFilter}
                      onValueChange={(val) => {
                        setStatusFilter(val);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 size-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Lifecycle Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDENT_STATUS_FILTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ),
                },
              ]}
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg shrink-0">
            <Button
              variant={viewMode === "table" ? "background" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-2.5 text-xs font-medium"
              aria-label="Table View"
            >
              <TableIcon className="mr-1.5 size-3.5" />
              Table
            </Button>
            <Button
              variant={viewMode === "grid" ? "background" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-2.5 text-xs font-medium"
              aria-label="Grid View"
            >
              <LayoutGrid className="mr-1.5 size-3.5" />
              Grid
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingSkeleton cards={3} />
      ) : isError ? (
        <EmptyIllustration
          iconName="AlertTriangle"
          title="Failed to Load Student Directory"
          description={error?.response?.data?.message || "Could not retrieve student list."}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      ) : students.length > 0 ? (
        <div className="space-y-4">
          {viewMode === "table" ? (
            <StudentTable
              students={students}
              onDelete={isAdmin ? (s) => setStudentToDelete(s) : undefined}
              onTransferOwnership={isAdmin ? (s) => setStudentToTransfer(s) : undefined}
              isAdmin={isAdmin}
            />
          ) : (
            <WidgetGrid cols={{ default: 1, md: 2, lg: 3 }}>
              {students.map((s) => (
                <StudentCard
                  key={s.id || s._id}
                  student={s}
                  onDelete={isAdmin ? (item) => setStudentToDelete(item) : undefined}
                  isAdmin={isAdmin}
                />
              ))}
            </WidgetGrid>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page <strong className="text-foreground">{pagination.page}</strong> of{" "}
                {pagination.totalPages} ({pagination.total} registered students)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 size-4" />
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyIllustration
          iconName="GraduationCap"
          title={hasActiveFilters ? "No Students Found" : "No Students Assigned Yet"}
          description={
            hasActiveFilters
              ? "No student records matched your filter criteria."
              : isAdmin
              ? "Register or invite your first student."
              : "Students assigned to you by an administrator will appear here."
          }
          actionLabel={hasActiveFilters ? "Clear Filters" : isAdmin ? "Register Student" : undefined}
          actionHref={hasActiveFilters ? undefined : isAdmin ? ROUTES.STUDENT_NEW : undefined}
          onAction={
            hasActiveFilters
              ? () => {
                  setSearch("");
                  setStatusFilter("all");
                }
              : undefined
          }
        />
      )}

      {/* Transfer Ownership Dialog (Admin Only) */}
      {isAdmin && (
        <TransferOwnershipDialog
          open={Boolean(studentToTransfer)}
          onOpenChange={(open) => !open && setStudentToTransfer(null)}
          onTransfer={handleTransferConfirm}
          isTransferring={assignCounselorMutation.isPending}
          studentName={
            studentToTransfer?.userId
              ? `${studentToTransfer.userId.firstName || ""} ${studentToTransfer.userId.lastName || ""}`.trim()
              : "Student"
          }
        />
      )}

      {/* Archive / Delete Confirmation Dialog (Admin Only) */}
      {isAdmin && (
        <DeleteDialog
          open={Boolean(studentToDelete)}
          onOpenChange={(open) => !open && setStudentToDelete(null)}
          title="Archive Student Profile"
          itemName={
            studentToDelete?.userId
              ? `${studentToDelete.userId.firstName} ${studentToDelete.userId.lastName}`
              : "this student profile"
          }
          description="Are you sure you want to archive this student profile? The record will be soft-deleted."
          onDelete={handleDeleteConfirm}
          isDeleting={deleteStudentMutation.isPending}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useClients,
  useDeleteClient,
  useAssignCounselor,
  AssignCounselorDialog,
} from "@/features/clients";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar } from "@/components/common/FilterBar";
import { WidgetGrid } from "@/components/layout/WidgetGrid";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { ClientTable } from "@/features/clients/components/ClientTable";
import { ClientCard } from "@/features/clients/components/ClientCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, Table as TableIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";

export default function ClientsPage() {
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Selected client for delete dialog
  const [clientToDelete, setClientToDelete] = useState(null);
  // Selected client for assign counselor dialog
  const [clientToAssign, setClientToAssign] = useState(null);

  // React Query Fetching
  const { data, isLoading, isError, error } = useClients({
    search,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit,
  });

  const deleteClientMutation = useDeleteClient();
  const assignCounselorMutation = useAssignCounselor();

  const clients = data?.data?.clients || [];
  const pagination = data?.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const handleDeleteConfirm = () => {
    if (!clientToDelete) return;

    deleteClientMutation.mutate(clientToDelete.id || clientToDelete._id, {
      onSuccess: () => {
        toast.success("Client profile archived successfully");
        setClientToDelete(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to delete client profile");
      },
    });
  };

  const handleAssignConfirm = (counselorId) => {
    if (!clientToAssign) return;

    const targetId = clientToAssign.id || clientToAssign._id;
    assignCounselorMutation.mutate(
      { id: targetId, counselorId },
      {
        onSuccess: () => {
          toast.success("Counselor assigned successfully");
          setClientToAssign(null);
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || "Failed to assign counselor");
        },
      }
    );
  };

  const hasActiveFilters = search !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Directory"
        subtitle="Manage client profiles, counselor assignments, and completion statuses."
        actions={[
          {
            id: "create-client-btn",
            label: "Create Client Profile",
            href: ROUTES.CLIENT_NEW,
            variant: "default",
            iconName: "Plus",
          },
        ]}
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
              searchPlaceholder="Search clients by name, email..."
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
                      <SelectTrigger className="w-[140px]">
                        <Filter className="mr-2 size-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending-onboarding">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  ),
                },
              ]}
            />
          </div>

          {/* View Mode Toggle Buttons */}
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
          title="Failed to Load Clients"
          description={error?.response?.data?.message || "Could not retrieve client directory."}
          actionLabel="Try Again"
          onAction={() => window.location.reload()}
        />
      ) : clients.length > 0 ? (
        <div className="space-y-4">
          {viewMode === "table" ? (
            <ClientTable
              clients={clients}
              onDelete={(c) => setClientToDelete(c)}
              onAssignCounselor={(c) => setClientToAssign(c)}
            />
          ) : (
            <WidgetGrid cols={{ default: 1, md: 2, lg: 3 }}>
              {clients.map((c) => (
                <ClientCard key={c.id || c._id} client={c} onDelete={(item) => setClientToDelete(item)} />
              ))}
            </WidgetGrid>
          )}

          {/* Pagination Bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Showing page <strong className="text-foreground">{pagination.page}</strong> of{" "}
                {pagination.totalPages} ({pagination.total} total clients)
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
          iconName="Users"
          title="No Clients Found"
          description={
            hasActiveFilters
              ? "No client profiles matched your filter criteria."
              : "No clients registered yet. Click below to create your first client profile."
          }
          actionLabel={hasActiveFilters ? "Clear Filters" : "Create Client Profile"}
          actionHref={hasActiveFilters ? undefined : ROUTES.CLIENT_NEW}
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

      {/* Assign Counselor Dialog */}
      <AssignCounselorDialog
        open={Boolean(clientToAssign)}
        onOpenChange={(open) => !open && setClientToAssign(null)}
        onAssign={handleAssignConfirm}
        isAssigning={assignCounselorMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={Boolean(clientToDelete)}
        onOpenChange={(open) => !open && setClientToDelete(null)}
        title="Archive Client Profile"
        itemName={
          clientToDelete?.userId
            ? `${clientToDelete.userId.firstName} ${clientToDelete.userId.lastName}`
            : "this client profile"
        }
        description="Are you sure you want to soft delete this client profile? The profile will be archived."
        onDelete={handleDeleteConfirm}
        isDeleting={deleteClientMutation.isPending}
      />
    </div>
  );
}

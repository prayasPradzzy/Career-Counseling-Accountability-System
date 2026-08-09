"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Loader2, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { clientService } from "@/services/client.service";

const transferOwnershipSchema = z.object({
  counselorId: z.string().min(1, "Please select a counselor from the list"),
});

/**
 * TransferOwnershipDialog Component
 * Admin-Only action to reassign student ownership to a new guidance counselor.
 */
export function TransferOwnershipDialog({
  open,
  onOpenChange,
  onTransfer,
  isTransferring = false,
  studentName = "Student",
}) {
  // Fetch available counselors when dialog opens
  const { data: counselorsData, isLoading: isLoadingCounselors } = useQuery({
    queryKey: ["available-counselors-transfer"],
    queryFn: async () => {
      const res = await clientService.getClients({ limit: 50 });
      const clients = res?.data?.clients || res?.data || [];
      // Filter users with counselor role or return active list
      return clients;
    },
    enabled: open,
  });

  const availableCounselors = counselorsData || [];

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(transferOwnershipSchema),
    mode: "onChange",
    defaultValues: {
      counselorId: "",
    },
  });

  const selectedCounselorId = watch("counselorId");

  useEffect(() => {
    if (open) {
      reset({ counselorId: "" });
    }
  }, [open, reset]);

  const onSubmit = (data) => {
    onTransfer(data.counselorId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Transfer Student Ownership
          </DialogTitle>
          <DialogDescription>
            Reassign <strong>{studentName}</strong> to another verified guidance counselor. This is an administrator-only action.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="counselorSelect">
              Select New Counselor <span className="text-destructive">*</span>
            </Label>

            {isLoadingCounselors ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border rounded-lg">
                <Loader2 className="size-4 animate-spin" />
                Loading counselors...
              </div>
            ) : (
              <Select
                value={selectedCounselorId}
                onValueChange={(val) => setValue("counselorId", val, { shouldValidate: true })}
              >
                <SelectTrigger id="counselorSelect" className="w-full">
                  <SelectValue placeholder="-- Select Counselor --" />
                </SelectTrigger>
                <SelectContent>
                  {availableCounselors.map((counselor) => {
                    const id = counselor.id || counselor._id || counselor.userId?._id;
                    const userObj = counselor.userId || counselor;
                    const name = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || counselor.name || "Counselor";
                    const email = userObj.email ? ` (${userObj.email})` : "";

                    return (
                      <SelectItem key={id} value={id}>
                        <span className="font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground">{email}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            {errors.counselorId && (
              <p className="text-xs text-destructive font-medium">
                {errors.counselorId.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <DialogClose type="button" variant="outline" disabled={isTransferring}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!isValid || isTransferring || isLoadingCounselors}>
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Transfer Ownership"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TransferOwnershipDialog;

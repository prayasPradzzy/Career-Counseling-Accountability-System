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
import { UserCheck, Loader2 } from "lucide-react";

// Mock/Default list of verified counselors for assignment selection
import { mockCounselorsData } from "@/data/counselors";

const DEFAULT_COUNSELORS = mockCounselorsData?.counselors || [];

const assignCounselorSchema = z.object({
  counselorId: z.string().min(1, "Please select a counselor from the list"),
});

/**
 * AssignCounselorDialog Component
 * Controlled dialog with searchable dropdown selector for assigning counselors to students.
 * NO manual MongoDB ObjectId text entries allowed.
 */
export function AssignCounselorDialog({
  open,
  onOpenChange,
  onAssign,
  isAssigning = false,
  availableCounselors = DEFAULT_COUNSELORS,
}) {
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(assignCounselorSchema),
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
    onAssign(data.counselorId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-5 text-primary" />
            Assign Counselor to Student
          </DialogTitle>
          <DialogDescription>
            Select a verified counselor to take ownership of this student&apos;s guidance plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="counselorSelect">
              Select Counselor <span className="text-destructive">*</span>
            </Label>

            <Select
              value={selectedCounselorId}
              onValueChange={(val) => setValue("counselorId", val, { shouldValidate: true })}
            >
              <SelectTrigger id="counselorSelect" className="w-full">
                <SelectValue placeholder="-- Select Counselor --" />
              </SelectTrigger>
              <SelectContent>
                {availableCounselors.map((counselor) => {
                  const id = counselor.id || counselor._id;
                  const name = counselor.name || `${counselor.firstName || ""} ${counselor.lastName || ""}`.trim();
                  const email = counselor.email ? ` (${counselor.email})` : "";
                  const spec = counselor.specialization ? ` • ${counselor.specialization}` : "";

                  return (
                    <SelectItem key={id} value={id}>
                      <span className="font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground">{email}{spec}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {errors.counselorId && (
              <p className="text-xs text-destructive font-medium">
                {errors.counselorId.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isAssigning}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid || isAssigning}>
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Counselor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AssignCounselorDialog;

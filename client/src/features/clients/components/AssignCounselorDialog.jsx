"use client";

import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, Loader2 } from "lucide-react";

const assignCounselorSchema = z.object({
  counselorId: z
    .string()
    .min(1, "Counselor User ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character Mongo ObjectId (hexadecimal)"),
});

/**
 * AssignCounselorDialog Component
 * Controlled dialog with react-hook-form + Zod validation to assign a counselor.
 */
export function AssignCounselorDialog({
  open,
  onOpenChange,
  onAssign,
  isAssigning = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(assignCounselorSchema),
    mode: "onChange",
    defaultValues: {
      counselorId: "",
    },
  });

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-5 text-primary" />
            Assign Counselor to Client
          </DialogTitle>
          <DialogDescription>
            Enter the User ID of the counselor to assign to this client profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="counselorId">
              Counselor User ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="counselorId"
              placeholder="e.g. 65a9876543210fedcba54321"
              autoFocus
              {...register("counselorId")}
            />
            {errors.counselorId && (
              <p className="text-xs text-destructive font-medium">
                {errors.counselorId.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <DialogClose type="button" variant="outline" disabled={isAssigning}>
              Cancel
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

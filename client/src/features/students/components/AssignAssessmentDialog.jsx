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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, Clock } from "lucide-react";
import { useActiveDefinitions } from "@/features/assessments/hooks/useAssessmentDefinitions";

const assignAssessmentSchema = z.object({
  assessmentDefinitionId: z.string().min(1, "Please select an assessment"),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  counselorNotes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

/**
 * AssignAssessmentDialog
 * Counselor assigns an assessment to a student from the available assessment catalog.
 * Fields: Assessment (select), Due Date, Priority, Optional Notes.
 */
export function AssignAssessmentDialog({
  open,
  onOpenChange,
  onAssign,
  isAssigning = false,
  studentName = "Student",
}) {
  const { data: definitionsData, isLoading: isLoadingDefinitions } = useActiveDefinitions(open);
  const definitions = definitionsData?.data?.definitions || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(assignAssessmentSchema),
    mode: "onChange",
    defaultValues: {
      assessmentDefinitionId: "",
      dueDate: "",
      priority: "normal",
      counselorNotes: "",
    },
  });

  const selectedDefinitionId = watch("assessmentDefinitionId");
  const selectedPriority = watch("priority");

  // Find the selected definition for the info card
  const selectedDefinition = definitions.find((d) => d._id === selectedDefinitionId);

  useEffect(() => {
    if (open) {
      reset({
        assessmentDefinitionId: "",
        dueDate: "",
        priority: "normal",
        counselorNotes: "",
      });
    }
  }, [open, reset]);

  const onSubmit = (data) => {
    onAssign({
      assessmentDefinitionId: data.assessmentDefinitionId,
      dueDate: data.dueDate || undefined,
      priority: data.priority,
      counselorNotes: data.counselorNotes || "",
    });
  };

  const priorityOptions = [
    { value: "low", label: "Low", color: "text-muted-foreground" },
    { value: "normal", label: "Normal", color: "text-foreground" },
    { value: "high", label: "High", color: "text-amber-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Assign Assessment
          </DialogTitle>
          <DialogDescription>
            Select an assessment instrument to assign to <strong>{studentName}</strong>.
            The student will see it immediately in their dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Assessment Selection */}
          <div className="space-y-2">
            <Label htmlFor="assessmentSelect">
              Assessment <span className="text-destructive">*</span>
            </Label>

            {isLoadingDefinitions ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 border rounded-lg">
                <Loader2 className="size-4 animate-spin" />
                Loading assessment catalog...
              </div>
            ) : definitions.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3 border rounded-lg">
                No active assessments available in the catalog.
              </div>
            ) : (
              <Select
                value={selectedDefinitionId}
                onValueChange={(val) => setValue("assessmentDefinitionId", val, { shouldValidate: true })}
              >
                <SelectTrigger id="assessmentSelect" className="w-full">
                  <SelectValue placeholder="-- Select Assessment --" />
                </SelectTrigger>
                <SelectContent>
                  {definitions.map((def) => (
                    <SelectItem key={def._id} value={def._id}>
                      <span className="font-medium">{def.title}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">
                        ({def.category}) • {def.estimatedDuration} min
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {errors.assessmentDefinitionId && (
              <p className="text-xs text-destructive font-medium">
                {errors.assessmentDefinitionId.message}
              </p>
            )}
          </div>

          {/* Selected Assessment Info Card */}
          {selectedDefinition && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">{selectedDefinition.title}</span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {selectedDefinition.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{selectedDefinition.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                <span>Estimated: {selectedDefinition.estimatedDuration} minutes</span>
              </div>
            </div>
          )}

          {/* Due Date & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...register("dueDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioritySelect">Priority</Label>
              <Select
                value={selectedPriority}
                onValueChange={(val) => setValue("priority", val, { shouldValidate: true })}
              >
                <SelectTrigger id="prioritySelect" className="w-full">
                  <SelectValue placeholder="Normal" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={`font-medium ${opt.color}`}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="counselorNotes">Notes (Optional)</Label>
            <Textarea
              id="counselorNotes"
              placeholder="Add any instructions or context for the student..."
              rows={3}
              className="resize-none"
              {...register("counselorNotes")}
            />
            {errors.counselorNotes && (
              <p className="text-xs text-destructive font-medium">
                {errors.counselorNotes.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isAssigning}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid || isAssigning || isLoadingDefinitions}>
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 size-4" />
                  Assign Assessment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AssignAssessmentDialog;

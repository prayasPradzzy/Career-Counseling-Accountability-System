"use client";

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const AlertDialog = Dialog;
export const AlertDialogTrigger = DialogTrigger;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogFooter = DialogFooter;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;

export function AlertDialogContent({ children, className, ...props }) {
  return (
    <DialogContent className={className} showCloseButton={false} {...props}>
      {children}
    </DialogContent>
  );
}

export function AlertDialogAction({ className, children, onClick, disabled, ...props }) {
  return (
    <Button className={className} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </Button>
  );
}

export function AlertDialogCancel({ className, variant = "outline", size = "sm", children, onClick, disabled, ...props }) {
  return (
    <DialogClose
      className={className}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children || "Cancel"}
    </DialogClose>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCreateStudent } from "@/features/students";
import { PageHeader } from "@/components/layout/PageHeader";
import { StudentProfileForm } from "@/features/students/components/StudentProfileForm";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";

export default function NewStudentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const createStudentMutation = useCreateStudent();

  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Access denied. Only administrators can register student accounts.");
      router.push(ROUTES.STUDENTS);
    }
  }, [user, router]);

  if (!isAdmin) {
    return null;
  }

  const handleFormSubmit = (payload) => {
    createStudentMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success("Student profile registered successfully!");
        const newId = data?.data?.profile?.id || data?.data?.profile?._id;
        if (newId) {
          router.push(ROUTES.STUDENT_DETAIL(newId));
        } else {
          router.push(ROUTES.STUDENTS);
        }
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to register student profile");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Register Student Profile"
        subtitle="Configure academic history, career aspirations, and guardian contact for a new student."
      />

      <StudentProfileForm
        onSubmit={handleFormSubmit}
        isSubmitting={createStudentMutation.isPending}
      />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCreateClient } from "@/features/clients";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientProfileForm } from "@/features/clients/components/ClientProfileForm";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";

export default function NewClientPage() {
  const router = useRouter();
  const createClientMutation = useCreateClient();

  const handleFormSubmit = (payload) => {
    createClientMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success("Client profile created successfully!");
        const newId = data?.data?.profile?.id || data?.data?.profile?._id;
        if (newId) {
          router.push(ROUTES.CLIENT_DETAIL(newId));
        } else {
          router.push(ROUTES.CLIENTS);
        }
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to create client profile");
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Create Client Profile"
        subtitle="Initialize a new student client profile and configure academic history."
      />

      <ClientProfileForm
        onSubmit={handleFormSubmit}
        isSubmitting={createClientMutation.isPending}
      />
    </div>
  );
}

"use client";

import { ApartmentForm } from "@/components/apartment-form";
import { BackLink, PageHeader } from "@/components/shared";

export default function Page() {
  return (
    <div className="space-y-6">
      <BackLink href="/landlord/apartments" />
      <PageHeader
        title="New apartment"
        description="Keep property information clear and easy to reference."
      />
      <ApartmentForm />
    </div>
  );
}

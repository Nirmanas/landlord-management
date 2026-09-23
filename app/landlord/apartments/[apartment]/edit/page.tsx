"use client";

import { useParams } from "next/navigation";
import { ApartmentForm } from "@/components/apartment-form";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const { apartment: id } = useParams<{ apartment: string }>();

  const record = 5;
  if (!record) {
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  }
  // TODO: Fetch apartment data from database;
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.apartment(record.toString())} />
      <PageHeader
        title="Edit apartment"
        description="Keep property information clear and easy to reference."
      />
      <ApartmentForm apartment={undefined} />
    </div>
  );
}

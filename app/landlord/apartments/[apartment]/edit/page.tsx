"use client";

import { useParams } from "next/navigation";
import { ApartmentForm } from "@/components/apartment-form";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { landlordRoutes } from "@/lib/routes";
import { useApiItem } from "@/components/data-provider";

export default function Page() {
  const { apartment: id } = useParams<{ apartment: string }>();
  const { data: record, loading, error } = useApiItem("apartments", id);
  if (loading) return <p role="status">Loading apartment…</p>;
  if (error && !record) return <p role="alert">{error}</p>;
  if (!record) {
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  }
  if (record.archivedAt) return <NotFoundState noun="Active apartment" href={landlordRoutes.apartment(id)} />;
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.apartment(record.id)} />
      <PageHeader
        title="Edit apartment"
        description="Keep property information clear and easy to reference."
      />
      <ApartmentForm apartment={record} />
    </div>
  );
}

"use client";

import { useApiItem } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";

import { useParams } from "next/navigation";
import { LeaseForm } from "@/components/lease-form";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const { apartment: apartmentId } = useParams<{ apartment: string }>();
  const apartmentRequest = useApiItem("landlord", "apartments", apartmentId);
  const resources = [apartmentRequest];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const apartment = apartmentRequest.data;
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  if (apartment.archivedAt)
    return (
      <NotFoundState
        noun="Active apartment"
        href={landlordRoutes.apartment(apartmentId)}
      />
    );
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.leases(apartmentId)} />
      <PageHeader
        title="New lease"
        description={`Set the rent, term, and tenant assignments for ${apartment.name}.`}
      />
      <LeaseForm apartment={apartment} />
    </div>
  );
}

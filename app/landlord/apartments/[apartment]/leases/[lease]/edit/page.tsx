"use client";

import { useApiItem } from "@/components/hooks/api-resource";
import { ApiStatus } from "@/components/api-status";

import { useParams } from "next/navigation";
import { LeaseForm } from "@/components/lease-form";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const { apartment: apartmentId, lease: leaseId } = useParams<{
    apartment: string;
    lease: string;
  }>();
  const apartmentRequest = useApiItem("landlord", "apartments", apartmentId);
  const leaseRequest = useApiItem("landlord", "leases", leaseId, apartmentId);
  const resources = [apartmentRequest, leaseRequest];
  if (resources.some((resource) => resource.loading || resource.error))
    return <ApiStatus resources={resources} />;
  const { data: lease } = leaseRequest;
  const apartment = apartmentRequest.data;
  if (!apartment)
    return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  if (!lease)
    return (
      <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />
    );
  if (lease.archivedAt || apartment.archivedAt)
    return (
      <NotFoundState
        noun="Active lease"
        href={landlordRoutes.lease(apartmentId, leaseId)}
      />
    );
  return (
    <div className="space-y-6">
      <BackLink href={landlordRoutes.lease(apartmentId, leaseId)} />
      <PageHeader
        title="Edit lease"
        description={`Set the rent, term, and tenant assignments for ${apartment.name}.`}
      />
      <LeaseForm apartment={apartment} lease={lease} />
    </div>
  );
}

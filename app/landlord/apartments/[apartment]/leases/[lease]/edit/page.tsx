"use client";

import { useParams } from "next/navigation";
import { useAppData, useApiItem } from "@/components/data-provider";
import { LeaseForm } from "@/components/lease-form";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const { apartment: apartmentId, lease: leaseId } = useParams<{ apartment: string; lease: string }>();
  const data = useAppData();
  const { data: lease, loading, error } = useApiItem("leases", leaseId, apartmentId);
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (loading) return <p role="status">Loading lease…</p>;
  if (error && !lease) return <p role="alert">{error}</p>;
  if (!apartment) return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  if (!lease || lease.apartmentId !== apartmentId) return <NotFoundState noun="Lease" href={landlordRoutes.leases(apartmentId)} />;
  if (lease.archivedAt || apartment.archivedAt) return <NotFoundState noun="Active lease" href={landlordRoutes.lease(apartmentId, leaseId)} />;
  return <div className="space-y-6"><BackLink href={landlordRoutes.lease(apartmentId, leaseId)} /><PageHeader title="Edit lease" description={`Set the rent, term, and tenant assignments for ${apartment.name}.`} /><LeaseForm apartment={apartment} lease={lease} /></div>;
}

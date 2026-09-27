"use client";

import { useParams } from "next/navigation";
import { useAppData } from "@/components/data-provider";
import { LeaseForm } from "@/components/lease-form";
import { BackLink, NotFoundState, PageHeader } from "@/components/shared";
import { landlordRoutes } from "@/lib/routes";

export default function Page() {
  const { apartment: apartmentId } = useParams<{ apartment: string }>();
  const data = useAppData();
  const apartment = data.apartments.find((item) => item.id === apartmentId);
  if (!apartment) return <NotFoundState noun="Apartment" href={landlordRoutes.apartments} />;
  if (apartment.archivedAt) return <NotFoundState noun="Active apartment" href={landlordRoutes.apartment(apartmentId)} />;
  return <div className="space-y-6"><BackLink href={landlordRoutes.leases(apartmentId)} /><PageHeader title="New lease" description={`Set the rent, term, and tenant assignments for ${apartment.name}.`} /><LeaseForm apartment={apartment} /></div>;
}

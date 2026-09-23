const landlordApartments = "/landlord/apartments";

export const landlordRoutes = {
  apartments: landlordApartments,
  apartment: (apartmentId: string) =>
    `${landlordApartments}/${encodeURIComponent(apartmentId)}`,
  apartmentEdit: (apartmentId: string) =>
    `${landlordRoutes.apartment(apartmentId)}/edit`,
  leases: (apartmentId: string) =>
    `${landlordRoutes.apartment(apartmentId)}/leases`,
  newLease: (apartmentId: string) =>
    `${landlordRoutes.leases(apartmentId)}/new`,
  lease: (apartmentId: string, leaseId: string) =>
    `${landlordRoutes.leases(apartmentId)}/${encodeURIComponent(leaseId)}`,
  leaseEdit: (apartmentId: string, leaseId: string) =>
    `${landlordRoutes.lease(apartmentId, leaseId)}/edit`,
  newPeriod: (apartmentId: string, leaseId: string) =>
    `${landlordRoutes.lease(apartmentId, leaseId)}/periods/new`,
  period: (apartmentId: string, leaseId: string, periodId: string) =>
    `${landlordRoutes.lease(apartmentId, leaseId)}/periods/${encodeURIComponent(periodId)}`,
} as const;

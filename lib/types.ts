export type LeaseStatus = "upcoming" | "active" | "ended"
export type PaymentStatus = "unpaid" | "pending" | "confirmed" | "failed"

export interface Apartment {
  id: string
  name: string
  address: string
  archivedAt: string | null
}

export interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  archivedAt: string | null
}

export interface Lease {
  id: string
  apartmentId: string
  startDate: string
  endDate: string
  status: LeaseStatus
  totalRentCents: number
  tenantIds: string[]
  archivedAt: string | null
}

export interface PaymentPeriod {
  id: string
  leaseId: string
  name: string
  startDate: string
  endDate: string
  dueDate: string
  archivedAt: string | null
}

export interface TenantPayment {
  id: string
  paymentPeriodId: string
  leaseId: string
  tenantId: string
  amountCents: number
  status: PaymentStatus
}

export interface AppData {
  apartments: Apartment[]
  tenants: Tenant[]
  leases: Lease[]
  paymentPeriods: PaymentPeriod[]
  tenantPayments: TenantPayment[]
}


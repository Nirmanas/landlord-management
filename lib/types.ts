export type LeaseStatus = "upcoming" | "active" | "ended"
export type PaymentStatus = "unpaid" | "pending" | "confirmed"

export interface Apartment {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  bedrooms: number
  bathrooms: number
  notes: string
}

export interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Lease {
  id: string
  apartmentId: string
  startDate: string
  endDate: string
  status: LeaseStatus
  totalRentCents: number
  tenantIds: string[]
}

export interface PaymentPeriod {
  id: string
  leaseId: string
  startDate: string
  endDate: string
  dueDate: string
  createdAt: string
}

export interface TenantPayment {
  id: string
  paymentPeriodId: string
  leaseId: string
  tenantId: string
  amountCents: number
  status: PaymentStatus
  reportedAt?: string
  confirmedAt?: string
}

export interface AppData {
  apartments: Apartment[]
  tenants: Tenant[]
  leases: Lease[]
  paymentPeriods: PaymentPeriod[]
  tenantPayments: TenantPayment[]
}


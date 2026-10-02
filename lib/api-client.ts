import type { Apartment, Lease, PaymentPeriod } from "@/lib/types";

export type ApiCollection = "apartments" | "leases" | "periods";
export type ApiRole = "landlord" | "tenant";
export type ApiRecord<T extends ApiCollection> = T extends "apartments" ? Apartment : T extends "leases" ? Lease : PaymentPeriod;

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function apiRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const payload: { data?: T; error?: string } = await response.json();
  if (!response.ok) throw new ApiRequestError(payload.error ?? "The request failed.", response.status);
  return payload.data as T;
}

export const apiPath = (role: ApiRole, collection: ApiCollection) => `/api/${role}/${collection}`;

export function roleApi(role: ApiRole) {
  const suffix = (id?: string) => id ? `/${encodeURIComponent(id)}` : "";
  const apartments = (id?: string) => `${apiPath(role, "apartments")}${suffix(id)}`;
  const leases = (apartmentId: string, id?: string) => `${apartments(apartmentId)}/leases${suffix(id)}`;
  const periods = (apartmentId: string, leaseId: string, id?: string) => `${leases(apartmentId, leaseId)}/periods${suffix(id)}`;
  return { apartments, leases, periods };
}

export const landlordApi = roleApi("landlord");
export const tenantApi = roleApi("tenant");

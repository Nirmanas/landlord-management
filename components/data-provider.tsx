"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiPath, apiRequest, roleApi, type ApiCollection, type ApiRecord, type ApiRole } from "@/lib/api-client";
import type { AppData, Apartment, Lease, PaymentPeriod } from "@/lib/types";

type SupplementalData = Pick<AppData, "tenants" | "tenantPayments">;
type Collections = Pick<AppData, "apartments" | "leases" | "paymentPeriods">;
type DataContextValue = { data: AppData; reload: () => Promise<void>; role: ApiRole; revision: number };
const DataContext = createContext<DataContextValue | null>(null);
async function fetchCollections(role: ApiRole): Promise<Collections> {
  const [apartments, leases, paymentPeriods] = await Promise.all([
    apiRequest<Apartment[]>(apiPath(role, "apartments")),
    apiRequest<Lease[]>(apiPath(role, "leases")),
    apiRequest<PaymentPeriod[]>(apiPath(role, "periods")),
  ]);
  return { apartments, leases, paymentPeriods };
}

export function DataProvider({ data, children, role }: { data: SupplementalData; children: React.ReactNode; role: ApiRole }) {
  const [collections, setCollections] = useState<Collections | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const reload = useCallback(async () => {
    setCollections(await fetchCollections(role));
    setRevision((value) => value + 1);
    setError("");
  }, [role]);
  useEffect(() => {
    let active = true;
    void fetchCollections(role).then((records) => { if (active) setCollections(records); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load records."); });
    return () => { active = false; };
  }, [role]);

  if (!collections) return <div className="mx-auto max-w-5xl p-8" role="status">
    {error ? <div role="alert">{error} <button type="button" className="underline" onClick={() => void reload().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load records."))}>Retry</button></div> : "Loading records…"}
  </div>;
  return <DataContext.Provider value={{ data: { ...data, ...collections }, reload, role, revision }}>{children}</DataContext.Provider>;
}

export function useAppData(): AppData {
  const value = useContext(DataContext);
  if (!value) throw new Error("Page data is unavailable.");
  return value.data;
}

export function useReloadAppData(): () => Promise<void> {
  const value = useContext(DataContext);
  if (!value) throw new Error("Page data is unavailable.");
  return value.reload;
}

export function useApiItem<T extends ApiCollection>(collection: T, id: string, apartmentId?: string, leaseId?: string) {
  const context = useContext(DataContext);
  if (!context) throw new Error("Page data is unavailable.");
  const api = roleApi(context.role);
  const path = collection === "apartments" ? api.apartments(id)
    : collection === "leases" ? api.leases(apartmentId!, id)
    : api.periods(apartmentId!, leaseId!, id);
  return useApiResource<ApiRecord<T>>(path);
}

export function useApiCollection<T extends ApiCollection>(collection: T, apartmentId?: string, leaseId?: string) {
  const context = useContext(DataContext);
  if (!context) throw new Error("Page data is unavailable.");
  const api = roleApi(context.role);
  const path = collection === "leases" && apartmentId ? api.leases(apartmentId)
    : collection === "periods" && apartmentId && leaseId ? api.periods(apartmentId, leaseId)
    : apiPath(context.role, collection);
  return useApiResource<ApiRecord<T>[]>(path);
}

export function useApiResource<T>(path: string) {
  const context = useContext(DataContext);
  const contextRevision = context?.revision;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loadedRequest, setLoadedRequest] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const requestKey = `${path}:${revision}:${contextRevision}`;
  useEffect(() => {
    let active = true;
    apiRequest<T>(path)
      .then((record) => { if (active) { setData(record); setError(""); setLoadedRequest(requestKey); } })
      .catch((cause) => { if (active) { setData(null); setError(cause instanceof Error ? cause.message : "Unable to load record."); setLoadedRequest(requestKey); } });
    return () => { active = false; };
  }, [path, requestKey]);
  return { data: loadedRequest === requestKey ? data : null, error: loadedRequest === requestKey ? error : "", loading: loadedRequest !== requestKey, reload: () => setRevision((value) => value + 1) };
}

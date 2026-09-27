"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiPath, apiRequest, type ApiCollection, type ApiRecord } from "@/lib/api-client";
import type { AppData, Apartment, Lease, PaymentPeriod } from "@/lib/types";

type SupplementalData = Pick<AppData, "tenants" | "tenantPayments">;
type Collections = Pick<AppData, "apartments" | "leases" | "paymentPeriods">;
type DataContextValue = { data: AppData; reload: () => Promise<void> };
const DataContext = createContext<DataContextValue | null>(null);
async function fetchCollections(): Promise<Collections> {
  const [apartments, leases, paymentPeriods] = await Promise.all([
    apiRequest<Apartment[]>(apiPath("apartments")),
    apiRequest<Lease[]>(apiPath("leases")),
    apiRequest<PaymentPeriod[]>(apiPath("periods")),
  ]);
  return { apartments, leases, paymentPeriods };
}

export function DataProvider({ data, children }: { data: SupplementalData; children: React.ReactNode }) {
  const [collections, setCollections] = useState<Collections | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setCollections(await fetchCollections());
    setError("");
  }, []);
  useEffect(() => {
    let active = true;
    void fetchCollections().then((records) => { if (active) setCollections(records); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load records."); });
    return () => { active = false; };
  }, []);

  if (!collections) return <div className="mx-auto max-w-5xl p-8" role="status">
    {error ? <div role="alert">{error} <button type="button" className="underline" onClick={() => void reload().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load records."))}>Retry</button></div> : "Loading records…"}
  </div>;
  return <DataContext.Provider value={{ data: { ...data, ...collections }, reload }}>{children}</DataContext.Provider>;
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

export function useApiItem<T extends ApiCollection>(collection: T, id: string) {
  const [data, setData] = useState<ApiRecord<T> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    apiRequest<ApiRecord<T>>(apiPath(collection, id))
      .then((record) => { if (active) { setData(record); setError(""); setLoading(false); } })
      .catch((cause) => { if (active) { setData(null); setError(cause instanceof Error ? cause.message : "Unable to load record."); setLoading(false); } });
    return () => { active = false; };
  }, [collection, id, revision]);
  return { data, error, loading, reload: () => setRevision((value) => value + 1) };
}

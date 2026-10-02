"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiPath,
  apiRequest,
  roleApi,
  type ApiCollection,
  type ApiRecord,
  type ApiRole,
} from "@/lib/api-client";

export function useApiResource<T>(path: string) {
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string;
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const key = `${path}:${revision}`;
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<T>(path, "GET", undefined, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: "" });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            data: null,
            error:
              cause instanceof Error
                ? cause.message
                : "Unable to load records.",
          });
      });
    return () => controller.abort();
  }, [path, key]);

  return {
    data: result?.key === key ? result.data : null,
    error: result?.key === key ? result.error : "",
    loading: result?.key !== key,
    reload,
  };
}

export function useApiItem<
  T extends "apartments" | "leases" | "periods" | "tenants",
>(
  role: ApiRole,
  collection: T,
  id: string,
  apartmentId?: string,
  leaseId?: string,
) {
  const api = roleApi(role);
  const path =
    collection === "apartments"
      ? api.apartments(id)
      : collection === "leases"
        ? api.leases(apartmentId!, id)
        : collection === "periods"
          ? api.periods(apartmentId!, leaseId!, id)
          : `${apiPath(role, "tenants")}/${encodeURIComponent(id)}`;
  return useApiResource<ApiRecord<T>>(path);
}

export function useApiCollection<T extends ApiCollection>(
  role: ApiRole,
  collection: T,
  apartmentId?: string,
  leaseId?: string,
) {
  const api = roleApi(role);
  const path =
    collection === "leases" && apartmentId
      ? api.leases(apartmentId)
      : collection === "periods" && apartmentId && leaseId
        ? api.periods(apartmentId, leaseId)
        : apiPath(role, collection);
  return useApiResource<ApiRecord<T>[]>(path);
}

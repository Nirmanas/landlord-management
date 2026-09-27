"use client";

import { createContext, useContext } from "react";
import type { AppData } from "@/lib/types";

const DataContext = createContext<AppData | null>(null);

export function DataProvider({ data, children }: { data: AppData; children: React.ReactNode }) {
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useAppData(): AppData {
  const data = useContext(DataContext);
  if (!data) throw new Error("Page data is unavailable.");
  return data;
}

"use client";

import { Button } from "@/components/ui/button";

export function ApiStatus({
  resources,
}: {
  resources: { loading: boolean; error: string; reload: () => void }[];
}) {
  const error = resources.find((resource) => resource.error)?.error;
  if (error)
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => resources.forEach((resource) => resource.reload())}
        >
          Retry
        </Button>
      </div>
    );
  return <p role="status">Loading records…</p>;
}

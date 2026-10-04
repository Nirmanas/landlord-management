"use client";

import { useState } from "react";
import type { LeaseDocumentLinks } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";

export function LeaseDocument({
  links,
}: {
  links: LeaseDocumentLinks;
}) {
  const [viewLink, setViewLink] = useState(links.viewDocument);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inputKey, setInputKey] = useState(0);
  const uploadLink = links.uploadDocument;

  async function save() {
    if (!file || !uploadLink) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("The PDF must be 2 MB or smaller.");
      return;
    }
    if (file.type !== "application/pdf" || !/\.pdf$/i.test(file.name)) {
      setError("Select a PDF file.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(uploadLink.href, {
        method: uploadLink.method,
        headers: {
          "Content-Type": uploadLink.type,
        },
        body: file,
      });
      const payload: { data?: { links: LeaseDocumentLinks }; error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save the PDF.");
      setViewLink(payload.data?.links.viewDocument);
      setFile(null);
      setInputKey((value) => value + 1);
      setMessage("Lease PDF saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {viewLink ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a href={viewLink.href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-soft underline">
            View PDF
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No lease PDF saved.</p>
      )}
      {uploadLink && (
        <div className="space-y-2">
          <Input
            key={inputKey}
            type="file"
            accept="application/pdf,.pdf"
            aria-label="Lease PDF"
            disabled={busy}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">PDF only, up to 2 MB. Uploading a new file replaces the current one.</p>
          <Button type="button" size="sm" disabled={!file || busy} onClick={save}>
            {busy ? "Saving…" : "Save PDF"}
          </Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm text-brand-soft">{message}</p>}
    </div>
  );
}

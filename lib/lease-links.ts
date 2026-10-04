import { landlordApi, tenantApi } from "@/lib/api-client";
import type { LeaseDocumentLinks } from "@/lib/types";

export function landlordLeaseDocumentLinks(
  apartmentId: number,
  leaseId: number,
  hasFile: boolean,
  canUpload: boolean,
): LeaseDocumentLinks {
  const href = landlordApi.leaseDocument(String(apartmentId), String(leaseId));
  return {
    ...(hasFile && { viewDocument: { href, method: "GET" as const, type: "application/pdf" as const } }),
    ...(canUpload && { uploadDocument: { href, method: "PUT" as const, type: "application/pdf" as const } }),
  };
}

export function tenantLeaseDocumentLinks(
  apartmentId: number,
  leaseId: number,
  canDownload: boolean,
): LeaseDocumentLinks {
  return canDownload
    ? {
        downloadDocument: {
          href: tenantApi.leaseDocument(String(apartmentId), String(leaseId)),
          method: "GET",
          type: "application/pdf",
        },
      }
    : {};
}

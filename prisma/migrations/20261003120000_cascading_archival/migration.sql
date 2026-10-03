BEGIN;

-- Preserve existing archive timestamps and repair incomplete apartment cascades.
UPDATE "Lease" AS lease
SET "archivedAt" = property."archivedAt"
FROM "Property" AS property
WHERE lease."propertyId" = property.id
  AND lease."archivedAt" IS NULL
  AND property."archivedAt" IS NOT NULL;

-- A period inherits the earliest archived ancestor without changing its history.
UPDATE "Period" AS period
SET "archivedAt" = LEAST(lease."archivedAt", property."archivedAt")
FROM "Lease" AS lease
JOIN "Property" AS property ON property.id = lease."propertyId"
WHERE period."leaseId" = lease.id
  AND period."archivedAt" IS NULL
  AND (lease."archivedAt" IS NOT NULL OR property."archivedAt" IS NOT NULL);

COMMIT;

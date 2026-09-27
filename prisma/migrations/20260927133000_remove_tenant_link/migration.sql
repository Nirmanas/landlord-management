-- DropForeignKey
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_landlordId_fkey";

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "landlordId";

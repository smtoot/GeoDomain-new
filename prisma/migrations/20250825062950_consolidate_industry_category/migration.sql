/*
  Warnings:

  - You are about to drop the column `industry` on the `domains` table. All the data in the column will be lost.
  - Made the column `category` on table `domains` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "priceType" TEXT NOT NULL DEFAULT 'FIXED',
    "description" TEXT,
    "geographicScope" TEXT NOT NULL DEFAULT 'STATE',
    "state" TEXT,
    "city" TEXT,
    "category" TEXT NOT NULL,
    "logoUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "verificationToken" TEXT,
    "whoisData" TEXT,
    "registrar" TEXT,
    "expirationDate" DATETIME,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "domains_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_domains" ("category", "city", "createdAt", "description", "expirationDate", "geographicScope", "id", "logoUrl", "metaDescription", "metaTitle", "name", "ownerId", "price", "priceType", "publishedAt", "registrar", "state", "status", "tags", "updatedAt", "verificationToken", "whoisData") SELECT "category", "city", "createdAt", "description", "expirationDate", "geographicScope", "id", "logoUrl", "metaDescription", "metaTitle", "name", "ownerId", "price", "priceType", "publishedAt", "registrar", "state", "status", "tags", "updatedAt", "verificationToken", "whoisData" FROM "domains";
DROP TABLE "domains";
ALTER TABLE "new_domains" RENAME TO "domains";
CREATE UNIQUE INDEX "domains_name_key" ON "domains"("name");
CREATE UNIQUE INDEX "domains_verificationToken_key" ON "domains"("verificationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

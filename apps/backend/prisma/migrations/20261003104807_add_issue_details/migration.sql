-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DataIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datasetId" INTEGER NOT NULL,
    "recordId" INTEGER,
    "rowNumber" INTEGER,
    "field" TEXT,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "description" TEXT NOT NULL,
    "suggestedCorrection" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "DataIssue_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DataIssue_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "DataRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DataIssue" ("datasetId", "description", "field", "id", "issueType", "recordId", "status", "suggestedCorrection") SELECT "datasetId", "description", "field", "id", "issueType", "recordId", "status", "suggestedCorrection" FROM "DataIssue";
DROP TABLE "DataIssue";
ALTER TABLE "new_DataIssue" RENAME TO "DataIssue";
CREATE INDEX "DataIssue_datasetId_status_idx" ON "DataIssue"("datasetId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

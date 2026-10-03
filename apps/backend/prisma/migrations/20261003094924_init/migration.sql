-- CreateTable
CREATE TABLE "Dataset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRows" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "DataRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datasetId" INTEGER NOT NULL,
    "recordIdentifier" TEXT,
    "recordData" TEXT NOT NULL,
    CONSTRAINT "DataRecord_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "datasetId" INTEGER NOT NULL,
    "recordId" INTEGER,
    "field" TEXT,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedCorrection" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "DataIssue_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DataIssue_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "DataRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DataRecord_datasetId_recordIdentifier_idx" ON "DataRecord"("datasetId", "recordIdentifier");

-- CreateIndex
CREATE INDEX "DataIssue_datasetId_status_idx" ON "DataIssue"("datasetId", "status");

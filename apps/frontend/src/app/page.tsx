"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Database,
  FileCheck2,
  FileSpreadsheet,
  LayoutDashboard,
  LoaderCircle,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

const API_URL = "http://localhost:3000";

type Dataset = {
  id: number;
  filename: string;
  uploadedAt: string;
  totalRows: number;
  qualityScore: number;
  _count: {
    records: number;
    issues: number;
  };
};

type Issue = {
  id: number;
  rowNumber: number;
  field: string;
  issueType: string;
  severity: "ERROR" | "WARNING";
  description: string;
  suggestedCorrection: string;
  status: "OPEN" | "RESOLVED" | "IGNORED";
};

type ColumnProfile = {
  column: string;
  inferredType: "INTEGER" | "DECIMAL" | "DATE" | "BOOLEAN" | "TEXT";
  totalValues: number;
  nonEmptyValues: number;
  missingValues: number;
  completeness: number;
  uniqueValues: number;
  sampleValues: string[];
};

type DatasetDetail = Dataset & {
  records: {
    id: number;
    recordIdentifier: string | null;
    recordData: string;
  }[];
  issues: Issue[];
  columnProfiles: ColumnProfile[];
};

export default function Home() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] =
    useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [activeView, setActiveView] = useState<
    "overview" | "readiness" | "profile" | "issues"
  >("overview");
  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);

  async function loadDatasets() {
    try {
      setError("");
      const response = await fetch(`${API_URL}/datasets`);

      if (!response.ok) {
        throw new Error("Unable to retrieve datasets.");
      }

      const data = await response.json();
      setDatasets(data);
    } catch {
      setError(
        "Could not connect to the backend. Make sure NestJS is running on port 3000."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openDataset(id: number) {
    try {
      setError("");
      const response = await fetch(`${API_URL}/datasets/${id}`);

      if (!response.ok) {
        throw new Error("Unable to retrieve dataset details.");
      }

      const data = await response.json();
      setSelectedDataset(data);
    } catch {
      setError("Could not load the selected dataset.");
    }
  }

  async function uploadFile(file?: File) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/datasets/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed.");
      }

      setSuccess(
        `${result.filename} analysed successfully. ${result.totalIssues} issues detected.`
      );

      await loadDatasets();
      await openDataset(result.datasetId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setUploading(false);
    }
  }

  async function updateIssueStatus(
    issueId: number,
    status: Issue["status"]
  ) {
    if (!selectedDataset) return;

    setUpdatingIssueId(issueId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/datasets/${selectedDataset.id}/issues/${issueId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to update issue status.");
      }

      setSelectedDataset((current) => {
        if (!current) return current;

        return {
          ...current,
          issues: current.issues.map((issue) =>
            issue.id === issueId ? { ...issue, status: result.status } : issue
          ),
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while updating the issue."
      );
    } finally {
      setUpdatingIssueId(null);
    }
  }

  useEffect(() => {
    void loadDatasets();
  }, []);

  const issues = selectedDataset?.issues ?? [];
  const errors = issues.filter((issue) => issue.severity === "ERROR").length;
  const warnings = issues.filter(
    (issue) => issue.severity === "WARNING"
  ).length;

  const filteredIssues = issues.filter((issue) => {
    const matchesSeverity =
      severityFilter === "ALL" || issue.severity === severityFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      issue.field.toLowerCase().includes(query) ||
      issue.issueType.toLowerCase().includes(query) ||
      issue.description.toLowerCase().includes(query);

    return matchesSeverity && matchesSearch;
  });

  function exportReport() {
    if (!selectedDataset) return;

    const headers = [
      "Row",
      "Field",
      "Issue Type",
      "Severity",
      "Description",
      "Suggested Correction",
      "Status",
    ];

    const rows = selectedDataset.issues.map((issue) => [
      issue.rowNumber,
      issue.field,
      issue.issueType,
      issue.severity,
      issue.description,
      issue.suggestedCorrection,
      issue.status,
    ]);

    const escapeCsv = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dataset-${selectedDataset.id}-quality-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const readinessChecks = selectedDataset
    ? [
        {
          key: "patient-identification",
          title: "Patient identification",
          description:
            "Patient identifiers are required to reliably associate appointment records with the correct patient.",
          issueTypes: ["MISSING_VALUE", "MISSING_COLUMN"],
          fields: ["patient_id"],
          riskLabel: "Patient linkage risk",
        },
        {
          key: "scheduling-integrity",
          title: "Scheduling integrity",
          description:
            "Appointment dates should be valid before records are used in scheduling or operational workflows.",
          issueTypes: ["INVALID_DATE", "MISSING_VALUE", "MISSING_COLUMN"],
          fields: ["appointment_date"],
          riskLabel: "Scheduling reliability risk",
        },
        {
          key: "workflow-integrity",
          title: "Appointment workflow",
          description:
            "Appointment status values should match the supported workflow states used by downstream systems.",
          issueTypes: [
            "INVALID_STATUS",
            "MISSING_VALUE",
            "MISSING_COLUMN",
          ],
          fields: ["appointment_status"],
          riskLabel: "Workflow and reporting risk",
        },
        {
          key: "communication-data",
          title: "Communication data",
          description:
            "Valid contact information helps prevent downstream systems from relying on malformed email data.",
          issueTypes: ["INVALID_EMAIL"],
          fields: ["patient_email"],
          riskLabel: "Contact-data quality risk",
        },
        {
          key: "record-uniqueness",
          title: "Record uniqueness",
          description:
            "Appointment identifiers should remain unique so the same appointment is not represented ambiguously.",
          issueTypes: ["DUPLICATE_RECORD"],
          fields: ["appointment_id"],
          riskLabel: "Duplicate processing risk",
        },
      ].map((check) => {
        const matchingIssues = issues.filter(
          (issue) =>
            check.issueTypes.includes(issue.issueType) &&
            check.fields.includes(issue.field ?? "")
        );

        const openIssues = matchingIssues.filter(
          (issue) => issue.status !== "RESOLVED"
        );

        const errorCount = openIssues.filter(
          (issue) => issue.severity === "ERROR"
        ).length;

        const warningCount = openIssues.filter(
          (issue) => issue.severity === "WARNING"
        ).length;

        return {
          ...check,
          matchingIssues,
          openIssues,
          errorCount,
          warningCount,
          state:
            errorCount > 0
              ? ("BLOCKED" as const)
              : warningCount > 0
                ? ("REVIEW" as const)
                : ("READY" as const),
        };
      })
    : [];
  const readinessBlocked = readinessChecks.filter(
    (check) => check.state === "BLOCKED"
  ).length;

  const readinessReview = readinessChecks.filter(
    (check) => check.state === "REVIEW"
  ).length;

  const readinessState =
    readinessBlocked > 0
      ? "NOT READY"
      : readinessReview > 0
        ? "REVIEW ADVISED"
        : "READY";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="brand-name">QualiCare</div>
            <div className="brand-subtitle">DATA INTELLIGENCE</div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          <button
            className={`nav-item ${activeView === "overview" ? "active" : ""}`}
            onClick={() => setActiveView("overview")}
          >
            <LayoutDashboard size={18} />
            <span>Overview</span>
          </button>

          <button
            className={`nav-item ${activeView === "readiness" ? "active" : ""}`}
            onClick={() => setActiveView("readiness")}
            disabled={!selectedDataset}
          >
            <FileCheck2 size={18} />
            <span>Readiness</span>
          </button>

          <button
            className={`nav-item ${activeView === "profile" ? "active" : ""}`}
            onClick={() => setActiveView("profile")}
            disabled={!selectedDataset}
          >
            <Database size={18} />
            <span>Column profile</span>
          </button>

          <button
            className={`nav-item ${activeView === "issues" ? "active" : ""}`}
            onClick={() => setActiveView("issues")}
            disabled={!selectedDataset}
          >
            <AlertCircle size={18} />
            <span>Data issues</span>

            {selectedDataset && issues.length > 0 && (
              <span className="nav-count">{issues.length}</span>
            )}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-card">
            <div className="workspace-card-icon">
              <Database size={17} />
            </div>
            <div>
              <strong>Local workspace</strong>
              <span>Synthetic data environment</span>
            </div>
          </div>

          <div className="privacy-note">
            <ShieldCheck size={15} />
            <span>No patient data leaves this environment.</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            QualiCare <span>/</span>{" "}
            <strong>
              {activeView === "overview"
                ? "Overview"
                : activeView === "readiness"
                  ? "Readiness"
                  : activeView === "profile"
                    ? "Column profile"
                    : "Data issues"}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="connection">
              <span className="status-dot" />
              Local environment
            </span>

            {selectedDataset && (
              <span className="selected-file">
                <FileSpreadsheet size={14} />
                {selectedDataset.filename}
              </span>
            )}
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                {activeView === "overview"
                  ? "DATA QUALITY OVERVIEW"
                  : activeView === "readiness"
                    ? "OPERATIONAL READINESS"
                    : activeView === "profile"
                      ? "DATASET PROFILING"
                      : "ISSUE MANAGEMENT"}
              </div>

              <h1>
                {activeView === "overview"
                  ? "Healthcare data quality"
                  : activeView === "readiness"
                    ? "Dataset readiness"
                    : activeView === "profile"
                      ? "Column profile"
                      : "Detected data issues"}
              </h1>

              <p>
                {activeView === "overview"
                  ? "Inspect healthcare datasets, identify quality problems and track remediation from one workspace."
                  : activeView === "readiness"
                    ? "Translate validation findings into operational data risks before downstream use."
                    : activeView === "profile"
                      ? "Understand completeness, uniqueness and inferred data types across the selected dataset."
                      : "Review detected quality problems and track their workflow status."}
              </p>
            </div>

            <label className={`upload-button ${uploading ? "disabled" : ""}`}>
              {uploading ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Upload size={17} />
              )}
              {uploading ? "Analysing..." : "Upload CSV"}

              <input
                type="file"
                accept=".csv,text/csv"
                disabled={uploading}
                onChange={(event) => {
                  void uploadFile(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
                hidden
              />
            </label>
          </section>

          {error && (
            <div className="alert error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}

          {success && (
            <div className="alert success-alert">
              <CheckCircle2 size={18} />
              <span>{success}</span>
              <button
                onClick={() => setSuccess("")}
                aria-label="Dismiss success"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {activeView === "overview" && (
            <>
              <section className="welcome-banner">
                <div className="welcome-icon">
                  <Activity size={22} />
                </div>

                <div>
                  <strong>Healthcare data quality workspace</strong>
                  <p>
                    Upload appointment data to detect missing values, invalid
                    entries and duplicate identifiers before downstream use.
                  </p>
                </div>

                <div className="banner-decoration">
                  <ShieldCheck size={74} />
                </div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Datasets</span>
                    <div className="stat-icon purple">
                      <Database size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {loading ? "--" : datasets.length}
                  </div>
                  <div className="stat-foot">Uploaded for analysis</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Total records</span>
                    <div className="stat-icon blue">
                      <FileSpreadsheet size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {datasets.reduce(
                      (sum, dataset) => sum + dataset.totalRows,
                      0
                    )}
                  </div>
                  <div className="stat-foot">Across all datasets</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Errors</span>
                    <div className="stat-icon red">
                      <AlertCircle size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {selectedDataset ? errors : "--"}
                  </div>
                  <div className="stat-foot">
                    {selectedDataset
                      ? "In selected dataset"
                      : "Select a dataset"}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Warnings</span>
                    <div className="stat-icon amber">
                      <AlertTriangle size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {selectedDataset ? warnings : "--"}
                  </div>
                  <div className="stat-foot">
                    {selectedDataset
                      ? "In selected dataset"
                      : "Select a dataset"}
                  </div>
                </div>
              </section>

              <section className="overview-grid">
                <div className="panel dataset-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent datasets</h2>
                      <p>Select a dataset to inspect its quality results.</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => void loadDatasets()}
                    >
                      Refresh
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {loading ? (
                    <div className="empty-state">
                      <LoaderCircle className="spin" />
                      Loading datasets...
                    </div>
                  ) : datasets.length === 0 ? (
                    <div className="empty-state">
                      <FileSpreadsheet size={30} />
                      <strong>No datasets yet</strong>
                      <span>Upload a CSV file to begin analysis.</span>
                    </div>
                  ) : (
                    <div className="dataset-list">
                      {datasets.map((dataset) => (
                        <button
                          key={dataset.id}
                          className={`dataset-row ${
                            selectedDataset?.id === dataset.id
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => void openDataset(dataset.id)}
                        >
                          <div className="file-icon">
                            <FileSpreadsheet size={19} />
                          </div>

                          <div className="dataset-info">
                            <strong>{dataset.filename}</strong>
                            <span>
                              {dataset.totalRows} records -{" "}
                              {new Date(
                                dataset.uploadedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="dataset-issues">
                            <span>{dataset._count.issues} issues</span>
                            <span className="quality-score">
                              {dataset.qualityScore}%
                            </span>
                            <ChevronDown size={15} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel analysis-card">
                  <div className="panel-heading">
                    <div>
                      <h2>Analysis summary</h2>
                      <p>
                        {selectedDataset
                          ? selectedDataset.filename
                          : "No dataset selected"}
                      </p>
                    </div>

                    <div className="summary-icon">
                      <FileCheck2 size={18} />
                    </div>
                  </div>

                  {selectedDataset ? (
                    <div className="analysis-body">
                      <div className="score-block">
                        <div>
                          <span className="score-label">
                            Dataset quality score
                          </span>
                          <strong className="score-value">
                            {selectedDataset.qualityScore}%
                          </strong>
                        </div>

                        <div
                          className="quality-progress-track"
                          role="progressbar"
                          aria-label="Dataset quality score"
                          aria-valuenow={selectedDataset.qualityScore}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="quality-progress-fill"
                            style={{
                              width: `${selectedDataset.qualityScore}%`,
                            }}
                          />
                        </div>

                        <p className="score-explanation">
                          {selectedDataset.qualityScore}% of records are free
                          from detected errors under the current validation
                          rules.
                        </p>
                      </div>

                      <div className="analysis-metrics">
                        <div>
                          <span>Records</span>
                          <strong>{selectedDataset.totalRows}</strong>
                        </div>
                        <div>
                          <span>Errors</span>
                          <strong className="metric-error">{errors}</strong>
                        </div>
                        <div>
                          <span>Warnings</span>
                          <strong className="metric-warning">
                            {warnings}
                          </strong>
                        </div>
                        <div>
                          <span>Columns</span>
                          <strong>
                            {selectedDataset.columnProfiles?.length ?? 0}
                          </strong>
                        </div>
                      </div>

                      <div className="issue-distribution">
                        <div className="distribution-heading">
                          <span>Issue distribution</span>
                          <strong>{issues.length} total</strong>
                        </div>

                        <div className="summary-bar">
                          <div
                            className="bar-error"
                            style={{
                              width: `${
                                issues.length
                                  ? (errors / issues.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                          <div
                            className="bar-warning"
                            style={{
                              width: `${
                                issues.length
                                  ? (warnings / issues.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <div className="summary-legend">
                          <span>
                            <i className="legend-dot red-dot" />
                            Errors <strong>{errors}</strong>
                          </span>
                          <span>
                            <i className="legend-dot amber-dot" />
                            Warnings <strong>{warnings}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="analysis-actions">
                        <button onClick={() => setActiveView("profile")}>
                          View column profile
                          <ArrowUpRight size={14} />
                        </button>

                        <button onClick={() => setActiveView("issues")}>
                          Review issues
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state analysis-empty">
                      <Activity size={28} />
                      <strong>Select a dataset</strong>
                      <span>
                        Its quality score and analysis will appear here.
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {selectedDataset && (
                <section className="selected-dataset-strip">
                  <div className="selected-dataset-main">
                    <div className="file-icon large">
                      <FileSpreadsheet size={21} />
                    </div>
                    <div>
                      <span className="section-kicker">SELECTED DATASET</span>
                      <h2>{selectedDataset.filename}</h2>
                      <p>
                        Dataset #{selectedDataset.id} -{" "}
                        {selectedDataset.totalRows} records -{" "}
                        {selectedDataset.columnProfiles?.length ?? 0} columns
                      </p>
                    </div>
                  </div>

                  <div className="dataset-view-buttons">
                    <button onClick={() => setActiveView("profile")}>
                      <Database size={15} />
                      Profile
                    </button>
                    <button onClick={() => setActiveView("issues")}>
                      <AlertCircle size={15} />
                      Issues
                    </button>
                  </div>
                </section>
              )}
            </>
          )}

          {activeView === "readiness" && selectedDataset && (
            <section className="readiness-workspace">
              <div
                className={`readiness-hero readiness-${readinessState
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                <div className="readiness-hero-content">
                  <span className="section-kicker">DOWNSTREAM USE ASSESSMENT</span>
                  <div className="readiness-state-row">
                    <div className="readiness-state-icon">
                      {readinessState === "READY" ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <AlertTriangle size={24} />
                      )}
                    </div>

                    <div>
                      <span className="readiness-state-label">
                        {readinessState}
                      </span>
                      <h2>
                        {readinessState === "READY"
                          ? "No active readiness blockers detected"
                          : readinessState === "REVIEW ADVISED"
                            ? "Review warnings before downstream use"
                            : "Resolve critical data-quality findings before downstream use"}
                      </h2>
                    </div>
                  </div>

                  <p>
                    This assessment translates validation findings into
                    operational data risks. It does not assess clinical
                    correctness or patient outcomes.
                  </p>
                </div>

                <div className="readiness-hero-meta">
                  <div>
                    <span>Dataset</span>
                    <strong>{selectedDataset.filename}</strong>
                  </div>
                  <div>
                    <span>Blocked areas</span>
                    <strong>{readinessBlocked}</strong>
                  </div>
                  <div>
                    <span>Review areas</span>
                    <strong>{readinessReview}</strong>
                  </div>
                </div>
              </div>

              <div className="readiness-intro">
                <div>
                  <span className="section-kicker">OPERATIONAL CHECKS</span>
                  <h2>Where could data quality affect operations?</h2>
                  <p>
                    Each check is tied directly to validation findings in the
                    selected dataset.
                  </p>
                </div>

                <div className="readiness-legend">
                  <span>
                    <i className="legend-dot blocked-dot" />
                    Action required
                  </span>
                  <span>
                    <i className="legend-dot review-dot" />
                    Review
                  </span>
                  <span>
                    <i className="legend-dot ready-dot" />
                    Clear
                  </span>
                </div>
              </div>

              <div className="readiness-grid">
                {readinessChecks.map((check) => (
                  <article
                    className={`readiness-card readiness-card-${check.state.toLowerCase()}`}
                    key={check.key}
                  >
                    <div className="readiness-card-top">
                      <div
                        className={`readiness-check-icon readiness-check-${check.state.toLowerCase()}`}
                      >
                        {check.state === "READY" ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <AlertTriangle size={20} />
                        )}
                      </div>

                      <span
                        className={`readiness-badge readiness-badge-${check.state.toLowerCase()}`}
                      >
                        {check.state === "BLOCKED"
                          ? "ACTION REQUIRED"
                          : check.state === "REVIEW"
                            ? "REVIEW"
                            : "CLEAR"}
                      </span>
                    </div>

                    <div className="readiness-card-body">
                      <span className="readiness-risk-label">
                        {check.riskLabel}
                      </span>
                      <h3>{check.title}</h3>
                      <p>{check.description}</p>
                    </div>

                    <div className="readiness-card-footer">
                      {check.openIssues.length > 0 ? (
                        <>
                          <div className="readiness-finding-count">
                            <strong>{check.openIssues.length}</strong>
                            <span>
                              active{" "}
                              {check.openIssues.length === 1
                                ? "finding"
                                : "findings"}
                            </span>
                          </div>

                          <button
                            className="readiness-review-button"
                            onClick={() => {
                              setSearch(check.fields[0]);
                              setSeverityFilter("ALL");
                              setActiveView("issues");
                            }}
                          >
                            Review issues
                            <ArrowUpRight size={15} />
                          </button>
                        </>
                      ) : (
                        <div className="readiness-clear-message">
                          <CheckCircle2 size={16} />
                          No active findings
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="readiness-guidance panel">
                <div>
                  <FileCheck2 size={20} />
                </div>
                <div>
                  <span className="section-kicker">INTERPRETING READINESS</span>
                  <h3>Readiness is separate from the quality score</h3>
                  <p>
                    The quality score describes issues detected in the uploaded
                    data. Readiness indicates whether findings still require
                    operational attention. Resolving a workflow item does not
                    rewrite or revalidate the source CSV.
                  </p>
                </div>
              </div>
            </section>
          )}
          {activeView === "profile" && (
            <section className="panel workspace-panel">
              <div className="workspace-header">
                <div>
                  <span className="section-kicker">SELECTED DATASET</span>
                  <h2>{selectedDataset?.filename ?? "No dataset selected"}</h2>
                  <p>
                    Column-level profiling derived from the uploaded CSV.
                  </p>
                </div>

                {selectedDataset && (
                  <div className="workspace-score">
                    <span>Quality score</span>
                    <strong>{selectedDataset.qualityScore}%</strong>
                  </div>
                )}
              </div>

              {!selectedDataset ? (
                <div className="empty-state workspace-empty">
                  <Database size={30} />
                  <strong>No dataset selected</strong>
                  <span>
                    Return to Overview and choose a dataset to inspect.
                  </span>
                  <button
                    className="secondary-action"
                    onClick={() => setActiveView("overview")}
                  >
                    Return to overview
                  </button>
                </div>
              ) : (
                <>
                  <div className="profile-summary">
                    <div>
                      <span>Columns</span>
                      <strong>{selectedDataset.columnProfiles.length}</strong>
                    </div>
                    <div>
                      <span>Records</span>
                      <strong>{selectedDataset.totalRows}</strong>
                    </div>
                    <div>
                      <span>Complete columns</span>
                      <strong>
                        {
                          selectedDataset.columnProfiles.filter(
                            (profile) => profile.completeness === 100
                          ).length
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Columns with missing data</span>
                      <strong>
                        {
                          selectedDataset.columnProfiles.filter(
                            (profile) => profile.missingValues > 0
                          ).length
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="profile-table-wrap">
                    <table className="profile-table">
                      <thead>
                        <tr>
                          <th>COLUMN</th>
                          <th>TYPE</th>
                          <th>COMPLETENESS</th>
                          <th>MISSING</th>
                          <th>UNIQUE</th>
                          <th>SAMPLE VALUES</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedDataset.columnProfiles.map((profile) => (
                          <tr key={profile.column}>
                            <td>
                              <code>{profile.column}</code>
                            </td>

                            <td>
                              <span
                                className={`type-badge type-${profile.inferredType.toLowerCase()}`}
                              >
                                {profile.inferredType}
                              </span>
                            </td>

                            <td>
                              <div className="completeness-cell">
                                <div>
                                  <div
                                    style={{
                                      width: `${profile.completeness}%`,
                                    }}
                                  />
                                </div>
                                <strong>{profile.completeness}%</strong>
                              </div>
                            </td>

                            <td>{profile.missingValues}</td>
                            <td>{profile.uniqueValues}</td>

                            <td>
                              <div className="sample-values">
                                {profile.sampleValues.length > 0 ? (
                                  profile.sampleValues.map((value) => (
                                    <span key={value}>{value}</span>
                                  ))
                                ) : (
                                  <span className="empty-value">
                                    No non-empty values
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="workspace-footer-note">
                    <ShieldCheck size={15} />
                    Type inference uses observed non-empty values. Validation
                    issues are evaluated separately.
                  </div>
                </>
              )}
            </section>
          )}

          {activeView === "issues" && (
            <section className="panel issues-panel workspace-panel">
              <div className="workspace-header issues-workspace-header">
                <div>
                  <span className="section-kicker">SELECTED DATASET</span>
                  <h2>{selectedDataset?.filename ?? "No dataset selected"}</h2>
                  <p>
                    Review detected quality problems and update their workflow
                    status.
                  </p>
                </div>

                <button
                  className="export-button"
                  onClick={exportReport}
                  disabled={!selectedDataset || issues.length === 0}
                >
                  <ArrowDownToLine size={15} />
                  Export report
                </button>
              </div>

              {!selectedDataset ? (
                <div className="empty-state workspace-empty">
                  <AlertCircle size={30} />
                  <strong>No dataset selected</strong>
                  <span>
                    Return to Overview and choose a dataset to review.
                  </span>
                  <button
                    className="secondary-action"
                    onClick={() => setActiveView("overview")}
                  >
                    Return to overview
                  </button>
                </div>
              ) : (
                <>
                  <div className="issue-summary-row">
                    <div>
                      <span>Total issues</span>
                      <strong>{issues.length}</strong>
                    </div>
                    <div>
                      <span>Errors</span>
                      <strong className="metric-error">{errors}</strong>
                    </div>
                    <div>
                      <span>Warnings</span>
                      <strong className="metric-warning">{warnings}</strong>
                    </div>
                    <div>
                      <span>Resolved</span>
                      <strong>
                        {
                          issues.filter(
                            (issue) => issue.status === "RESOLVED"
                          ).length
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="table-toolbar">
                    <div className="search-box">
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search field, issue type or description..."
                      />
                    </div>

                    <select
                      value={severityFilter}
                      onChange={(event) =>
                        setSeverityFilter(event.target.value)
                      }
                    >
                      <option value="ALL">All severities</option>
                      <option value="ERROR">Errors</option>
                      <option value="WARNING">Warnings</option>
                    </select>
                  </div>

                  {filteredIssues.length === 0 ? (
                    <div className="empty-state table-empty">
                      <CheckCircle2 size={28} />
                      <strong>No matching issues</strong>
                      <span>Try changing the current search or filter.</span>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>ROW</th>
                            <th>FIELD</th>
                            <th>ISSUE TYPE</th>
                            <th>SEVERITY</th>
                            <th>DESCRIPTION</th>
                            <th>STATUS</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredIssues.map((issue) => (
                            <tr key={issue.id}>
                              <td className="row-number">
                                {issue.rowNumber
                                  ? `#${issue.rowNumber}`
                                  : "Dataset"}
                              </td>

                              <td>
                                <code>{issue.field || "--"}</code>
                              </td>

                              <td>
                                {issue.issueType.replaceAll("_", " ")}
                              </td>

                              <td>
                                <span
                                  className={`severity ${issue.severity.toLowerCase()}`}
                                >
                                  {issue.severity === "ERROR" ? (
                                    <AlertCircle size={13} />
                                  ) : (
                                    <AlertTriangle size={13} />
                                  )}
                                  {issue.severity}
                                </span>
                              </td>

                              <td className="description-cell">
                                <span>{issue.description}</span>
                                {issue.suggestedCorrection && (
                                  <small>
                                    Suggested: {issue.suggestedCorrection}
                                  </small>
                                )}
                              </td>

                              <td>
                                <select
                                  className={`status-select status-${issue.status.toLowerCase()}`}
                                  value={issue.status}
                                  disabled={updatingIssueId === issue.id}
                                  aria-label={`Status for issue ${issue.id}`}
                                  onChange={(event) =>
                                    void updateIssueStatus(
                                      issue.id,
                                      event.target.value as Issue["status"]
                                    )
                                  }
                                >
                                  <option value="OPEN">Open</option>
                                  <option value="RESOLVED">Resolved</option>
                                  <option value="IGNORED">Ignored</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="table-footer">
                    <span>
                      Showing {filteredIssues.length} of {issues.length} issues
                    </span>
                    <span>Dataset #{selectedDataset.id}</span>
                  </div>
                </>
              )}
            </section>
          )}

          <footer className="footer">
            <span>QualiCare - Healthcare Data Quality Inspector</span>
            <span>
              <span className="status-dot" />
              Local processing - Synthetic data only
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

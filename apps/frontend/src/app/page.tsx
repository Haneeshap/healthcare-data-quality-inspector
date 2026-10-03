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
  status: string;
};

type DatasetDetail = Dataset & {
  records: {
    id: number;
    recordIdentifier: string | null;
    recordData: string;
  }[];
  issues: Issue[];
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={23} /></div>
          <div>
            <div className="brand-name">QualiCare</div>
            <div className="brand-subtitle">DATA INTELLIGENCE</div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation">
          <a className="nav-item active" href="#">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a className="nav-item" href="#datasets">
            <Database size={18} /> Datasets
          </a>
          <a className="nav-item" href="#issues">
            <AlertCircle size={18} /> Data issues
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={18} /></div>
            <strong>Need assistance?</strong>
            <p>Review your data quality results and suggested corrections.</p>
          </div>
          <a className="nav-item" href="#settings">
            <Settings size={18} /> Settings
          </a>
          <div className="user-profile">
            <div className="avatar">DQ</div>
            <div>
              <strong>Data Quality</strong>
              <span>Local workspace</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>
          <div className="topbar-right">
            <span className="connection"><span className="status-dot" /> Local environment</span>
            <div className="avatar small">DQ</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">OVERVIEW</div>
              <h1>Data quality dashboard</h1>
              <p>Monitor, analyse and improve the quality of your healthcare datasets.</p>
            </div>
            <label className={`upload-button ${uploading ? "disabled" : ""}`}>
              {uploading ? <LoaderCircle className="spin" size={17} /> : <Upload size={17} />}
              {uploading ? "Analysing..." : "Upload dataset"}
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
              <button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button>
            </div>
          )}

          {success && (
            <div className="alert success-alert">
              <CheckCircle2 size={18} />
              <span>{success}</span>
              <button onClick={() => setSuccess("")} aria-label="Dismiss success"><X size={16} /></button>
            </div>
          )}

          <section className="welcome-banner">
            <div className="welcome-icon"><Activity size={23} /></div>
            <div>
              <strong>Your data quality workspace</strong>
              <p>Upload a healthcare appointment CSV to identify missing values, invalid entries and duplicate records.</p>
            </div>
            <div className="banner-decoration"><ShieldCheck size={74} /></div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-top"><span>Total datasets</span><div className="stat-icon purple"><Database size={19} /></div></div>
              <div className="stat-value">{loading ? "—" : datasets.length}</div>
              <div className="stat-foot">Uploaded datasets</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>Total records</span><div className="stat-icon blue"><FileSpreadsheet size={19} /></div></div>
              <div className="stat-value">{datasets.reduce((sum, dataset) => sum + dataset.totalRows, 0)}</div>
              <div className="stat-foot">Across all datasets</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>Data errors</span><div className="stat-icon red"><AlertCircle size={19} /></div></div>
              <div className="stat-value">{selectedDataset ? errors : "—"}</div>
              <div className="stat-foot">{selectedDataset ? "In selected dataset" : "Select a dataset below"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>Warnings</span><div className="stat-icon amber"><AlertTriangle size={19} /></div></div>
              <div className="stat-value">{selectedDataset ? warnings : "—"}</div>
              <div className="stat-foot">{selectedDataset ? "In selected dataset" : "Select a dataset below"}</div>
            </div>
          </section>

          <section className="content-grid">
            <div className="panel dataset-panel" id="datasets">
              <div className="panel-heading">
                <div>
                  <h2>Recent datasets</h2>
                  <p>Browse your uploaded healthcare data</p>
                </div>
                <button className="text-button" onClick={() => void loadDatasets()}>
                  Refresh <ArrowUpRight size={15} />
                </button>
              </div>

              {loading ? (
                <div className="empty-state"><LoaderCircle className="spin" /> Loading datasets...</div>
              ) : datasets.length === 0 ? (
                <div className="empty-state">
                  <FileSpreadsheet size={30} />
                  <strong>No datasets yet</strong>
                  <span>Upload a CSV file to get started.</span>
                </div>
              ) : (
                <div className="dataset-list">
                  {datasets.map((dataset) => (
                    <button
                      key={dataset.id}
                      className={`dataset-row ${selectedDataset?.id === dataset.id ? "selected" : ""}`}
                      onClick={() => void openDataset(dataset.id)}
                    >
                      <div className="file-icon"><FileSpreadsheet size={20} /></div>
                      <div className="dataset-info">
                        <strong>{dataset.filename}</strong>
                        <span>{dataset.totalRows} records · {new Date(dataset.uploadedAt).toLocaleString()}</span>
                      </div>
                      <div className="dataset-issues">
                        <span>{dataset._count.issues} issues</span>
                        <ChevronDown size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="panel summary-panel">
              <div className="panel-heading">
                <div>
                  <h2>Analysis summary</h2>
                  <p>{selectedDataset ? selectedDataset.filename : "Selected dataset overview"}</p>
                </div>
                <div className="summary-icon"><FileCheck2 size={19} /></div>
              </div>

              {selectedDataset ? (
                <>
                  <div className="summary-total">
                    <span>Total detected issues</span>
                    <strong>{issues.length}</strong>
                  </div>
                  <div className="summary-bar">
                    <div className="bar-error" style={{ width: `${issues.length ? (errors / issues.length) * 100 : 0}%` }} />
                    <div className="bar-warning" style={{ width: `${issues.length ? (warnings / issues.length) * 100 : 0}%` }} />
                  </div>
                  <div className="summary-legend">
                    <span><i className="legend-dot red-dot" /> Errors <strong>{errors}</strong></span>
                    <span><i className="legend-dot amber-dot" /> Warnings <strong>{warnings}</strong></span>
                  </div>
                  <div className="summary-note"><CheckCircle2 size={16} /> Analysis results retrieved from database</div>
                </>
              ) : (
                <div className="empty-state compact">
                  <Activity size={26} />
                  <span>Select a dataset to view its analysis.</span>
                </div>
              )}
            </div>
          </section>

          <section className="panel issues-panel" id="issues">
            <div className="panel-heading issues-heading">
              <div>
                <h2>Detected data issues</h2>
                <p>{selectedDataset ? `Reviewing ${selectedDataset.filename}` : "Select a dataset to inspect its detected issues"}</p>
              </div>
              <button className="export-button" onClick={exportReport} disabled={!selectedDataset || issues.length === 0}>
                <ArrowDownToLine size={16} /> Export report
              </button>
            </div>

            {selectedDataset && (
              <div className="table-toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search issues..."
                  />
                </div>
                <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                  <option value="ALL">All severities</option>
                  <option value="ERROR">Errors</option>
                  <option value="WARNING">Warnings</option>
                </select>
              </div>
            )}

            {!selectedDataset ? (
              <div className="empty-state table-empty">
                <Database size={28} />
                <span>Choose a dataset above to view its quality issues.</span>
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="empty-state table-empty">
                <CheckCircle2 size={28} />
                <span>No matching issues found.</span>
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
                        <td className="row-number">#{issue.rowNumber}</td>
                        <td><code>{issue.field}</code></td>
                        <td>{issue.issueType.replaceAll("_", " ")}</td>
                        <td>
                          <span className={`severity ${issue.severity.toLowerCase()}`}>
                            {issue.severity === "ERROR" ? <AlertCircle size={13} /> : <AlertTriangle size={13} />}
                            {issue.severity}
                          </span>
                        </td>
                        <td className="description-cell">
                          <span>{issue.description}</span>
                          <small>Suggested: {issue.suggestedCorrection}</small>
                        </td>
                        <td><span className="status-open">{issue.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedDataset && (
              <div className="table-footer">
                Showing {filteredIssues.length} of {issues.length} issues
                <span>Dataset ID: {selectedDataset.id}</span>
              </div>
            )}
          </section>

          <footer className="footer">
            <span>QualiCare · Healthcare Data Quality Inspector</span>
            <span><span className="status-dot" /> Local processing · Synthetic data only</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

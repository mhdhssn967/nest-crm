import { useState, useEffect, useMemo, useCallback } from "react";
import { Form, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import {
  fetchAdLeads,
  fetchStatusHistory,
  updateLeadStatus,
  updateLeadRemarks,
  updateNewLeads,                          // ← NEW IMPORT
} from "../services/fetchAdLeads";
import { isAdmin } from "../services/fetchNames";
import AddLeadModal from "../components/AddLeadModal";
import "./AdLeads.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = [
  "New", "Contacted", "Meeting Scheduled", "Demo Done",
  "Proposal Sent", "Follow Up", "Converted", "Not Interested",
];

const STATUS_COLORS = {
  "New":               { bg: "#e0e7ff", text: "#3730a3" },
  "Contacted":         { bg: "#dbeafe", text: "#1e40af" },
  "Meeting Scheduled": { bg: "#ede9fe", text: "#6d28d9" },
  "Demo Done":         { bg: "#fce7f3", text: "#9d174d" },
  "Proposal Sent":     { bg: "#fef3c7", text: "#92400e" },
  "Follow Up":         { bg: "#fff3b0", text: "#78350f" },
  "Converted":         { bg: "#d1fae5", text: "#065f46" },
  "Not Interested":    { bg: "#f3f4f6", text: "#6b7280" },
};

const PRIORITY_META = {
  "Urgent": { label: "⚡ Urgent", color: "#7c3aed", bg: "#f3e8ff" },
  "High":   { label: "🔴 High",   color: "#dc2626", bg: "#fee2e2" },
  "Medium": { label: "🟡 Medium", color: "#d97706", bg: "#fef3c7" },
  "Low":    { label: "🟢 Low",    color: "#16a34a", bg: "#d1fae5" },
};

const TYPE_COLORS = {
  "Hospital":        "#3b82f6",
  "Distributor":     "#8b5cf6",
  "Physiotherapist": "#ec4899",
  "Clinic":          "#06b6d4",
  "Pharmacy":        "#f59e0b",
  "Nursing Home":    "#10b981",
};
const typeColor = (t) => TYPE_COLORS[t] || "#6b7280";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (ts) => {
  if (!ts) return "";
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff  = Math.floor((Date.now() - date) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const formatDateTime = (ts) => {
  if (!ts) return "";
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const isOverdue = (followUpDate) => {
  if (!followUpDate) return false;
  return new Date(followUpDate) < new Date(new Date().toDateString());
};

const sanitizePhone = (num) => num?.replace(/\D/g, "") || "";

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const meta = STATUS_COLORS[status] || { bg: "#e5e7eb", text: "#374151" };
  return (
    <span style={{
      background: meta.bg, color: meta.text,
      borderRadius: 12, padding: "2px 10px",
      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
};

// ─── Timeline entry ───────────────────────────────────────────────────────────

const TimelineEntry = ({ entry, isLast }) => (
  <div style={{ display: "flex", gap: "0.75rem", paddingBottom: "0.9rem", position: "relative" }}>
    {!isLast && (
      <div style={{ position: "absolute", left: 9, top: 18, bottom: 0, width: 2, background: "#e0e7ff" }} />
    )}
    <div style={{
      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
      background: STATUS_COLORS[entry.status]?.bg || "#e5e7eb",
      border: `2px solid ${STATUS_COLORS[entry.status]?.text || "#9ca3af"}`,
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[entry.status]?.text || "#9ca3af" }} />
    </div>
    <div style={{ flex: 1, paddingTop: 1 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <StatusBadge status={entry.status} />
        <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{formatDateTime(entry.timestamp)}</span>
        <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>— {entry.updatedByName}</span>
      </div>
      <div style={{ fontSize: "0.82rem", color: "#374151", marginTop: 4, lineHeight: 1.5 }}>{entry.note}</div>
      {entry.followUpDate && (
        <div style={{ fontSize: "0.75rem", color: "#4361ee", marginTop: 3 }}>
          <i className="fa-regular fa-calendar me-1"></i>Follow-up: {entry.followUpDate}
        </div>
      )}
    </div>
  </div>
);

// ─── UpdateStatusPanel ────────────────────────────────────────────────────────

const UpdateStatusPanel = ({ lead, companyId, currentUser, onUpdated }) => {
  const [status,   setStatus]   = useState(lead.currentStatus || "New");
  const [note,     setNote]     = useState("");
  const [followUp, setFollowUp] = useState(lead.followUpDate || "");
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!note.trim()) {
      Swal.fire({ icon: "warning", title: "Note required", text: "Please describe what happened." });
      return;
    }
    setSaving(true);
    try {
      await updateLeadStatus(
        companyId, lead.id, status, note,
        currentUser?.displayName || "Unknown",
        followUp || null
      );
      // ── Clear newLead flag on first sales interaction ──
      if (lead.newLead) {
        await updateNewLeads(companyId, lead.id, false);
      }
      setNote("");
      onUpdated(lead.id);
      Swal.fire({ icon: "success", title: "Status Updated", timer: 1300, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Failed to update." });
    }
    setSaving(false);
  };

  return (
    <div style={{ background: "#f8faff", border: "1px solid #e0e7ff", borderRadius: 8, padding: "0.9rem", marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#4361ee", marginBottom: "0.6rem" }}>
        <i className="fa-solid fa-rotate me-1"></i> Update Status
      </div>
      <div className="row g-2">
        <div className="col-md-4">
          <Form.Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Form.Select>
        </div>
        <div className="col-md-4">
          <Form.Control size="sm" type="date" value={followUp}
            onChange={(e) => setFollowUp(e.target.value)} title="Follow-up date" />
        </div>
        <div className="col-12">
          <Form.Control
            as="textarea" size="sm" rows={2}
            placeholder="What happened? Note is required…"
            value={note} onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="col-12">
          <button className="lead-save-btn" onClick={handleSave} disabled={saving}>
            {saving
              ? <Spinner size="sm" />
              : <><i className="fa-solid fa-floppy-disk me-1"></i>Save Update</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── LeadRow ──────────────────────────────────────────────────────────────────

const LeadRow = ({ lead, companyId, currentUser, checkAdmin, onUpdated }) => {
  const [expanded,     setExpanded]     = useState(false);
  const [history,      setHistory]      = useState([]);
  const [loadingH,     setLoadingH]     = useState(false);
  const [editRemarks,  setEditRemarks]  = useState(false);
  const [remarks,      setRemarks]      = useState(lead.remarks || "");
  const [savingR,      setSavingR]      = useState(false);

  const phone          = sanitizePhone(lead.contactNumber);
  const overdue        = isOverdue(lead.followUpDate) && !["Converted","Not Interested"].includes(lead.currentStatus);
  const isConverted    = lead.currentStatus === "Converted";
  const isNotInterested = lead.currentStatus === "Not Interested";
  const pm             = PRIORITY_META[lead.priority] || PRIORITY_META["Medium"];
  const tc             = typeColor(lead.leadType);

  const loadHistory = useCallback(async () => {
    if (history.length) return;
    setLoadingH(true);
    const data = await fetchStatusHistory(companyId, lead.id);
    setHistory(data);
    setLoadingH(false);
  }, [companyId, lead.id, history.length]);

  const handleExpand = () => {
    if (!expanded) loadHistory();
    setExpanded((p) => !p);
  };

  const handleRefreshHistory = async () => {
    setLoadingH(true);
    const data = await fetchStatusHistory(companyId, lead.id);
    setHistory(data);
    setLoadingH(false);
  };

  const handleSaveRemarks = async () => {
    setSavingR(true);
    try {
      await updateLeadRemarks(companyId, lead.id, remarks);
      setEditRemarks(false);
      Swal.fire({ icon: "success", title: "Remarks saved", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Failed to save." });
    }
    setSavingR(false);
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`lead-row ${isConverted ? "lead-converted" : ""} ${isNotInterested ? "lead-lost" : ""} ${overdue ? "lead-overdue" : ""}`}>

      {/* ── Main clickable row ── */}
      <div className="lead-row-main" onClick={handleExpand} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleExpand()}>

        <div className="lead-priority-stripe" style={{ background: pm.color }} title={pm.label} />

        <div className="lead-row-content">
          {/* Top line */}
          <div className="lead-row-top">
            <div className="lead-row-identity">
              <span className="lead-name">{lead.name}</span>
              {lead.institutionName && (
                <span className="lead-institution">
                  <i className="fa-solid fa-building me-1" style={{ fontSize: "0.65rem" }}></i>
                  {lead.institutionName}
                </span>
              )}
            </div>
            <div className="lead-row-badges">
              {/* ── NEW LEAD BADGE ── */}
              {lead.newLead && (
  <span style={{
    background: "linear-gradient(135deg, #059669, #10b981)",
    color: "#fff",
    borderRadius: 12,
    padding: "3px 10px",
    fontSize: "0.72rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    boxShadow: "0 0 0 3px #6ee7b740",
    animation: "newLeadPulse 1.8s ease-in-out infinite",
  }}>
    <i className="fa-solid fa-bolt" style={{ fontSize: "0.65rem" }}></i> New
  </span>
)}
              <span className="lead-type-badge" style={{ background: tc + "18", color: tc, border: `1px solid ${tc}30` }}>
                {lead.leadType}
              </span>
              <span className="lead-priority-badge" style={{ background: pm.bg, color: pm.color }}>
                {pm.label}
              </span>
              <StatusBadge status={lead.currentStatus} />
            </div>
          </div>

          {/* Meta line */}
          <div className="lead-row-meta">
            {lead.region && (
              <span className="lead-meta-item">
                <i className="fa-solid fa-location-dot" style={{ color: "#4361ee" }}></i>
                {lead.region}
              </span>
            )}
            {checkAdmin && lead.assignedToName && (
              <span className="lead-meta-item" style={{ color: "#7c3aed", fontWeight: 600 }}>
                <i className="fa-solid fa-user-tie"></i>
                {lead.assignedToName}
              </span>
            )}
            {lead.contactNumber && (
              <span className="lead-meta-item" onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 4, alignItems: "center", position: "relative" }}>
                <a href={`tel:${phone}`} className="lead-action-btn call-btn" title="Call">
                  <i className="fa-solid fa-phone"></i>
                </a>
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"
                  className="lead-action-btn whatsapp-btn" title="WhatsApp">
                  <i className="fa-brands fa-whatsapp"></i>
                </a>
                <span
                  onClick={(e) => handleCopy(e, lead.contactNumber)}
                  style={{
                    color: "#9ca3af",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="Click to copy"
                >
                  {lead.contactNumber}
                  <i className="fa-regular fa-copy" style={{ fontSize: '0.7rem' }}></i>
                </span>
                {copied && (
                  <span style={{
                    position: "absolute",
                    top: "-25px",
                    right: "0",
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.65rem",
                    animation: "fadeIn 0.2s"
                  }}>
                    Copied!
                  </span>
                )}
              </span>
            )}
            {lead.followUpDate && (
              <span className={`lead-meta-item ${overdue ? "overdue-tag" : ""}`}>
                <i className="fa-regular fa-calendar"></i>
                {overdue ? "⚠ Overdue: " : "Follow-up: "}{lead.followUpDate}
              </span>
            )}
            <span className="lead-meta-item lead-age">
              <i className="fa-regular fa-clock"></i>
              {timeAgo(lead.createdAt)}
            </span>
          </div>
        </div>

        <div className="lead-chevron" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0)" }}>
          <i className="fa-solid fa-chevron-right"></i>
        </div>
      </div>

      {/* ── Expanded panel ── */}
      {expanded && (
        <div className="lead-expanded">

          {lead.message && (
            <div className="lead-detail-block">
              <div className="lead-detail-label">Message from Lead</div>
              <div className="lead-detail-value">{lead.message}</div>
            </div>
          )}

          {/* Remarks */}
          <div className="lead-detail-block">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="lead-detail-label" style={{ margin: 0 }}>Internal Remarks</span>
              {!editRemarks
                ? <button className="lead-edit-btn" onClick={() => setEditRemarks(true)}>
                    <i className="fa-solid fa-pen" style={{ fontSize: "0.65rem" }}></i> Edit
                  </button>
                : <div style={{ display: "flex", gap: 6 }}>
                    <button className="lead-edit-btn save" onClick={handleSaveRemarks} disabled={savingR}>
                      {savingR ? <Spinner size="sm" /> : "Save"}
                    </button>
                    <button className="lead-edit-btn" onClick={() => { setEditRemarks(false); setRemarks(lead.remarks || ""); }}>
                      Cancel
                    </button>
                  </div>
              }
            </div>
            {editRemarks
              ? <Form.Control as="textarea" size="sm" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              : <div className="lead-detail-value">{remarks || <span style={{ color: "#bbb" }}>No remarks yet.</span>}</div>
            }
          </div>

          {/* Status update */}
          <UpdateStatusPanel
            lead={lead}
            companyId={companyId}
            currentUser={currentUser}
            onUpdated={(id) => { handleRefreshHistory(); onUpdated(id); }}
          />

          {/* Timeline */}
          <div className="lead-detail-block">
            <div className="lead-detail-label">Contact History</div>
            {loadingH
              ? <div style={{ textAlign: "center", padding: "1rem" }}><Spinner size="sm" /></div>
              : history.length === 0
              ? <div style={{ color: "#bbb", fontSize: "0.85rem" }}>No history yet.</div>
              : <div style={{ paddingTop: "0.5rem" }}>
                  {history.map((entry, i) => (
                    <TimelineEntry key={entry.id} entry={entry} isLast={i === history.length - 1} />
                  ))}
                </div>
            }
          </div>

          <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "0.5rem" }}>
            Added by {lead.addedByName}
            {lead.assignedToName && ` · Assigned to ${lead.assignedToName}`}
            {" · "}{formatDateTime(lead.createdAt)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────

const StatsBar = ({ leads }) => {
  const total     = leads.length;
  const converted = leads.filter((l) => l.currentStatus === "Converted").length;
  const convPct   = total ? Math.round((converted / total) * 100) : 0;
  const overdue   = leads.filter(
    (l) => isOverdue(l.followUpDate) && !["Converted","Not Interested"].includes(l.currentStatus)
  ).length;
  const byType = leads.reduce((acc, l) => { acc[l.leadType] = (acc[l.leadType] || 0) + 1; return acc; }, {});

  return (
    <div className="leads-stats-bar">
      <div className="stat-pill">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat-pill converted">
        <span className="stat-value">{convPct}%</span>
        <span className="stat-label">Converted</span>
      </div>
      {overdue > 0 && (
        <div className="stat-pill overdue">
          <span className="stat-value">{overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      )}
      <div className="stat-divider" />
      {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
        <div key={type} className="stat-pill type-pill">
          <span className="stat-dot" style={{ background: typeColor(type) }} />
          <span className="stat-value">{count}</span>
          <span className="stat-label">{type}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdLeads = ({ companyId, currentUser }) => {
  const [leads,          setLeads]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [checkAdmin,     setCheckAdmin]     = useState(false);
  const [refresh,        setRefresh]        = useState(false);
  const [search,         setSearch]         = useState("");
  const [filterRegion,   setFilterRegion]   = useState("all");
  const [filterType,     setFilterType]     = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus,   setFilterStatus]   = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const adminStatus = await isAdmin(currentUser);
      console.log(adminStatus);
      setCheckAdmin(adminStatus);
      const data = await fetchAdLeads(companyId, currentUser, adminStatus);
      setLeads(data);
      setLoading(false);
    };
    load();
  }, [companyId, currentUser, refresh]);

  const triggerRefresh = () => setRefresh((p) => !p);

  const allRegions = useMemo(() =>
    [...new Set(leads.map((l) => l.region).filter(Boolean))].sort(),
    [leads]
  );
  const allTypes = useMemo(() =>
    [...new Set(leads.map((l) => l.leadType).filter(Boolean))].sort(),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (filterRegion   !== "all" && l.region        !== filterRegion)   return false;
      if (filterType     !== "all" && l.leadType      !== filterType)     return false;
      if (filterPriority !== "all" && l.priority      !== filterPriority) return false;
      if (filterStatus   !== "all" && l.currentStatus !== filterStatus)   return false;
      if (q && !(
        l.name?.toLowerCase().includes(q) ||
        l.institutionName?.toLowerCase().includes(q) ||
        l.message?.toLowerCase().includes(q) ||
        l.contactNumber?.includes(q) ||
        l.assignedToName?.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [leads, search, filterRegion, filterType, filterPriority, filterStatus]);

  const hasFilters = search || filterRegion !== "all" || filterType !== "all" || filterPriority !== "all" || filterStatus !== "all";
  const clearFilters = () => { setSearch(""); setFilterRegion("all"); setFilterType("all"); setFilterPriority("all"); setFilterStatus("all"); };

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <Spinner animation="border" style={{ color: "#4361ee" }} />
      </div>
    );

  return (
    <div className="adleads-page">
      {/* Header */}
      <div className="adleads-header">
        <div>
          <h4 className="adleads-title">
            <i className="fa-solid fa-bullhorn me-2" style={{ color: "#f59e0b" }}></i>
            Ad Leads
          </h4>
          <p className="adleads-subtitle">
            {checkAdmin
              ? "All leads across all employees"
              : `Showing leads assigned to you`}
          </p>
        </div>
        <AddLeadModal companyId={companyId} currentUser={currentUser} onAdded={triggerRefresh} />
      </div>

      {/* Stats */}
      <StatsBar leads={leads} />

      {/* Filters */}
      <div className="adleads-filters">
        <div className="leads-search-wrap">
          <i className="fa-solid fa-magnifying-glass leads-search-icon"></i>
          <input
            className="leads-search"
            placeholder={checkAdmin ? "Search name, institution, employee…" : "Search name, institution…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="leads-search-clear" onClick={() => setSearch("")}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div className="leads-filter-row">
          {allRegions.length > 0 && (
            <Form.Select size="sm" className="lead-filter-select" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
              <option value="all">All Regions</option>
              {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
            </Form.Select>
          )}
          <Form.Select size="sm" className="lead-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </Form.Select>
          <Form.Select size="sm" className="lead-filter-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="Urgent">⚡ Urgent</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </Form.Select>
          <Form.Select size="sm" className="lead-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Form.Select>
          {hasFilters && (
            <button className="leads-clear-btn" onClick={clearFilters}>
              <i className="fa-solid fa-xmark me-1"></i>Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.5rem", paddingLeft: 2 }}>
        Showing {filtered.length} of {leads.length} leads
        {hasFilters && <span style={{ color: "#4361ee", marginLeft: 6 }}>· Filters active</span>}
      </div>

      {/* List */}
      <div className="adleads-list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#bbb" }}>
            <i className="fa-solid fa-inbox" style={{ fontSize: "2rem", marginBottom: "0.75rem", display: "block" }}></i>
            No leads match your filters.
          </div>
        ) : (
          filtered.map((lead) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              companyId={companyId}
              currentUser={currentUser}
              checkAdmin={checkAdmin}
              onUpdated={triggerRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AdLeads;
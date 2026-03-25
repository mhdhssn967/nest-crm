import { useState, useEffect, useMemo } from "react";
import { fetchDistributors } from "../services/fetchDistributors";
import { isAdmin } from "../services/fetchNames";
import AddDistributorModal from "../components/AddDistributorModal";
import DistributorSlip from "../components/DistributorSlip";
import OQ from "../assets/OQ.png";
import "./Distributors.css";
import importAll from "../services/tempScript";

const STATUS_COLORS = {
  "Contacted": "#a3c9f1",
  "To Follow Up": "#fff3b0",
  "Agreement Sent": "#d2b7e5",
  "Agreement Signed": "#b0eacb",
  "Doing Sales": "#b2f2bb",
  "Inactive": "#ffd8a8",
  "Terminated": "#f5b7b1",
};

const STATUS_LIST = [
  "Haven't yet contacted","Called, no response","Contacted","Online demo done",
  "Live demo done","Hospital presentation done","To Follow Up",
  "Agreement Sent & awaiting response","Agreement Signed","Doing Sales",
  "Inactive","Terminated",
];

const REGION_ICONS = {
  "North": "🏔️","South": "🌴","East": "🌅","West": "🌊",
  "North-East": "🍃","Central": "🏛️","Unknown": "📍",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const groupByRegion = (records) => {
  const groups = {};
  records.forEach((r) => {
    const region = r.region?.trim() || "Unknown";
    if (!groups[region]) groups[region] = [];
    groups[region].push(r);
  });
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    return a.localeCompare(b);
  });
};

// ─── Analytics Dashboard ──────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: "#fff", borderRadius: 14, padding: "1.1rem 1.3rem",
    boxShadow: "0 1px 6px rgba(0,0,0,0.07)", borderLeft: `4px solid ${color}`,
    display: "flex", alignItems: "center", gap: 14, minWidth: 0,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: color + "22",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.25rem", flexShrink: 0,
    }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a1a2e", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "#aaa", marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const MiniBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", marginBottom: 4 }}>
        <span style={{ fontWeight: 500, color: "#444" }}>{label}</span>
        <span style={{ color: "#888" }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: "#f0f0f0", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
};

const AnalyticsDashboard = ({ records }) => {
  const total = records.length;
  const doingSales = records.filter(r => r.currentStatus === "Doing Sales").length;
  const exclusive = records.filter(r => r.exclusive === "Yes").length;
  const followUp = records.filter(r => r.currentStatus === "To Follow Up").length;
  const agreementSigned = records.filter(r => r.currentStatus === "Agreement Signed").length;

  const today = new Date();
  const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
  const dueSoon = records.filter(r => {
    if (!r.nextFollowUp) return false;
    const d = new Date(r.nextFollowUp);
    return d >= today && d <= nextWeek;
  }).length;

  const statusCounts = STATUS_LIST.reduce((acc, s) => {
    const c = records.filter(r => r.currentStatus === s).length;
    if (c > 0) acc[s] = c;
    return acc;
  }, {});

  const regionCounts = {};
  records.forEach(r => {
    const region = r.region?.trim() || "Unknown";
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });
  const regionEntries = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);

  const REGION_COLORS = ["#4361ee","#7209b7","#f72585","#4cc9f0","#4ade80","#fb8500"];

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))",
        gap: 12, marginBottom: 14,
      }}>
        <StatCard icon="🤝" label="Total Distributors" value={total} color="#4361ee" />
        <StatCard icon="💰" label="Doing Sales" value={doingSales}
          sub={`${total > 0 ? Math.round(doingSales / total * 100) : 0}% of total`} color="#4ade80" />
        <StatCard icon="⭐" label="Exclusive" value={exclusive} color="#fbbf24" />
        <StatCard icon="🔔" label="To Follow Up" value={followUp} color="#f59e0b" />
        <StatCard icon="📝" label="Agreement Signed" value={agreementSigned} color="#a78bfa" />
        <StatCard icon="📅" label="Follow-Ups This Week" value={dueSoon} color="#f72585" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.1rem 1.3rem", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 14 }}>
            Status Breakdown
          </div>
          {Object.keys(statusCounts).length === 0
            ? <div style={{ color: "#ccc", fontSize: "0.85rem" }}>No data</div>
            : Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <MiniBar key={status} label={status} count={count} total={total} color={STATUS_COLORS[status] || "#ddd"} />
            ))
          }
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "1.1rem 1.3rem", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 14 }}>
            Region Breakdown
          </div>
          {regionEntries.length === 0
            ? <div style={{ color: "#ccc", fontSize: "0.85rem" }}>No data</div>
            : regionEntries.map(([region, count], i) => (
              <MiniBar key={region} label={`${REGION_ICONS[region] || "📍"} ${region}`} count={count} total={total}
                color={REGION_COLORS[i % REGION_COLORS.length]} />
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FilterBar = ({ records, filters, setFilters, isAdminUser }) => {
  const regions = useMemo(() => {
    const s = new Set(records.map(r => r.region?.trim() || "Unknown"));
    return ["All", ...Array.from(s).sort((a, b) => a === "Unknown" ? 1 : a.localeCompare(b))];
  }, [records]);

  const employees = useMemo(() => {
    const s = new Set(records.map(r => r.addedByName).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [records]);

  const states = useMemo(() => {
    const s = new Set(records.map(r => r.state).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [records]);

  const activeCount = Object.entries(filters).filter(([k, v]) => k !== "followUpDue" ? v !== "All" : v === true).length;

  const reset = () => setFilters({ region: "All", status: "All", state: "All", employee: "All", exclusive: "All", followUpDue: false });

  const FilterSelect = ({ label, field, options }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888" }}>{label}</label>
      <select
        value={filters[field]}
        onChange={e => setFilters(p => ({ ...p, [field]: e.target.value }))}
        style={{
          fontSize: "0.82rem",
          border: `1.5px solid ${filters[field] !== "All" ? "#4361ee" : "#e5e7eb"}`,
          borderRadius: 8, padding: "5px 10px",
          background: filters[field] !== "All" ? "#eef1ff" : "#fff",
          color: filters[field] !== "All" ? "#4361ee" : "#333",
          fontWeight: filters[field] !== "All" ? 600 : 400,
          cursor: "pointer", outline: "none",
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "1rem 1.2rem",
      boxShadow: "0 1px 6px rgba(0,0,0,0.07)", marginBottom: 16,
      display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end",
    }}>
      {/* <button onClick={importAll}>Import</button> */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-end", paddingBottom: 3 }}>
        <i className="fa-solid fa-filter" style={{ color: "#4361ee", fontSize: "0.85rem" }}></i>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#555" }}>Filters</span>
        {activeCount > 0 && (
          <span style={{ background: "#4361ee", color: "#fff", borderRadius: 20, fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px" }}>{activeCount}</span>
        )}
      </div>

      <FilterSelect label="Region" field="region" options={regions} />
      <FilterSelect label="Status" field="status" options={["All", ...STATUS_LIST]} />
      <FilterSelect label="State" field="state" options={states} />
       <FilterSelect label="Employee" field="employee" options={employees} />
      <FilterSelect label="Exclusive" field="exclusive" options={["All", "Yes", "No"]} />

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <label style={{ fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888" }}>Follow-Up</label>
        <button
          onClick={() => setFilters(p => ({ ...p, followUpDue: !p.followUpDue }))}
          style={{
            fontSize: "0.82rem",
            border: `1.5px solid ${filters.followUpDue ? "#f72585" : "#e5e7eb"}`,
            borderRadius: 8, padding: "5px 12px",
            background: filters.followUpDue ? "#fff0f7" : "#fff",
            color: filters.followUpDue ? "#f72585" : "#888",
            fontWeight: filters.followUpDue ? 700 : 400, cursor: "pointer",
          }}
        >
          {filters.followUpDue ? "✓ Due This Week" : "Due This Week"}
        </button>
      </div>

      {activeCount > 0 && (
        <button onClick={reset} style={{
          fontSize: "0.78rem", border: "none", background: "none",
          color: "#f87171", fontWeight: 600, cursor: "pointer", alignSelf: "flex-end", paddingBottom: 6,
        }}>
          ✕ Clear all
        </button>
      )}
    </div>
  );
};

// ─── Region Card ──────────────────────────────────────────────────────────────

const RegionCard = ({ region, distributors, companyId, isAdmin, onUpdated }) => {
  const [open, setOpen] = useState(false);
  const doingSales = distributors.filter(d => d.currentStatus === "Doing Sales").length;
  const active = distributors.filter(d => !["Inactive", "Terminated"].includes(d.currentStatus)).length;

  return (
    <div className={`region-card ${open ? "region-card--open" : ""}`}>
      <button className="region-header" onClick={() => setOpen(p => !p)}>
        <div className="region-header__left">
          <span className="region-icon">{REGION_ICONS[region] || "📍"}</span>
          <div>
            <div className="region-name">{region}</div>
            <div className="region-meta">
              {distributors.length} distributor{distributors.length !== 1 ? "s" : ""}
              {doingSales > 0 && <span className="region-badge region-badge--sales">{doingSales} active sales</span>}
              {active < distributors.length && (
                <span className="region-badge region-badge--inactive">{distributors.length - active} inactive</span>
              )}
            </div>
          </div>
        </div>
        <div className="region-header__right">
          <div className="region-status-pills">
            {Object.entries(
              distributors.reduce((acc, d) => {
                const s = d.currentStatus || "Unknown";
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {})
            ).map(([status, count]) => (
              <span key={status} className="region-status-pill" style={{ background: STATUS_COLORS[status] || "#ddd" }}>
                {count} {status}
              </span>
            ))}
          </div>
          <span className={`region-chevron ${open ? "region-chevron--open" : ""}`}>
            <i className="fa-solid fa-chevron-down"></i>
          </span>
        </div>
      </button>
      {open && (
        <div className="region-body">
          {distributors.map(d => (
            <DistributorSlip key={d.id} distributor={d} companyId={companyId} isAdmin={isAdmin} onUpdated={onUpdated} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  region: "All", status: "All", state: "All",
  employee: "All", exclusive: "All", followUpDue: false,
};

const Distributors = ({ currentUser, companyId, employeeName }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [checkAdmin, setCheckAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUser || !companyId) return;
      setLoading(true);
      const adminStatus = await isAdmin(currentUser.uid);
      setCheckAdmin(adminStatus);
      const data = await fetchDistributors(companyId, currentUser);
      setRecords(data);
      setLoading(false);
    };
    load();
  }, [currentUser, companyId, refresh]);

  const triggerRefresh = () => setRefresh(p => !p);

  const filtered = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);

    return records.filter(r => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const hit =
          r.distributorName?.toLowerCase().includes(q) ||
          r.state?.toLowerCase().includes(q) ||
          r.contactPersonName?.toLowerCase().includes(q) ||
          r.addedByName?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (filters.region !== "All" && (r.region?.trim() || "Unknown") !== filters.region) return false;
      if (filters.status !== "All" && r.currentStatus !== filters.status) return false;
      if (filters.state !== "All" && r.state !== filters.state) return false;
      if (filters.employee !== "All" && r.addedByName !== filters.employee) return false;
      if (filters.exclusive !== "All" && r.exclusive !== filters.exclusive) return false;
      if (filters.followUpDue) {
        if (!r.nextFollowUp) return false;
        const d = new Date(r.nextFollowUp);
        if (!(d >= today && d <= nextWeek)) return false;
      }
      return true;
    });
  }, [records, search, filters]);

  const grouped = groupByRegion(filtered);
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "followUpDue" ? v !== "All" : v === true).length;

  if (loading)
    return (
      <div className="loadingDiv" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="load-inside"></div>
        <img className="pulse" src={OQ} width="80px" alt="loading" />
      </div>
    );

  if (!currentUser) return <p>Please log in to view distributors.</p>;

  return (
    <div className="distributors-page">
      {/* Header */}
      <div className="dist-header">
        <div>
          <h4 className="dist-title">
            <i className="fa-solid fa-handshake me-2" style={{ color: "#4361ee" }}></i>
            Distributors
          </h4>
          <p className="dist-subtitle">
            {filtered.length}{filtered.length !== records.length && ` of ${records.length}`} distributor{records.length !== 1 ? "s" : ""}
            {grouped.length > 0 && ` · ${grouped.length} region${grouped.length !== 1 ? "s" : ""}`}
            {activeFilterCount > 0 && <span style={{ color: "#4361ee", fontWeight: 600 }}> · filtered</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowDashboard(p => !p)}
            title="Toggle analytics dashboard"
            style={{
              border: `1.5px solid ${showDashboard ? "#4361ee" : "#e5e7eb"}`,
              background: showDashboard ? "#eef1ff" : "#fff",
              color: showDashboard ? "#4361ee" : "#888",
              borderRadius: 10, padding: "7px 14px", fontSize: "0.82rem",
              fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <i className="fa-solid fa-chart-bar"></i> Analytics
          </button>
          <div className="dist-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text" placeholder="Search distributors…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <AddDistributorModal companyId={companyId} employeeName={employeeName} onAdded={triggerRefresh} />
        </div>
      </div>

      {/* Analytics — reacts to filters + search */}
      {showDashboard && <AnalyticsDashboard records={filtered} />}

      {/* Filters */}
      <FilterBar records={records} filters={filters} setFilters={setFilters} isAdminUser={checkAdmin} />

      {/* Distributor List */}
      {grouped.length === 0 ? (
        <div className="dist-empty">
          <i className="fa-solid fa-handshake" style={{ fontSize: "2.5rem", color: "#ddd" }}></i>
          <p>{activeFilterCount > 0 || search ? "No distributors match your filters." : "No distributors found."}</p>
          {(activeFilterCount > 0 || search) && (
            <button
              onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
              style={{
                border: "none", background: "#4361ee", color: "#fff",
                borderRadius: 8, padding: "7px 18px", fontSize: "0.85rem",
                fontWeight: 600, cursor: "pointer", marginTop: 8,
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="region-list">
          {grouped.map(([region, distributors]) => (
            <RegionCard
              key={region} region={region} distributors={distributors}
              companyId={companyId} isAdmin={checkAdmin} onUpdated={triggerRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Distributors;
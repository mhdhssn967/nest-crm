import { useState, useEffect, useMemo } from "react";
import {
  Handshake, MapPin, ChevronDown, ChevronRight,
  BarChart2, Search, Plus, Star, TrendingUp, Bell,
  FileText, FileCheck, Users, AlertCircle, Filter, X,
  Building2, Globe, Layers, Activity,
} from "lucide-react";
import { fetchDistributors } from "../services/fetchDistributors";
import { isAdmin } from "../services/fetchNames";
import AddDistributorModal from "../components/AddDistributorModal";
import DistributorSlip from "../components/DistributorSlip";
import OQ from "../assets/OQ.png";
import "./Distributors.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  "Haven't yet contacted":           { bg: "#f1f5f9", text: "#64748b", dot: "#94a3b8" },
  "Called, no response":             { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  "Contacted and discussed via phone":{ bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  "Online demo done":                { bg: "#e0f2fe", text: "#0369a1", dot: "#0ea5e9" },
  "Live demo done":                  { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  "Hospital presentation done":      { bg: "#ede9fe", text: "#4c1d95", dot: "#8b5cf6" },
  "Agreement Sent & awaiting response":{ bg: "#fce7f3", text: "#9d174d", dot: "#ec4899" },
  "Agreement Signed":                { bg: "#c7d2fe", text: "#3730a3", dot: "#6366f1" },
  "Purchased Demo Piece":            { bg: "#fed7aa", text: "#7c2d12", dot: "#f97316" },
  "Doing Sales":                     { bg: "#bbf7d0", text: "#14532d", dot: "#22c55e" },
  "Inactive":                        { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" },
  "Terminated":                      { bg: "#fee2e2", text: "#7f1d1d", dot: "#ef4444" },
};

const STATUS_LIST = [
  "Haven't yet contacted","Called, no response","Contacted and discussed via phone",
  "Online demo done","Live demo done","Hospital presentation done",
  "Agreement Sent & awaiting response","Agreement Signed","Purchased Demo Piece",
  "Doing Sales","Inactive","Terminated",
];

const REGION_PALETTE = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6","#f97316",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const groupByState = (records) => {
  const states = {};
  records.forEach((r) => {
    const state = r.state?.trim() || "Unknown";
    if (!states[state]) states[state] = {};
    const region = r.region?.trim() || "Unknown";
    if (!states[state][region]) states[state][region] = [];
    states[state][region].push(r);
  });
  return Object.entries(states).sort(([a], [b]) => {
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    return a.localeCompare(b);
  });
};

const StatusBadge = ({ status }) => {
  const style = STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 9px", borderRadius: 20,
      background: style.bg, color: style.text,
      fontSize: "0.71rem", fontWeight: 600, letterSpacing: "0.01em",
      border: `1px solid ${style.dot}33`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: style.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
};

// ─── Stat Cards ───────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div style={{
    background: "#fff", borderRadius: 14, padding: "1.1rem 1.25rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)",
    borderTop: `3px solid ${accent}`,
    display: "flex", alignItems: "flex-start", gap: 12,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: accent + "18",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={18} color={accent} strokeWidth={2} />
    </div>
    <div>
      <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "#cbd5e1", marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const MiniBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 }}>
        <span style={{ color: "#475569", fontWeight: 500 }}>{label}</span>
        <span style={{ color: "#94a3b8", fontWeight: 500 }}>{count} <span style={{ opacity: 0.6 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
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

  const stateCounts = {};
  records.forEach(r => {
    const state = r.state?.trim() || "Unknown";
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  });
  const stateEntries = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10, marginBottom: 12 }}>
        <StatCard icon={Users}      label="Total"            value={total}            accent="#6366f1" />
        <StatCard icon={TrendingUp} label="Doing Sales"      value={doingSales}       accent="#22c55e"
          sub={`${total > 0 ? Math.round(doingSales / total * 100) : 0}% of total`} />
        <StatCard icon={Star}       label="Exclusive"        value={exclusive}        accent="#f59e0b" />
        <StatCard icon={Bell}       label="To Follow Up"     value={followUp}         accent="#f97316" />
        <StatCard icon={FileCheck}  label="Agmt Signed"      value={agreementSigned}  accent="#8b5cf6" />
        <StatCard icon={Activity}   label="Due This Week"    value={dueSoon}          accent="#ec4899" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          {
            title: "Status Breakdown",
            icon: <Layers size={13} />,
            items: Object.entries(statusCounts).sort((a, b) => b[1] - a[1]),
            colorFn: (s) => STATUS_COLORS[s]?.dot || "#94a3b8",
          },
          {
            title: "Top States",
            icon: <Globe size={13} />,
            items: stateEntries,
            colorFn: (_, i) => REGION_PALETTE[i % REGION_PALETTE.length],
          },
        ].map(({ title, icon, items, colorFn }) => (
          <div key={title} style={{
            background: "#fff", borderRadius: 14, padding: "1.1rem 1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <span style={{ color: "#6366f1" }}>{icon}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>{title}</span>
            </div>
            {items.length === 0
              ? <div style={{ color: "#e2e8f0", fontSize: "0.82rem" }}>No data</div>
              : items.map(([label, count], i) => (
                <MiniBar key={label} label={label} count={count} total={total} color={colorFn(label, i)} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FilterBar = ({ records, filters, setFilters }) => {
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

  const pill = (field, options, label) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>{label}</label>
      <select
        value={filters[field]}
        onChange={e => setFilters(p => ({ ...p, [field]: e.target.value }))}
        style={{
          fontSize: "0.8rem",
          border: `1.5px solid ${filters[field] !== "All" ? "#6366f1" : "#e2e8f0"}`,
          borderRadius: 8, padding: "5px 10px",
          background: filters[field] !== "All" ? "#eef2ff" : "#fafafa",
          color: filters[field] !== "All" ? "#4338ca" : "#334155",
          fontWeight: filters[field] !== "All" ? 600 : 400,
          cursor: "pointer", outline: "none", minWidth: 110,
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "0.9rem 1.2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)",
      marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-end", paddingBottom: 2 }}>
        <Filter size={14} color="#6366f1" />
        <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#475569" }}>Filters</span>
        {activeCount > 0 && (
          <span style={{
            background: "#6366f1", color: "#fff", borderRadius: 20,
            fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px",
          }}>{activeCount}</span>
        )}
      </div>

      {pill("region",   regions,                          "Region"   )}
      {pill("status",   ["All", ...STATUS_LIST],          "Status"   )}
      {pill("state",    states,                           "State"    )}
      {pill("employee", employees,                        "Employee" )}
      {pill("exclusive",["All", "Yes", "No"],             "Exclusive")}

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Follow-Up</label>
        <button
          onClick={() => setFilters(p => ({ ...p, followUpDue: !p.followUpDue }))}
          style={{
            fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 5,
            border: `1.5px solid ${filters.followUpDue ? "#ec4899" : "#e2e8f0"}`,
            borderRadius: 8, padding: "5px 12px",
            background: filters.followUpDue ? "#fff0f7" : "#fafafa",
            color: filters.followUpDue ? "#db2777" : "#94a3b8",
            fontWeight: filters.followUpDue ? 700 : 400, cursor: "pointer",
          }}
        >
          <Bell size={12} />
          {filters.followUpDue ? "Due This Week ✓" : "Due This Week"}
        </button>
      </div>

      {activeCount > 0 && (
        <button onClick={reset} style={{
          fontSize: "0.76rem", border: "none", background: "none",
          color: "#f87171", fontWeight: 600, cursor: "pointer",
          alignSelf: "flex-end", paddingBottom: 6,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <X size={12} /> Clear all
        </button>
      )}
    </div>
  );
};

// ─── Region Row (inside a State card) ─────────────────────────────────────────

const RegionRow = ({ region, distributors, companyId, isAdminUser, onUpdated, colorAccent }) => {
  const [open, setOpen] = useState(false);
  const doingSales = distributors.filter(d => d.currentStatus === "Doing Sales").length;

  return (
    <div style={{
      border: "1px solid #f1f5f9", borderRadius: 10,
      overflow: "hidden", marginBottom: 6,
    }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: open ? "#fafafe" : "#fff",
          border: "none", cursor: "pointer", gap: 12, textAlign: "left",
          transition: "background 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: colorAccent + "18",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MapPin size={13} color={colorAccent} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>{region}</div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 1 }}>
              {distributors.length} distributor{distributors.length !== 1 ? "s" : ""}
              {doingSales > 0 && <span style={{ color: "#22c55e", fontWeight: 600, marginLeft: 6 }}>· {doingSales} active</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {Object.entries(
              distributors.reduce((acc, d) => {
                const s = d.currentStatus || "Unknown";
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {})
            ).slice(0, 3).map(([status, count]) => (
              <span key={status} style={{
                fontSize: "0.68rem", fontWeight: 600, padding: "2px 7px",
                borderRadius: 20,
                background: STATUS_COLORS[status]?.bg || "#f1f5f9",
                color: STATUS_COLORS[status]?.text || "#64748b",
              }}>
                {count} · {status}
              </span>
            ))}
          </div>
          <span style={{
            color: "#94a3b8", transition: "transform 0.2s ease",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            display: "flex",
          }}>
            <ChevronRight size={15} />
          </span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "8px 14px 12px", background: "#fafafe", borderTop: "1px solid #f1f5f9" }}>
          {distributors.map(d => (
            <DistributorSlip key={d.id} distributor={d} companyId={companyId} isAdmin={isAdminUser} onUpdated={onUpdated} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── State Card ───────────────────────────────────────────────────────────────

const StateCard = ({ state, regionMap, companyId, isAdminUser, onUpdated, index }) => {
  const [open, setOpen] = useState(false);

  const allDistributors = Object.values(regionMap).flat();
  const total = allDistributors.length;
  const doingSales = allDistributors.filter(d => d.currentStatus === "Doing Sales").length;
  const regionCount = Object.keys(regionMap).length;
  const accent = REGION_PALETTE[index % REGION_PALETTE.length];

  const regionEntries = Object.entries(regionMap).sort(([a], [b]) => {
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    return a.localeCompare(b);
  });

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      boxShadow: open
        ? "0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.04)"
        : "0 1px 4px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)",
      marginBottom: 10, overflow: "hidden",
      transition: "box-shadow 0.2s ease",
      border: `1px solid ${open ? accent + "30" : "#f1f5f9"}`,
    }}>
      {/* State Header */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", padding: "1rem 1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: open ? `${accent}08` : "#fff",
          border: "none", cursor: "pointer", gap: 14,
          transition: "background 0.2s ease", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: accent + "15",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Building2 size={18} color={accent} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>{state}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}>
                <Users size={10} color="#94a3b8" />
                {total} distributor{total !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={10} color="#94a3b8" />
                {regionCount} region{regionCount !== 1 ? "s" : ""}
              </span>
              {doingSales > 0 && (
                <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                  <TrendingUp size={10} color="#22c55e" />
                  {doingSales} active sales
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Progress bar strip */}
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {regionEntries.map(([region, dists], i) => (
              <div
                key={region}
                title={`${region}: ${dists.length}`}
                style={{
                  height: 28, width: Math.max(28, (dists.length / total) * 120),
                  borderRadius: 6, background: REGION_PALETTE[i % REGION_PALETTE.length] + "30",
                  border: `1.5px solid ${REGION_PALETTE[i % REGION_PALETTE.length]}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700,
                  color: REGION_PALETTE[i % REGION_PALETTE.length],
                  whiteSpace: "nowrap", overflow: "hidden",
                  padding: "0 5px",
                }}
              >
                {dists.length}
              </div>
            ))}
          </div>

          <div style={{
            width: 28, height: 28, borderRadius: 8, background: open ? accent + "15" : "#f8fafc",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s ease", flexShrink: 0,
          }}>
            <ChevronDown
              size={15} color={open ? accent : "#94a3b8"}
              style={{ transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </div>
      </button>

      {/* Expanded: Regions */}
      {open && (
        <div style={{
          padding: "0 1.1rem 1.1rem",
          borderTop: `1px solid ${accent}18`,
        }}>
          <div style={{ paddingTop: "0.85rem",
           }}>
            {regionEntries.map(([region, dists], i) => (
              <RegionRow
                key={region}
                region={region}
                distributors={dists}
                companyId={companyId}
                isAdminUser={isAdminUser}
                onUpdated={onUpdated}
                colorAccent={REGION_PALETTE[i % REGION_PALETTE.length]}
              />
            ))}
          </div>
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

  const groupedByState = useMemo(() => groupByState(filtered), [filtered]);
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "followUpDue" ? v !== "All" : v === true).length;

  if (loading) {
    return (
      <div className="loadingDiv" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="load-inside"></div>
        <img className="pulse" src={OQ} width="80px" alt="loading" />
      </div>
    );
  }

  if (!currentUser) return <p>Please log in to view distributors.</p>;

  return (
    <div className="distributors-page" style={{ maxWidth: 1000, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexWrap: "wrap", gap: 14, marginBottom: "1.25rem",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#eef2ff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Handshake size={18} color="#6366f1" strokeWidth={1.8} />
            </div>
            <h4 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Distributors
            </h4>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#94a3b8" }}>
            {filtered.length}
            {filtered.length !== records.length && ` of ${records.length}`}
            {" "}distributor{records.length !== 1 ? "s" : ""}
            {groupedByState.length > 0 && ` · ${groupedByState.length} state${groupedByState.length !== 1 ? "s" : ""}`}
            {activeFilterCount > 0 && <span style={{ color: "#6366f1", fontWeight: 600 }}> · filtered</span>}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowDashboard(p => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              border: `1.5px solid ${showDashboard ? "#6366f1" : "#e2e8f0"}`,
              background: showDashboard ? "#eef2ff" : "#fafafa",
              color: showDashboard ? "#4338ca" : "#94a3b8",
              borderRadius: 10, padding: "7px 13px", fontSize: "0.8rem",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            <BarChart2 size={14} /> Analytics
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            border: "1.5px solid #e2e8f0", borderRadius: 10,
            padding: "6px 12px", background: "#fafafa",
          }}>
            <Search size={13} color="#94a3b8" />
            <input
              type="text" placeholder="Search distributors…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: "0.8rem", color: "#334155", width: 160,
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "flex" }}>
                <X size={12} color="#94a3b8" />
              </button>
            )}
          </div>

          <AddDistributorModal companyId={companyId} employeeName={employeeName} onAdded={triggerRefresh} />
        </div>
      </div>

      {/* ── Analytics ── */}
      {showDashboard && <AnalyticsDashboard records={filtered} />}

      {/* ── Filters ── */}
      <FilterBar records={records} filters={filters} setFilters={setFilters} />

      {/* ── State → Region → Distributor List ── */}
      {groupedByState.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3rem 1rem",
          background: "#fff", borderRadius: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, background: "#f8fafc",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Handshake size={26} color="#e2e8f0" />
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: 14 }}>
            {activeFilterCount > 0 || search ? "No distributors match your filters." : "No distributors found."}
          </p>
          {(activeFilterCount > 0 || search) && (
            <button
              onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
              style={{
                border: "none", background: "#6366f1", color: "#fff",
                borderRadius: 9, padding: "8px 20px", fontSize: "0.83rem",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div>
          {groupedByState.map(([state, regionMap], index) => (
            <StateCard
              key={state}
              state={state}
              regionMap={regionMap}
              companyId={companyId}
              isAdminUser={checkAdmin}
              onUpdated={triggerRefresh}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Distributors;
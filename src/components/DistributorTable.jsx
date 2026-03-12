import { useState } from "react";
import ViewDistributorModal from "./ViewDistributorModal";
import { fetchEnrolledCustomers } from "../services/fetchDistributors";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman & Nicobar Islands","Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"
];
const REGIONS = ["North","South","East","West","North-East","Central"];

export const getStatusColor = (status) => {
  const map = {
    "Contacted": "#a3c9f1", "To Follow Up": "#fff3b0", "Agreement Sent": "#d2b7e5",
    "Agreement Signed": "#b0eacb", "Doing Sales": "#b2f2bb", "Inactive": "#ffd8a8", "Terminated": "#f5b7b1",
  };
  return map[status] || "#d6d6d6";
};

const highlight = (text, term) => {
  if (!term || !text) return text;
  const parts = String(text).split(new RegExp(`(${term})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === term.toLowerCase()
      ? <span key={i} style={{ backgroundColor: "#ffe066", fontWeight: "bold", borderRadius: 3 }}>{p}</span>
      : p
  );
};

// ─── Expandable Customers Row ───────────────────────────────────────────────
const CustomerRow = ({ distributorId, companyId }) => {
  const [customers, setCustomers] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (customers !== null) { setCustomers(null); return; }
    setLoading(true);
    const data = await fetchEnrolledCustomers(companyId, distributorId);
    setCustomers(data);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); load(); }}
        title="View enrolled customers"
        style={{
          background: "none", border: "1.5px solid #4361ee", color: "#4361ee",
          borderRadius: "50%", width: 24, height: 24, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem",
          fontWeight: 700, padding: 0, transition: "all 0.15s"
        }}
      >
        {loading ? "…" : customers ? "−" : "+"}
      </button>
      {customers && (
        <div style={{ marginTop: 6, background: "#f0f4ff", borderRadius: 8, padding: "0.75rem", minWidth: 300 }}>
          {customers.length === 0
            ? <span style={{ color: "#aaa", fontSize: "0.8rem" }}>No enrolled customers yet.</span>
            : <table style={{ width: "100%", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#dde6ff" }}>
                    <th style={th}>#</th>
                    <th style={th}>Customer / Hospital Name</th>
                    <th style={th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #e0e7ff" }}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}>{c.customerName}</td>
                      <td style={td}>{c.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}
    </>
  );
};

const th = { padding: "4px 8px", fontWeight: 700, textAlign: "left" };
const td = { padding: "4px 8px" };

// ─── Main DistributorTable ──────────────────────────────────────────────────
const DistributorTable = ({ records, companyId, isAdmin, onUpdated, selectedStatus }) => {
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [exclusiveFilter, setExclusiveFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all"); // all | overdue | upcoming
  const [viewDist, setViewDist] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const filtered = records
    .filter((r) => selectedStatus === "all" || r.currentStatus === selectedStatus)
    .filter((r) => stateFilter === "all" || r.state === stateFilter)
    .filter((r) => regionFilter === "all" || r.region === regionFilter)
    .filter((r) => exclusiveFilter === "all" || r.exclusive === exclusiveFilter)
    .filter((r) => {
      if (followUpFilter === "overdue") return r.nextFollowUp && r.nextFollowUp < today;
      if (followUpFilter === "upcoming") return r.nextFollowUp && r.nextFollowUp >= today && r.nextFollowUp <= in7days;
      return true;
    })
    .filter((r) => {
      if (!search) return true;
      return Object.values(r).some((v) => String(v).toLowerCase().includes(search.toLowerCase()));
    });

  return (
    <div>
      {/* ─ Filters bar ─ */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, padding: "4px 12px", flex: "1 1 200px" }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: "#aaa", marginRight: 8 }}></i>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search distributors…"
            style={{ border: "none", outline: "none", fontSize: "0.9rem", width: "100%", background: "transparent" }}
          />
        </div>

        {/* State */}
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
          style={{ border: "1.5px solid #ddd", borderRadius: 8, padding: "6px 10px", fontSize: "0.85rem", color: stateFilter !== "all" ? "#4361ee" : "#555" }}>
          <option value="all">All States</option>
          {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Region */}
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
          style={{ border: "1.5px solid #ddd", borderRadius: 8, padding: "6px 10px", fontSize: "0.85rem", color: regionFilter !== "all" ? "#4361ee" : "#555" }}>
          <option value="all">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Exclusive */}
        <select value={exclusiveFilter} onChange={(e) => setExclusiveFilter(e.target.value)}
          style={{ border: "1.5px solid #ddd", borderRadius: 8, padding: "6px 10px", fontSize: "0.85rem", color: exclusiveFilter !== "all" ? "#4361ee" : "#555" }}>
          <option value="all">All Types</option>
          <option value="Yes">Exclusive</option>
          <option value="No">Non-Exclusive</option>
        </select>

        {/* Follow-up */}
        <select value={followUpFilter} onChange={(e) => setFollowUpFilter(e.target.value)}
          style={{ border: "1.5px solid #ddd", borderRadius: 8, padding: "6px 10px", fontSize: "0.85rem", color: followUpFilter !== "all" ? "#ef233c" : "#555" }}>
          <option value="all">All Follow-ups</option>
          <option value="overdue">⚠ Overdue</option>
          <option value="upcoming">📅 Next 7 Days</option>
        </select>

        {/* Result count */}
        <span style={{ fontSize: "0.8rem", color: "#999", whiteSpace: "nowrap" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ─ Table ─ */}
      <div style={{ overflowX: "auto", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", color: "#fff" }}>
              <th style={{ ...th, padding: "12px 14px" }}>#</th>
              <th style={{ ...th, padding: "12px 14px" }}>Distributor</th>
              <th style={{ ...th, padding: "12px 14px" }} className="hide-mobile">State / Region</th>
              <th style={{ ...th, padding: "12px 14px" }} className="hide-mobile">Contact</th>
              <th style={{ ...th, padding: "12px 14px" }} className="hide-mobile">Team</th>
              <th style={{ ...th, padding: "12px 14px" }}>Status</th>
              <th style={{ ...th, padding: "12px 14px" }} className="hide-mobile">Next Follow-up</th>
              <th style={{ ...th, padding: "12px 14px", textAlign: "center" }}>Customers</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#aaa" }}>No distributors found.</td></tr>
            ) : (
              filtered.map((rec, i) => {
                const overdue = rec.nextFollowUp && rec.nextFollowUp < today;
                return (
                  <tr
                    key={rec.id}
                    onClick={() => setViewDist(rec)}
                    style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer", transition: "background 0.1s", position: "relative" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f7f9ff"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}
                  >
                    <td style={{ ...td, padding: "12px 14px" }}>
                      {/* Priority ribbon */}
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0, width: 5, borderRadius: "0 4px 4px 0",
                        background: rec.exclusive === "Yes" ? "#ffd700" : "#e0e0e0"
                      }} />
                      <span style={{ marginLeft: 10 }}>{i + 1}</span>
                    </td>
                    <td style={{ ...td, padding: "12px 14px" }}>
                      <div style={{ fontWeight: 600, color: "#1a1a2e" }}>{highlight(rec.distributorName, search)}</div>
                      <div style={{ fontSize: "0.75rem", color: "#888" }}>{rec.exclusive === "Yes" && <span style={{ color: "#b8860b" }}>★ Exclusive</span>}</div>
                    </td>
                    <td style={{ ...td, padding: "12px 14px" }} className="hide-mobile">
                      <div>{highlight(rec.state, search)}</div>
                      {rec.region && <div style={{ fontSize: "0.75rem", color: "#888" }}>{rec.region}</div>}
                    </td>
                    <td style={{ ...td, padding: "12px 14px" }} className="hide-mobile">
                      <div style={{ fontWeight: 500 }}>{highlight(rec.contactPersonName, search)}</div>
                      <div style={{ fontSize: "0.78rem", color: "#666" }}>{highlight(rec.contactNumber, search)}</div>
                    </td>
                    <td style={{ ...td, padding: "12px 14px", textAlign: "center" }} className="hide-mobile">
                      {rec.teamSize || "—"}
                    </td>
                    <td style={{ ...td, padding: "12px 14px" }}>
                      <span style={{
                        background: getStatusColor(rec.currentStatus), borderRadius: 20,
                        padding: "3px 12px", fontSize: "0.78rem", fontWeight: 600, whiteSpace: "nowrap"
                      }}>
                        {highlight(rec.currentStatus, search)}
                      </span>
                    </td>
                    <td style={{
                      ...td, padding: "12px 14px",
                      background: overdue ? "#fff0f0" : ""
                    }} className="hide-mobile">
                      {overdue && <i className="fa-solid fa-circle-exclamation" style={{ color: "#ef233c", marginRight: 4 }} />}
                      {highlight(rec.nextFollowUp, search) || "—"}
                    </td>
                    <td style={{ ...td, padding: "12px 14px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      <CustomerRow distributorId={rec.id} companyId={companyId} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* View / Edit modal */}
      {viewDist && (
        <ViewDistributorModal
          distributor={viewDist}
          companyId={companyId}
          isAdmin={isAdmin}
          onClose={() => setViewDist(null)}
          onUpdated={() => { setViewDist(null); onUpdated(); }}
        />
      )}
    </div>
  );
};

export default DistributorTable;
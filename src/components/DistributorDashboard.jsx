import { useMemo } from "react";

const STATUSES = ["Contacted","To Follow Up","Agreement Sent","Agreement Signed","Doing Sales","Inactive","Terminated"];

const statusColors = {
  "Contacted": "#a3c9f1",
  "To Follow Up": "#fff3b0",
  "Agreement Sent": "#d2b7e5",
  "Agreement Signed": "#b0eacb",
  "Doing Sales": "#b2f2bb",
  "Inactive": "#ffd8a8",
  "Terminated": "#f5b7b1",
};

const DistributorDashboard = ({ records, selectedStatus, setSelectedStatus }) => {
  const today = new Date().toISOString().split("T")[0];

  const stats = useMemo(() => {
    const bySt = {};
    STATUSES.forEach((s) => (bySt[s] = 0));
    let overdue = 0;
    const stateSet = new Set();
    let activeWithFollowUp = 0;

    records.forEach((r) => {
      if (bySt[r.currentStatus] !== undefined) bySt[r.currentStatus]++;
      if (r.nextFollowUp && r.nextFollowUp < today) overdue++;
      if (r.state) stateSet.add(r.state);
      if (r.currentStatus === "Doing Sales") activeWithFollowUp++;
    });

    return { bySt, overdue, statesCount: stateSet.size, total: records.length, activeWithFollowUp };
  }, [records, today]);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Top KPI row */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <KPICard label="Total Distributors" value={stats.total} icon="fa-handshake" color="#4361ee" />
        <KPICard label="States Covered" value={stats.statesCount} icon="fa-map-location-dot" color="#7209b7" />
        <KPICard label="Actively Selling" value={stats.bySt["Doing Sales"]} icon="fa-chart-line" color="#06d6a0" />
        <KPICard label="Overdue Follow-ups" value={stats.overdue} icon="fa-triangle-exclamation" color={stats.overdue > 0 ? "#ef233c" : "#aaa"} />
      </div>

      {/* Status pills */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "#888", marginRight: 4 }}>Filter by Status:</span>
        <button
          onClick={() => setSelectedStatus("all")}
          style={{
            border: selectedStatus === "all" ? "2px solid #4361ee" : "2px solid #e0e0e0",
            background: selectedStatus === "all" ? "#4361ee" : "#fff",
            color: selectedStatus === "all" ? "#fff" : "#555",
            borderRadius: 20, padding: "3px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s"
          }}
        >
          All ({stats.total})
        </button>
        {STATUSES.map((s) => stats.bySt[s] > 0 && (
          <button
            key={s}
            onClick={() => setSelectedStatus(selectedStatus === s ? "all" : s)}
            style={{
              border: selectedStatus === s ? "2px solid #333" : `2px solid ${statusColors[s]}`,
              background: statusColors[s],
              color: "#333",
              borderRadius: 20, padding: "3px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
              boxShadow: selectedStatus === s ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              transition: "all 0.15s"
            }}
          >
            {s} ({stats.bySt[s]})
          </button>
        ))}
      </div>
    </div>
  );
};

const KPICard = ({ label, value, icon, color }) => (
  <div style={{
    background: "#fff", borderRadius: 2, padding: "0.9rem 1.2rem",
    display: "flex", alignItems: "center", gap: "0.9rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)", flex: "1 1 140px", minWidth: 140,
    borderLeft: `4px solid ${color}`
  }}>
    <div style={{ background: color + "20", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <i className={`fa-solid ${icon}`} style={{ color, fontSize: "1rem" }}></i>
    </div>
    <div>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1a1a2e", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "#888", marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

export default DistributorDashboard;
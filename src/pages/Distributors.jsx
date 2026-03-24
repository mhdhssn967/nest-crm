import { useState, useEffect } from "react";
import { fetchDistributors } from "../services/fetchDistributors";
import { isAdmin } from "../services/fetchNames";
import AddDistributorModal from "../components/AddDistributorModal";
import DistributorSlip from "../components/DistributorSlip";
import OQ from "../assets/OQ.png";
import "./Distributors.css";

const STATUS_COLORS = {
  "Contacted": "#a3c9f1",
  "To Follow Up": "#fff3b0",
  "Agreement Sent": "#d2b7e5",
  "Agreement Signed": "#b0eacb",
  "Doing Sales": "#b2f2bb",
  "Inactive": "#ffd8a8",
  "Terminated": "#f5b7b1",
};

const REGION_ICONS = {
  "North": "🏔️",
  "South": "🌴",
  "East": "🌅",
  "West": "🌊",
  "North-East": "🍃",
  "Central": "🏛️",
  "Unknown": "📍",
};

const groupByRegion = (records) => {
  const groups = {};
  records.forEach((r) => {
    const region = r.region?.trim() || "Unknown";
    if (!groups[region]) groups[region] = [];
    groups[region].push(r);
  });
  // Sort regions alphabetically, Unknown last
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    return a.localeCompare(b);
  });
};

const StatusDot = ({ status }) => (
  <span
    style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: STATUS_COLORS[status] || "#ccc",
      border: "1px solid rgba(0,0,0,0.15)",
      flexShrink: 0,
    }}
  />
);

const RegionCard = ({ region, distributors, companyId, isAdmin, onUpdated }) => {
  const [open, setOpen] = useState(false);

  const doingSales = distributors.filter((d) => d.currentStatus === "Doing Sales").length;
  const active = distributors.filter((d) => !["Inactive", "Terminated"].includes(d.currentStatus)).length;

  return (
    <div className={`region-card ${open ? "region-card--open" : ""}`}>
      {/* Region Header */}
      <button className="region-header" onClick={() => setOpen((p) => !p)}>
        <div className="region-header__left">
          <span className="region-icon">{REGION_ICONS[region] || "📍"}</span>
          <div>
            <div className="region-name">{region}</div>
            <div className="region-meta">
              {distributors.length} distributor{distributors.length !== 1 ? "s" : ""}
              {doingSales > 0 && (
                <span className="region-badge region-badge--sales">{doingSales} active sales</span>
              )}
              {active < distributors.length && (
                <span className="region-badge region-badge--inactive">
                  {distributors.length - active} inactive
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="region-header__right">
          {/* Mini status bar */}
          <div className="region-status-pills">
            {Object.entries(
              distributors.reduce((acc, d) => {
                const s = d.currentStatus || "Unknown";
                acc[s] = (acc[s] || 0) + 1;
                return acc;
              }, {})
            ).map(([status, count]) => (
              <span
                key={status}
                className="region-status-pill"
                style={{ background: STATUS_COLORS[status] || "#ddd" }}
              >
                {count} {status}
              </span>
            ))}
          </div>
          <span className={`region-chevron ${open ? "region-chevron--open" : ""}`}>
            <i className="fa-solid fa-chevron-down"></i>
          </span>
        </div>
      </button>

      {/* Distributor Slips */}
      {open && (
        <div className="region-body">
          {distributors.map((d) => (
            <DistributorSlip
              key={d.id}
              distributor={d}
              companyId={companyId}
              isAdmin={isAdmin}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Distributors = ({ currentUser, companyId, employeeName }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [checkAdmin, setCheckAdmin] = useState(false);
  const [search, setSearch] = useState("");

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

  const triggerRefresh = () => setRefresh((p) => !p);

  const filtered = search.trim()
    ? records.filter(
        (r) =>
          r.distributorName?.toLowerCase().includes(search.toLowerCase()) ||
          r.state?.toLowerCase().includes(search.toLowerCase()) ||
          r.contactPersonName?.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  const grouped = groupByRegion(filtered);

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
      <div className="dist-header">
        <div>
          <h4 className="dist-title">
            <i className="fa-solid fa-handshake me-2" style={{ color: "#4361ee" }}></i>
            Distributors
          </h4>
          <p className="dist-subtitle">
            {records.length} distributors across {grouped.length} region{grouped.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="dist-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search distributors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <AddDistributorModal
            companyId={companyId}
            employeeName={employeeName}
            onAdded={triggerRefresh}
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="dist-empty">
          <i className="fa-solid fa-handshake" style={{ fontSize: "2.5rem", color: "#ddd" }}></i>
          <p>No distributors found.</p>
        </div>
      ) : (
        <div className="region-list">
          {grouped.map(([region, distributors]) => (
            <RegionCard
              key={region}
              region={region}
              distributors={distributors}
              companyId={companyId}
              isAdmin={checkAdmin}
              onUpdated={triggerRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Distributors;
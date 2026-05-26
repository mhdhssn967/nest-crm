import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Spinner, Form } from "react-bootstrap";
import { fetchCRMRecords, fetchAllEmployees } from "../services/fetchRecords";
import { fetchDistributors } from "../services/fetchDistributors";
import "./Analytics.css";

const parseDate = (item) => {
  if (item.createdAt) {
    if (typeof item.createdAt.toDate === "function") {
      return item.createdAt.toDate();
    }
    const d = new Date(item.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.date) {
    const d = new Date(item.date);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.lastMeetingDate) {
    const d = new Date(item.lastMeetingDate);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const Analytics = ({ companyId, currentUser }) => {
  // --- States ---
  const [crmRecords, setCrmRecords] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activePreset, setActivePreset] = useState("6m");

  // Multi-Select Employee Filters
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [viewMode, setViewMode] = useState("aggregated"); // 'aggregated' or 'breakdown'

  // Ref for handling click-outside to dismiss dropdown
  const dropdownRef = useRef(null);

  // Chart representation style (area, bar, line)
  const [chartType, setChartType] = useState("area");

  // Initialize dates: default to last 6 months
  useEffect(() => {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    setFromDate(sixMonthsAgo.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  }, []);

  // Dismiss employee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Fetch Data ---
  useEffect(() => {
    const loadData = async () => {
      if (!companyId || !currentUser) return;
      setLoading(true);
      try {
        const userId = currentUser.uid || currentUser;
        const [recordsData, distsData, employeesData] = await Promise.all([
          fetchCRMRecords(companyId, userId),
          fetchDistributors(companyId, userId),
          fetchAllEmployees(companyId),
        ]);
        
        const emps = employeesData || [];
        setCrmRecords(recordsData || []);
        setDistributors(distsData || []);
        setEmployees(emps);
        
        // Default: select ALL employees + Admin
        setSelectedEmployeeIds([companyId, ...emps.map(e => e.uid)]);
      } catch (err) {
        console.error("Error loading analytics data:", err);
        setError("Failed to load analytics details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [companyId, currentUser]);

  // Total roster list (Admin + Employees)
  const totalRoster = useMemo(() => {
    return [
      { uid: companyId, empName: "Company Admin / Owner" },
      ...employees
    ];
  }, [companyId, employees]);

  // --- Preset Handlers ---
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const today = new Date();
    let start = new Date();

    if (preset === "3m") {
      start.setMonth(today.getMonth() - 3);
    } else if (preset === "6m") {
      start.setMonth(today.getMonth() - 6);
    } else if (preset === "ytd") {
      start = new Date(today.getFullYear(), 0, 1);
    } else if (preset === "all") {
      let oldest = new Date();
      oldest.setFullYear(oldest.getFullYear() - 1);

      crmRecords.forEach((r) => {
        const d = parseDate(r);
        if (d && d < oldest) oldest = d;
      });
      distributors.forEach((d) => {
        const dt = parseDate(d);
        if (dt && dt < oldest) oldest = dt;
      });

      oldest.setDate(oldest.getDate() - 1);
      start = oldest;
    }

    setFromDate(start.toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
  };

  // --- Date Range Calculations ---
  const dateRange = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [fromDate, toDate]);

  // --- Helper to build Month-Series template ---
  const createMonthSeries = (start, end) => {
    const series = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const limit = new Date(end.getFullYear(), end.getMonth(), 1);

    let safety = 0;
    while (current <= limit && safety < 120) {
      safety++;
      const monthKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = current.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      series.push({
        monthKey,
        label,
        leads: 0,
        distributors: 0,
      });

      current.setMonth(current.getMonth() + 1);
    }
    return series;
  };

  // --- Filter and Process Dataset by List of UIDs ---
  const processDatasetForEmployeeList = (targetIds) => {
    if (!dateRange || targetIds.length === 0) {
      return { series: [], leadsTotal: 0, distsTotal: 0, avgLeads: 0, avgDists: 0 };
    }
    const { start, end } = dateRange;

    // Filter CRM records matching the target list of UIDs
    const filteredLeads = crmRecords.filter((item) => {
      const dateObj = parseDate(item);
      const dateInRange = dateObj && dateObj >= start && dateObj <= end;
      if (!dateInRange) return false;

      return targetIds.includes(item.associate);
    });

    // Filter Distributors matching the target list of UIDs
    const filteredDists = distributors.filter((item) => {
      const dateObj = parseDate(item);
      const dateInRange = dateObj && dateObj >= start && dateObj <= end;
      if (!dateInRange) return false;

      return targetIds.includes(item.addedBy);
    });

    // Populate timeline series
    const series = createMonthSeries(start, end);

    filteredLeads.forEach((lead) => {
      const dateObj = parseDate(lead);
      if (dateObj) {
        const leadKey = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}`;
        const target = series.find((m) => m.monthKey === leadKey);
        if (target) target.leads += 1;
      }
    });

    filteredDists.forEach((dist) => {
      const dateObj = parseDate(dist);
      if (dateObj) {
        const distKey = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}`;
        const target = series.find((m) => m.monthKey === distKey);
        if (target) target.distributors += 1;
      }
    });

    const monthsCount = series.length || 1;
    const leadsTotal = filteredLeads.length;
    const distsTotal = filteredDists.length;

    return {
      series,
      leadsTotal,
      distsTotal,
      avgLeads: (leadsTotal / monthsCount).toFixed(1),
      avgDists: (distsTotal / monthsCount).toFixed(1),
    };
  };

  // --- Dynamic calculations for Aggregated Selected list ---
  const aggregatedStats = useMemo(() => {
    return processDatasetForEmployeeList(selectedEmployeeIds);
  }, [crmRecords, distributors, selectedEmployeeIds, dateRange]);

  // --- Dynamic calculations for Breakdown (one below another) list ---
  const breakdownDatasets = useMemo(() => {
    if (viewMode !== "breakdown" || !dateRange) return [];

    return totalRoster
      .filter((emp) => selectedEmployeeIds.includes(emp.uid)) // Only process selected employees
      .map((emp) => {
        const metrics = processDatasetForEmployeeList([emp.uid]);
        return {
          employee: emp,
          metrics,
        };
      })
      .filter((item) => item.metrics.leadsTotal > 0 || item.metrics.distsTotal > 0); // Only show active context
  }, [crmRecords, distributors, totalRoster, selectedEmployeeIds, viewMode, dateRange]);

  // --- Dynamic calculations for the Cross-Tab Table Grid ---
  const tableData = useMemo(() => {
    if (!dateRange || !fromDate || !toDate) return { months: [], rows: [] };
    const { start, end } = dateRange;

    // 1. Generate months list between start and end
    const monthsList = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const limit = new Date(end.getFullYear(), end.getMonth(), 1);
    let safety = 0;
    while (current <= limit && safety < 120) {
      safety++;
      const monthKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`;
      const label = current.toLocaleString("en-US", { month: "short", year: "numeric" });
      monthsList.push({ monthKey, label });
      current.setMonth(current.getMonth() + 1);
    }

    // 2. Build rows only for checked employees
    const rows = totalRoster
      .filter((emp) => selectedEmployeeIds.includes(emp.uid))
      .map((emp) => {
        // Filter leads & distributors for this individual employee
        const empLeads = crmRecords.filter((item) => {
          const dateObj = parseDate(item);
          return dateObj && dateObj >= start && dateObj <= end && item.associate === emp.uid;
        });

        const empDists = distributors.filter((item) => {
          const dateObj = parseDate(item);
          return dateObj && dateObj >= start && dateObj <= end && item.addedBy === emp.uid;
        });

        // Count per month
        const monthlyCounts = {};
        monthsList.forEach((m) => {
          monthlyCounts[m.monthKey] = { leads: 0, distributors: 0 };
        });

        empLeads.forEach((lead) => {
          const dateObj = parseDate(lead);
          if (dateObj) {
            const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
            if (monthlyCounts[key]) monthlyCounts[key].leads += 1;
          }
        });

        empDists.forEach((dist) => {
          const dateObj = parseDate(dist);
          if (dateObj) {
            const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
            if (monthlyCounts[key]) monthlyCounts[key].distributors += 1;
          }
        });

        return {
          uid: emp.uid,
          name: emp.empName,
          supervisor: emp.empSuperVisor || "",
          monthlyCounts,
          totalLeads: empLeads.length,
          totalDists: empDists.length,
        };
      });

    return { months: monthsList, rows };
  }, [crmRecords, distributors, totalRoster, selectedEmployeeIds, dateRange, fromDate, toDate]);

  // --- Quick Toggle Handlers ---
  const selectAllEmployees = () => {
    setSelectedEmployeeIds(totalRoster.map((e) => e.uid));
  };

  const deselectAllEmployees = () => {
    setSelectedEmployeeIds([]);
  };

  const toggleEmployeeSelection = (uid) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
        }}
      >
        <Spinner animation="border" style={{ color: "#4f46e5", width: "3rem", height: "3rem" }} />
        <p style={{ marginTop: "1rem", color: "#64748b", fontWeight: 600 }}>Analyzing CRM Growth Trends...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page text-center py-5">
        <div className="alert alert-danger mx-auto" style={{ maxWidth: "500px" }}>
          <i className="fa-solid fa-triangle-exclamation me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  // --- Helper to render a single Dual-Chart Block ---
  const renderChartBlock = (titlePrefix, metrics, uniqueId) => {
    const { series, leadsTotal, distsTotal, avgLeads, avgDists } = metrics;
    
    // Performance threshold limits (spikes vs fumbles)
    const leadsThreshold = parseFloat(avgLeads) || 0;
    const distsThreshold = parseFloat(avgDists) || 0;

    // Custom Dot Generator for Area & Line graphs (Red/Green based on threshold fumbles)
    const renderCustomDot = (dataKey, threshold) => (props) => {
      const { cx, cy, payload } = props;
      if (cx === undefined || cy === undefined) return null;
      const val = payload[dataKey];
      const isSpike = val >= threshold;
      const dotColor = isSpike ? "#10b981" : "#ef4444";
      return (
        <circle
          cx={cx}
          cy={cy}
          r={5}
          stroke={dotColor}
          strokeWidth={2.5}
          fill="#ffffff"
          key={`dot-${dataKey}-${payload.monthKey}`}
        />
      );
    };

    return (
      <div className="charts-grid-row" key={uniqueId} style={{ marginBottom: "2rem" }}>
        {/* Graph 1: Client Leads Added */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h5 className="chart-card-title">
              <i className="fa-solid fa-users" style={{ color: "#1e293b" }}></i>
              {titlePrefix} Leads Monthly Performance
            </h5>
            <span className="chart-tag" style={{ background: "#e2e8f0", color: "#475569" }}>
              Avg Target: {avgLeads}
            </span>
          </div>

          <div className="chart-container-wrap">
            {series.length === 0 ? (
              <div className="chart-empty-state">
                <i className="fa-solid fa-chart-pie"></i>
                <p>No lead history found in this date range.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`colorLeads-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id={`strokeLeads-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        borderRadius: "10px",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                      labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke={`url(#strokeLeads-${uniqueId})`}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={`url(#colorLeads-${uniqueId})`}
                      dot={renderCustomDot("leads", leadsThreshold)}
                      name="Leads Added"
                    />
                  </AreaChart>
                ) : chartType === "bar" ? (
                  <BarChart data={series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        borderRadius: "10px",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="leads" radius={[4, 4, 0, 0]} name="Leads Added" barSize={30}>
                      {series.map((entry, idx) => {
                        const isSpike = entry.leads >= leadsThreshold;
                        return (
                          <Cell
                            key={`cell-leads-${idx}`}
                            fill={isSpike ? "#10b981" : "#ef4444"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`strokeLeadsLine-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        borderRadius: "10px",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke={`url(#strokeLeadsLine-${uniqueId})`}
                      strokeWidth={3.5}
                      dot={renderCustomDot("leads", leadsThreshold)}
                      activeDot={{ r: 6 }}
                      name="Leads Added"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Graph 2: Distributors Signed */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h5 className="chart-card-title">
              <i className="fa-solid fa-handshake" style={{ color: "#1e293b" }}></i>
              {titlePrefix} Distributors Performance
            </h5>
            <span className="chart-tag" style={{ background: "#e2e8f0", color: "#475569" }}>
              Avg Target: {avgDists}
            </span>
          </div>

          <div className="chart-container-wrap">
            {series.length === 0 ? (
              <div className="chart-empty-state">
                <i className="fa-solid fa-chart-pie"></i>
                <p>No distributor history found in this date range.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`colorDists-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id={`strokeDists-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        borderRadius: "10px",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                      labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="distributors"
                      stroke={`url(#strokeDists-${uniqueId})`}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill={`url(#colorDists-${uniqueId})`}
                      dot={renderCustomDot("distributors", distsThreshold)}
                      name="Distributors Signed"
                    />
                  </AreaChart>
                ) : chartType === "bar" ? (
                  <BarChart data={series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        borderRadius: "10px",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="distributors" radius={[4, 4, 0, 0]} name="Distributors Signed" barSize={30}>
                      {series.map((entry, idx) => {
                        const isSpike = entry.distributors >= distsThreshold;
                        return (
                          <Cell
                            key={`cell-dists-${idx}`}
                            fill={isSpike ? "#10b981" : "#ef4444"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={series} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`strokeDistsLine-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        borderRadius: "10px",
                        color: "#fff",
                        border: "none",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="distributors"
                      stroke={`url(#strokeDistsLine-${uniqueId})`}
                      strokeWidth={3.5}
                      dot={renderCustomDot("distributors", distsThreshold)}
                      activeDot={{ r: 6 }}
                      name="Distributors Signed"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-title-area">
          <h4>
            <i className="fa-solid fa-chart-line"></i> CRM Growth Analytics
          </h4>
          <p>Analyze and compare lead acquisitions against distributor expansion milestones</p>
        </div>
      </div>

      {/* Advanced Toolbar Filters */}
      <div className="analytics-filters-card">
        <div className="filter-title">
          <i className="fa-solid fa-sliders"></i> Filter Parameters
        </div>
        <div className="filter-inputs-row">
          {/* Custom Date Pickers */}
          <div className="date-input-group">
            <label>From Date</label>
            <input
              type="date"
              className="date-picker-custom"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setActivePreset("");
              }}
            />
          </div>

          <div className="date-input-group">
            <label>To Date</label>
            <input
              type="date"
              className="date-picker-custom"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setActivePreset("");
              }}
            />
          </div>

          {/* Quick Presets */}
          <div className="date-input-group" style={{ flex: "2", minWidth: "260px" }}>
            <label>Quick Presets</label>
            <div className="preset-buttons">
              <button
                className={`btn-preset ${activePreset === "3m" ? "active" : ""}`}
                onClick={() => applyPreset("3m")}
              >
                3 Months
              </button>
              <button
                className={`btn-preset ${activePreset === "6m" ? "active" : ""}`}
                onClick={() => applyPreset("6m")}
              >
                6 Months
              </button>
              <button
                className={`btn-preset ${activePreset === "ytd" ? "active" : ""}`}
                onClick={() => applyPreset("ytd")}
              >
                YTD
              </button>
              <button
                className={`btn-preset ${activePreset === "all" ? "active" : ""}`}
                onClick={() => applyPreset("all")}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Multi-Select Employee Dropdown Box */}
          {employees.length > 0 && (
            <div className="date-input-group" style={{ minWidth: "220px", position: "relative" }} ref={dropdownRef}>
              <label>Employee Context</label>
              <button
                type="button"
                className="date-picker-custom text-start d-flex justify-content-between align-items-center"
                style={{ background: "#ffffff", width: "100%", cursor: "pointer", border: "1.5px solid #cbd5e1" }}
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                <span style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>
                  👤 {
                    selectedEmployeeIds.length === 0
                      ? "None selected"
                      : selectedEmployeeIds.length === totalRoster.length
                      ? "All Employees selected"
                      : `${selectedEmployeeIds.length} Selected`
                  }
                </span>
                <i className={`fa-solid fa-chevron-${showEmployeeDropdown ? "up" : "down"}`} style={{ fontSize: "0.75rem", color: "#64748b" }}></i>
              </button>

              {showEmployeeDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    zIndex: 100,
                    maxHeight: "280px",
                    overflowY: "auto",
                    padding: "0.75rem",
                    marginTop: "4px"
                  }}
                >
                  <div className="d-flex justify-content-between mb-2 pb-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <button
                      type="button"
                      style={{ border: "none", background: "none", fontSize: "0.75rem", fontWeight: 700, color: "#4f46e5", padding: 0 }}
                      onClick={selectAllEmployees}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      style={{ border: "none", background: "none", fontSize: "0.75rem", fontWeight: 700, color: "#ef4444", padding: 0 }}
                      onClick={deselectAllEmployees}
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Company Owner Checkbox */}
                  <label className="d-flex align-items-center gap-2 mb-2 p-1 rounded hover-item" style={{ cursor: "pointer", fontSize: "0.82rem" }}>
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(companyId)}
                      onChange={() => toggleEmployeeSelection(companyId)}
                      style={{ width: "16px", height: "16px", accentColor: "#4f46e5" }}
                    />
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>Company Admin / Owner</span>
                  </label>

                  {/* Employee Checkboxes */}
                  {employees.map((emp) => (
                    <label key={emp.uid} className="d-flex align-items-center gap-2 mb-2 p-1 rounded hover-item" style={{ cursor: "pointer", fontSize: "0.82rem" }}>
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(emp.uid)}
                        onChange={() => toggleEmployeeSelection(emp.uid)}
                        style={{ width: "16px", height: "16px", accentColor: "#4f46e5" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 500, color: "#334155" }}>{emp.empName}</span>
                        {emp.empSuperVisor && <span style={{ fontSize: "0.68rem", color: "#64748b" }}>SV: {emp.empSuperVisor}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aggregation Mode Selector (Only visible if multi-select active) */}
          {selectedEmployeeIds.length > 0 && employees.length > 0 && (
            <div className="date-input-group" style={{ minWidth: "200px" }}>
              <label>Aggregation Mode</label>
              <Form.Select
                className="date-picker-custom"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="aggregated">Aggregated View (Single Graph)</option>
                <option value="breakdown">Breakdown View (One Below Another)</option>
              </Form.Select>
            </div>
          )}

          {/* Visual Style Toggles */}
          <div className="date-input-group" style={{ flex: "0 0 auto" }}>
            <label>Visualization</label>
            <div className="chart-type-toggle">
              <button
                className={`toggle-icon-btn ${chartType === "area" ? "active" : ""}`}
                onClick={() => setChartType("area")}
                title="Area Chart"
              >
                <i className="fa-solid fa-chart-area" style={{ fontSize: "1.05rem" }}></i>
              </button>
              <button
                className={`toggle-icon-btn ${chartType === "bar" ? "active" : ""}`}
                onClick={() => setChartType("bar")}
                title="Bar Chart"
              >
                <i className="fa-solid fa-chart-bar" style={{ fontSize: "1.05rem" }}></i>
              </button>
              <button
                className={`toggle-icon-btn ${chartType === "line" ? "active" : ""}`}
                onClick={() => setChartType("line")}
                title="Line Chart"
              >
                <i className="fa-solid fa-chart-line" style={{ fontSize: "1.05rem" }}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats widgets (based on selected context) */}
      <div className="stats-grid-row">
        <div className="kpi-card leads-card">
          <div className="kpi-header">
            <span className="kpi-label">Leads Added</span>
            <div className="kpi-icon-wrap">
              <i className="fa-solid fa-user-plus"></i>
            </div>
          </div>
          <div className="kpi-value">{aggregatedStats?.leadsTotal || 0}</div>
          <div className="kpi-subtext">Total client prospects registered in range</div>
        </div>

        <div className="kpi-card distributors-card">
          <div className="kpi-header">
            <span className="kpi-label">Distributors Signed</span>
            <div className="kpi-icon-wrap">
              <i className="fa-solid fa-handshake"></i>
            </div>
          </div>
          <div className="kpi-value">{aggregatedStats?.distsTotal || 0}</div>
          <div className="kpi-subtext">Total distribution firms registered in range</div>
        </div>

        <div className="kpi-card avg-leads-card">
          <div className="kpi-header">
            <span className="kpi-label">Leads / Month</span>
            <div className="kpi-icon-wrap">
              <i className="fa-solid fa-users-gear"></i>
            </div>
          </div>
          <div className="kpi-value">{aggregatedStats?.avgLeads || 0}</div>
          <div className="kpi-subtext">Average prospects added per month</div>
        </div>

        <div className="kpi-card avg-dist-card">
          <div className="kpi-header">
            <span className="kpi-label">Distributors / Month</span>
            <div className="kpi-icon-wrap">
              <i className="fa-solid fa-truck-ramp-box"></i>
            </div>
          </div>
          <div className="kpi-value">{aggregatedStats?.avgDists || 0}</div>
          <div className="kpi-subtext">Average network partners added per month</div>
        </div>
      </div>

      {/* Primary Visual rendering content block */}
      {selectedEmployeeIds.length === 0 ? (
        <div className="chart-card text-center py-5">
          <i
            className="fa-solid fa-users-slash"
            style={{ fontSize: "3rem", color: "#cbd5e1", marginBottom: "1rem" }}
          ></i>
          <h5 style={{ color: "#64748b" }}>No Employees Checked</h5>
          <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
            Please check at least one employee in the Employee Context dropdown to show growth trends.
          </p>
        </div>
      ) : viewMode === "aggregated" ? (
        // --- Aggregated (Combined) View for all selected employees ---
        renderChartBlock("Selected Employees'", aggregatedStats, "aggregated")
      ) : (
        // --- Breakdown (one below another) View for checked employees ---
        <div className="employee-breakdown-list">
          {breakdownDatasets.length === 0 ? (
            <div className="chart-card text-center py-5">
              <i
                className="fa-solid fa-chart-column"
                style={{ fontSize: "3rem", color: "#cbd5e1", marginBottom: "1rem" }}
              ></i>
              <h5 style={{ color: "#64748b" }}>No Activity Found</h5>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                None of the selected employees have registered any additions inside the selected date range.
              </p>
            </div>
          ) : (
            breakdownDatasets.map((row) => (
              <div
                key={row.employee.uid}
                style={{
                  background: "#f8fafc",
                  padding: "1.25rem",
                  borderRadius: "16px",
                  border: "1.5px solid #e2e8f0",
                  marginBottom: "2.25rem",
                }}
              >
                {/* Employee Breakdown Card Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                  }}
                >
                  <h6
                    style={{
                      margin: 0,
                      fontWeight: 800,
                      color: "#1e293b",
                      fontSize: "1.05rem",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-circle-user" style={{ color: "#4f46e5" }}></i>
                    {row.employee.empName}
                    {row.employee.empSuperVisor && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          fontWeight: 500,
                          background: "#e2e8f0",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        Supervisor: {row.employee.empSuperVisor}
                      </span>
                    )}
                  </h6>

                  <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem", fontWeight: 700 }}>
                    <span style={{ color: "#0d9488", background: "#ccfbf1", padding: "3px 8px", borderRadius: "6px" }}>
                      Leads: {row.metrics.leadsTotal}
                    </span>
                    <span style={{ color: "#7c3aed", background: "#f3e8ff", padding: "3px 8px", borderRadius: "6px" }}>
                      Distributors: {row.metrics.distsTotal}
                    </span>
                  </div>
                </div>

                {/* The dynamic charts, stacked one below another */}
                {renderChartBlock(
                  `${row.employee.empName.split(" ")[0]}'s`,
                  row.metrics,
                  row.employee.uid
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Dynamic Performance Matrix Table Grid */}
      <div className="chart-card" style={{ marginTop: "2.5rem", marginBottom: "2rem" }}>
        <div className="chart-card-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
          <h5 className="chart-card-title" style={{ margin: 0 }}>
            <i className="fa-solid fa-table" style={{ color: "#4f46e5" }}></i>
            Employee Performance Matrix Grid
          </h5>
          <p className="text-muted" style={{ fontSize: "0.8rem", margin: 0 }}>
            Cross-tabulated monthly statistics tracking Leads registered (L) and Distributors signed (D) per active employee.
          </p>
        </div>

        {selectedEmployeeIds.length === 0 ? (
          <div className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
            Check employees in the dropdown context to generate grid statistics.
          </div>
        ) : tableData.rows.length === 0 ? (
          <div className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
            No activity records exist for the selected parameters.
          </div>
        ) : (
          <div className="comparison-table-wrapper">
            <table className="table-comparison">
              <thead>
                <tr>
                  <th rowSpan={2} className="emp-col-header">Employee / Associate</th>
                  {tableData.months.map((m) => (
                    <th key={`h-${m.monthKey}`} colSpan={2}>{m.label}</th>
                  ))}
                  <th colSpan={2} style={{ background: "#f1f5f9", fontWeight: 800 }}>Total Summary</th>
                </tr>
                <tr>
                  {tableData.months.map((m) => (
                    <React.Fragment key={`sub-${m.monthKey}`}>
                      <th style={{ fontSize: "0.72rem", borderTop: "none" }}>Leads</th>
                      <th style={{ fontSize: "0.72rem", borderTop: "none" }}>Dists</th>
                    </React.Fragment>
                  ))}
                  <th style={{ fontSize: "0.72rem", background: "#f8fafc", fontWeight: 700 }}>Total Leads</th>
                  <th style={{ fontSize: "0.72rem", background: "#f8fafc", fontWeight: 700 }}>Total Dists</th>
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row) => (
                  <tr key={row.uid}>
                    <td className="emp-cell">
                      <div className="d-flex flex-column">
                        <span style={{ color: "#0f172a", fontWeight: 700 }}>{row.name}</span>
                        {row.supervisor && (
                          <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500 }}>
                            SV: {row.supervisor}
                          </span>
                        )}
                      </div>
                    </td>
                    {tableData.months.map((m) => {
                      const counts = row.monthlyCounts[m.monthKey] || { leads: 0, distributors: 0 };
                      return (
                        <React.Fragment key={`c-${row.uid}-${m.monthKey}`}>
                          <td>
                            <span className={`val-badge leads-val ${counts.leads === 0 ? "zero" : ""}`}>
                              {counts.leads}
                            </span>
                          </td>
                          <td>
                            <span className={`val-badge dists-val ${counts.distributors === 0 ? "zero" : ""}`}>
                              {counts.distributors}
                            </span>
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td style={{ background: "#fcfcfc", fontWeight: 700 }}>
                      <span className={`val-badge leads-val ${row.totalLeads === 0 ? "zero" : ""}`} style={{ fontSize: "0.82rem" }}>
                        {row.totalLeads}
                      </span>
                    </td>
                    <td style={{ background: "#fcfcfc", fontWeight: 700 }}>
                      <span className={`val-badge dists-val ${row.totalDists === 0 ? "zero" : ""}`} style={{ fontSize: "0.82rem" }}>
                        {row.totalDists}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;

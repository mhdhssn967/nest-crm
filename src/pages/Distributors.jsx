import { useState, useEffect } from "react";
import { fetchDistributors } from "../services/fetchDistributors";
import { isAdmin } from "../services/fetchNames";
import DistributorDashboard from "../components/DistributorDashboard";
import DistributorTable from "../components/DistributorTable";
import AddDistributorModal from "../components/AddDistributorModal";
import OQ from "../assets/OQ.png";
import "./Distributors.css";

const Distributors = ({ currentUser, companyId, employeeName }) => {
    console.log(currentUser,companyId,employeeName);
    
    
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [checkAdmin, setCheckAdmin] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");

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
      {/* ─ Page header ─ */}
      <div className="dist-header">
        <div>
          <h4 className="dist-title">
            <i className="fa-solid fa-handshake me-2" style={{ color: "#4361ee" }}></i>
            Distributors
          </h4>
          <p className="dist-subtitle">Manage your distribution network across India</p>
        </div>
        <AddDistributorModal
          companyId={companyId}
          employeeName={employeeName}
          onAdded={triggerRefresh}
        />
      </div>

      {/* ─ Dashboard ─ */}
      <DistributorDashboard
        records={records}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      {/* ─ Table ─ */}
      <DistributorTable
        records={records}
        companyId={companyId}
        isAdmin={checkAdmin}
        onUpdated={triggerRefresh}
        selectedStatus={selectedStatus}
      />
    </div>
  );
};

export default Distributors;
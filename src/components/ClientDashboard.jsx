import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import {
  PeopleFill,
  CurrencyRupee,
  Wallet2,
  HourglassSplit,
} from "react-bootstrap-icons";
import './ClientDashboard.css'

const ClientDashboard = ({ clients }) => {
  const totalClients = clients.length;

  const totalReceivedByClient = (client) =>
    client.received
      ? client.received.reduce((sum, r) => sum + (r.amount || 0), 0)
      : 0;

  const totalReceived = clients.reduce(
    (sum, client) => sum + totalReceivedByClient(client),
    0
  );

  const totalPending = clients.reduce(
    (sum, client) => sum + (client.total - totalReceivedByClient(client)),
    0
  );

  const totalBusiness = clients.reduce((sum, client) => sum + client.total, 0);

  const formatRupees = (amount) => `₹${amount.toLocaleString("en-IN")}`;

  // ------------ MODERN CARD STYLE ------------
  const modernCard = {
    borderRadius: "14px",
    padding: "18px",
    background: "white",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow:
      "0px 2px 6px rgba(0,0,0,0.04), 0px 8px 20px rgba(0,0,0,0.03)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    cursor: "default",
  };

  const title = {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#6c757d",
    marginTop: "6px",
  };

  const value = {
    fontSize: "1.7rem",
    fontWeight: 700,
    color: "#212529",
    marginTop: "4px",
  };

  const iconStyle = {
    fontSize: "1.7rem",
    padding: "10px",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="p-1">
      <Row className="gy-3">

  <Col xs={6} md={3}>
    <Card style={modernCard}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="dash-card">
        <PeopleFill
          size={35}
          style={{ ...iconStyle, background: "rgba(66,133,244,0.12)", color: "#4285F4" }}
        />
        <div className="dash-txt">
          <div style={title}>Total Clients</div>
          <div style={value}>{totalClients}</div>
        </div>
      </div>
    </Card>
  </Col>

  <Col xs={6} md={3}>
    <Card style={modernCard}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="dash-card">
        <CurrencyRupee
          size={35}
          style={{ ...iconStyle, background: "rgba(156,39,176,0.12)", color: "#9C27B0" }}
        />
        <div className="dash-txt">
          <div style={title}>Business Value</div>
          <div style={value}>{formatRupees(totalBusiness)}</div>
        </div>
      </div>
    </Card>
  </Col>

  <Col xs={6} md={3}>
    <Card style={modernCard}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="dash-card">
        <Wallet2
          size={35}
          style={{ ...iconStyle, background: "rgba(0,200,83,0.12)", color: "#00C853" }}
        />
        <div className="dash-txt">
          <div style={title}>Total Received</div>
          <div style={value}>{formatRupees(totalReceived)}</div>
        </div>
      </div>
    </Card>
  </Col>

  <Col xs={6} md={3}>
    <Card style={modernCard}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }} className="dash-card">
        <HourglassSplit
          size={35}
          style={{ ...iconStyle, background: "rgba(255,111,0,0.12)", color: "#FF6F00" }}
        />
        <div className="dash-txt">
          <div style={title}>Total Pending</div>
          <div style={value}>{formatRupees(totalPending)}</div>
        </div>
      </div>
    </Card>
  </Col>

</Row>


    </div>
  );
};

export default ClientDashboard;

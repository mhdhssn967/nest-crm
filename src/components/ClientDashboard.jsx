import React from "react";
import { Card, Row, Col } from "react-bootstrap";

const ClientDashboard = ({ clients }) => {
  // Total number of clients
  const totalClients = clients.length;

  // Helper to get total received by a single client
  const totalReceivedByClient = (client) =>
    client.received
      ? client.received.reduce((sum, r) => sum + (r.amount || 0), 0)
      : 0;

  // Total amount received across all clients
  const totalReceived = clients.reduce(
    (sum, client) => sum + totalReceivedByClient(client),
    0
  );

  // Total pending amount across all clients
  const totalPending = clients.reduce(
    (sum, client) => sum + (client.total - totalReceivedByClient(client)),
    0
  );

  // Total business: sum of all client totals
  const totalBusiness = clients.reduce((sum, client) => sum + client.total, 0);

  const cardStyle = {
    borderRadius: "10px",
    // boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "15px",
    marginBottom: "15px",
    textAlign: "center",
    backgroundColor: "#f8f9fa",
  };

  const valueStyle = {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginTop: "5px",
  };

  const titleStyle = {
    fontSize: "1rem",
    color: "#555",
  };

  const formatRupees = (amount) => `₹${amount.toLocaleString("en-IN")}`;

  return (
    <div className="p-1">
      <Row className="mb-0">
        <Col xs={6} md={3}>
          <Card style={cardStyle}>
            <div style={titleStyle}>Total Clients</div>
            <div style={valueStyle}>{totalClients}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card style={cardStyle}>
            <div style={titleStyle}>Total Received</div>
            <div style={valueStyle}>{formatRupees(totalReceived)}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card style={cardStyle}>
            <div style={titleStyle}>Total Pending</div>
            <div style={valueStyle}>{formatRupees(totalPending)}</div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card style={cardStyle}>
            <div style={titleStyle}>Business Value</div>
            <div style={valueStyle}>{formatRupees(totalBusiness)}</div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ClientDashboard;

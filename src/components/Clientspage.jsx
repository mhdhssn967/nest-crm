// ClientsPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Form, Table } from "react-bootstrap";
import AddClientModal from "./AddClientModal";
import ClientDetailsModal from "./ClientDetailsModal";
import { fetchClients, fetchServices } from "../services/clientServices";
import "./ClientsPage.css";
import ClientDashboard from "./ClientDashboard";

import {
  PersonFill,
  BriefcaseFill,
  CurrencyRupee,
  Wallet2,
  HourglassSplit,
} from "react-bootstrap-icons";
const ClientsPage = ({ companyId }) => {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState("All");
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 🔹 New search state

  // Load clients
  const loadClients = async () => {
    const data = await fetchClients(companyId);
    setClients(data);
  };

  useEffect(() => {
    loadClients();
  }, [companyId, triggerRefresh]);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      const data = await fetchServices(companyId);
      setServices(data);
    };
    loadServices();
  }, [companyId]);

  // Add new client locally
  const handleAddClient = (newClient) => {
    setClients([
      ...clients,
      {
        id: clients.length + 1,
        ...newClient,
      },
    ]);
  };

  // Filtered clients
  const filteredClients = clients
    .filter((c) =>
      selectedService === "All" ? true : c.service === selectedService
    )
    .filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
console.log(filteredClients);

  return (
    <div className="p-4">
      <h2 className="mb-4">Clients Dashboard</h2>

      <div className="d-flex align-items-center mb-3 gap-3 flex-wrap">
        <Button variant="dark" onClick={() => setShowModal(true)}>
          + Add Client
        </Button>

        {/* 🔹 Filter by service */}
        <Form.Select
          style={{ width: "200px" }}
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          <option value="All">All Services</option>
          {services.map((service, idx) => (
            <option key={idx} value={service}>
              {service}
            </option>
          ))}
        </Form.Select>

        {/* 🔹 Search bar */}
        <div style={{display:'flex',alignItems:'center'}}>
            <i className="fa-solid fa-magnifying-glass clients-lens"></i>
            <Form.Control
              type="text"
              placeholder="Search clients..."
              style={{ width: "300px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      <ClientDashboard clients={filteredClients} />
      <hr />

      <Table bordered hover responsive className="modern-table">
  <thead>
    <tr>
      <th>
        <PersonFill size={18} style={{ marginRight: 6 }} />
        Client
      </th>
      <th>
        <BriefcaseFill size={18} style={{ marginRight: 6 }} />
        Service
      </th>
      <th>
        <CurrencyRupee size={18} style={{ marginRight: 6, color: "#6a1b9a" }} />
        Total
      </th>
      <th>
        <Wallet2 size={18} style={{ marginRight: 6, color: "#00a152" }} />
        Received
      </th>
      <th>
        <HourglassSplit
          size={18}
          style={{ marginRight: 6, color: "#ef6c00" }}
        />
        Pending
      </th>
    </tr>
  </thead>

  <tbody>
    {filteredClients.length > 0 ? (
      filteredClients.map((client) => {
        const totalReceived = client.received
          ? client.received.reduce((sum, r) => sum + r.amount, 0)
          : 0;

        const pending = client.total - totalReceived;

        return (
          <tr
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="modern-row"
          >
            <td className="client-name">{client.name}</td>
            <td>{client.service}</td>

            <td className="amount total">
              ₹{client.total.toLocaleString("en-IN")}
            </td>

            <td className="amount received">
              ₹{totalReceived.toLocaleString("en-IN")}
            </td>

            <td className={`amount pending ${pending === 0 ? "zero" : ""}`}>
              {pending !== 0
                ? `₹${pending.toLocaleString("en-IN")}`
                : "-"}
            </td>
          </tr>
        );
      })
    ) : (
      <tr>
        <td colSpan={5} className="text-center py-3">
          No clients found.
        </td>
      </tr>
    )}
  </tbody>
</Table>



      {/* Client Details / Payment History Modal */}
      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onHide={() => setSelectedClient(null)}
          companyId={companyId}
          refreshClients={loadClients}
          services={services}
        />
      )}

      {/* Add Client Modal */}
      <AddClientModal
        companyId={companyId}
        show={showModal}
        onHide={() => setShowModal(false)}
        onAdd={handleAddClient}
        services={services}
        triggerRefresh={triggerRefresh}
        setTriggerRefresh={setTriggerRefresh}
      />
    </div>
  );
};

export default ClientsPage;

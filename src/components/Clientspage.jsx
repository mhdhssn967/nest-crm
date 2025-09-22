// ClientsPage.jsx
import React, { useEffect, useState } from "react";
import { Card, Button, Row, Col, Form } from "react-bootstrap";
import AddClientModal from "./AddClientModal";
import ClientDetailsModal from "./ClientDetailsModal";
import { fetchClients, fetchServices } from "../services/clientServices";
import './ClientsPage.css'
import ClientDashboard from "./ClientDashboard";

const ClientsPage = ({ companyId }) => {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState("All");
  const [triggerRefresh,setTriggerRefresh]=useState(false)

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

  // Filtered clients based on selected service
  const filteredClients =
    selectedService === "All"
      ? clients
      : clients.filter((c) => c.category === selectedService);

  return (
    <div className="p-4">
      <h2 className="mb-4">Clients Dashboard</h2>

      <div className="d-flex align-items-center mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          + Add Client
        </Button>

        <Form.Select
          className="ms-3"
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
      </div>
      <ClientDashboard clients={filteredClients}/>

      <Row>
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const totalReceived = client.received
              ? client.received.reduce((sum, r) => sum + r.amount, 0)
              : 0;
            const pending = client.total - totalReceived;

            return (
              <Col md={3} key={client.id} className="mb-3">
  <Card
    className="client-card"
    onClick={() => setSelectedClient(client)}
    style={{ cursor: "pointer" }}
  >
    {/* Name section with full width background */}
    <div
      className="client-name"

    >
      {client.name}
    </div>

    <Card.Body>
      <Card.Text>
        <strong>Service:</strong> {client.service} <br />
        <strong>Total:</strong> ₹{client.total} <br />
        <strong>Received:</strong> ₹{totalReceived} <br />
        <strong>Pending:</strong> ₹{pending}
      </Card.Text>
    </Card.Body>
  </Card>
</Col>

            );
          })
        ) : (
          <p className="mt-3">No clients found for this service.</p>
        )}
      </Row>

      {/* Client Details / Payment History Modal */}
      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onHide={() => setSelectedClient(null)}
          companyId={companyId}
          refreshClients={loadClients}
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

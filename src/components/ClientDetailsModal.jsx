import React, { useState, useEffect } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { deleteClient, updateClientPayments, updateClientRemarks } from "../services/clientServices";

const ClientDetailsModal = ({ client: initialClient, onHide, companyId, refreshClients }) => {
  const [client, setClient] = useState(initialClient);
  const [newPayment, setNewPayment] = useState({ amount: "", note: "" });
  const [addingPayment, setAddingPayment] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarks, setRemarks] = useState(initialClient?.remarks || "");

  const handleDeleteClient = async (clientId) => {
  if (!window.confirm("Are you sure you want to delete this client?")) return;

  try {
    await deleteClient(companyId, clientId);
    // Remove client locally after deletion
    refreshClients()
    console.log("Client deleted successfully");
  } catch (error) {
    console.error("Error deleting client:", error);
  }
};

  useEffect(() => {
    setClient(initialClient);
    setRemarks(initialClient?.remarks || "");
  }, [initialClient]);

  const totalReceived = client.received
    ? client.received.reduce((sum, r) => sum + r.amount, 0)
    : 0;
  const pending = client.total - totalReceived;

  const handlePaymentChange = (e) => {
    setNewPayment({ ...newPayment, [e.target.name]: e.target.value });
  };

  const addPayment = async () => {
    if (!newPayment.amount) return;

    const paymentObj = {
      amount: parseInt(newPayment.amount),
      note: newPayment.note,
      date: new Date(),
    };

    try {
      setAddingPayment(true);
      await updateClientPayments(companyId, client.id, paymentObj);

      setClient((prev) => ({
        ...prev,
        received: [...(prev.received || []), paymentObj],
      }));

      setNewPayment({ amount: "", note: "" });
      setAddingPayment(false);
      refreshClients();
    } catch (error) {
      console.error("Error adding payment:", error);
      setAddingPayment(false);
    }
  };

  const saveRemarks = async () => {
    try {
      await updateClientRemarks(companyId, client.id, remarks);
      setClient((prev) => ({ ...prev, remarks }));
      setEditingRemarks(false);
      refreshClients();
    } catch (error) {
      console.error("Error updating remarks:", error);
    }
  };

  return (
    <Modal show={!!client} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{client?.name} - Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {client && (
          <>
            <p><strong>Category:</strong> {client.category}</p>
            <p><strong>Total Amount:</strong> ₹{client.total.toLocaleString("en-IN")}</p>
            <p><strong>Pending:</strong> ₹{pending.toLocaleString("en-IN")}</p>

            <hr />
            <h5>Payment History</h5>
            {client.received && client.received.length > 0 ? (
              <ul>
                {client.received.map((r, idx) => (
                  <li key={idx}>
                    ₹{r.amount.toLocaleString("en-IN")} - {r.note || "No note"}{" "}
                    <small>({new Date(r.date).toLocaleDateString()})</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No payments recorded yet.</p>
            )}

            <hr />
            <h5>Add New Payment</h5>
            <InputGroup className="mb-2">
              <Form.Control
                type="number"
                placeholder="Amount"
                name="amount"
                value={newPayment.amount}
                onChange={handlePaymentChange}
              />
              <Form.Control
                type="text"
                placeholder="Note"
                name="note"
                value={newPayment.note}
                onChange={handlePaymentChange}
              />
              <Button variant="secondary" onClick={addPayment} disabled={addingPayment}>
                Add
              </Button>
            </InputGroup>

            <hr />
            <h5>Remarks</h5>
            {editingRemarks ? (
              <>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div className="mt-2 d-flex justify-content-end">
                  <Button variant="success" size="sm" onClick={saveRemarks}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="ms-2"
                    onClick={() => setEditingRemarks(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <p className="mb-0">{client.remarks || "No remarks"}</p>
                <Button variant="outline-primary" size="sm" onClick={() => setEditingRemarks(true)}>
                  Edit
                </Button>
<Button
  variant="danger"
  onClick={(e) => {
    e.stopPropagation(); // prevent opening modal when clicking delete
    handleDeleteClient(client.id);
  }}
>
  Delete
</Button>              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ClientDetailsModal;

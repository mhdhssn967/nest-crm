import React, { useState, useEffect } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import {
  deleteClient,
  updateClientPayments,
  updateClientRemarks,
  updateClientInformation,
} from "../services/clientServices";
import Swal from "sweetalert2";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";


const ClientDetailsModal = ({ client: initialClient, onHide, companyId, refreshClients, services }) => {
  const [client, setClient] = useState(initialClient);
  const [newPayment, setNewPayment] = useState({ amount: "", note: "" });
  const [addingPayment, setAddingPayment] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarks, setRemarks] = useState(initialClient?.remarks || "");
  const [editingClientInfo, setEditingClientInfo] = useState(false);
  const [infoFields, setInfoFields] = useState(
    initialClient?.clientInformation
      ? Object.entries(initialClient.clientInformation).map(([key, value]) => ({ field: key, value }))
      : [{ field: "", value: "" }]
  );
  const [editMode, setEditMode] = useState(false); // Enables all editing

  useEffect(() => {
    setClient(initialClient);
    setRemarks(initialClient?.remarks || "");
    setInfoFields(
      initialClient?.clientInformation
        ? Object.entries(initialClient.clientInformation).map(([key, value]) => ({ field: key, value }))
        : [{ field: "", value: "" }]
    );
  }, [initialClient]);

  const formatDate = (date) => {
    if (!date) return "No date";
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  // Add Payment
  const addPayment = async () => {
    if (!newPayment.amount) return;
    const paymentObj = { amount: parseInt(newPayment.amount), note: newPayment.note, date: new Date() };
    try {
      setAddingPayment(true);
      await updateClientPayments(companyId, client.id, paymentObj);
      setClient((prev) => ({ ...prev, received: [...(prev.received || []), paymentObj] }));
      setNewPayment({ amount: "", note: "" });
      setAddingPayment(false);
      refreshClients();
      Swal.fire({ icon: "success", title: "Payment Added", text: `₹${paymentObj.amount.toLocaleString("en-IN")} added.`, timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error("Error adding payment:", error);
      setAddingPayment(false);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to add payment." });
    }
  };

  // Save Remarks
  const saveRemarks = async () => {
    try {
      await updateClientRemarks(companyId, client.id, remarks);
      setClient((prev) => ({ ...prev, remarks }));
      setEditingRemarks(false);
      refreshClients();
      Swal.fire({ icon: "success", title: "Remarks Updated", timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error(error);
    }
  };

  // Save Client Information
  const saveClientInfo = async () => {
    try {
      const clientInformation = {};
      infoFields.forEach((item) => {
        if (item.field && item.value) clientInformation[item.field] = item.value;
      });
      await updateClientInformation(companyId, client.id, clientInformation);
      setClient((prev) => ({ ...prev, clientInformation }));
      setEditingClientInfo(false);
      refreshClients();
      Swal.fire({ icon: "success", title: "Client Info Updated", timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error(error);
    }
  };

  // Delete Client
  const handleDeleteClient = async (clientId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the client.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteClient(companyId, clientId);
      refreshClients();
      onHide();
      Swal.fire({ icon: "success", title: "Deleted!", timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to delete client." });
    }
  };

  const totalReceived = client.received ? client.received.reduce((sum, r) => sum + r.amount, 0) : 0;
  const pending = client.total - totalReceived;

  return (
    <Modal show={!!client} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>{client?.name} - Details</Modal.Title>
        
      </Modal.Header>
      <Modal.Body>
        {client && (
          <>
            {editMode ? (
  <div className="mb-3">
    <Form.Group>
  <Form.Label>Service</Form.Label>
  <Form.Select
    value={client.service}
    onChange={(e) =>
      setClient((prev) => ({ ...prev, service: e.target.value }))
    }
  >
    {services && services.length > 0 ? (
      services.map((service, idx) => (
        <option key={idx} value={service}>
          {service}
        </option>
      ))
    ) : (
      <option disabled>No services available</option>
    )}
  </Form.Select>
</Form.Group>

    <Form.Group className="mt-2">
      <Form.Label>Total Amount (₹)</Form.Label>
      <Form.Control
        type="number"
        value={client.total}
        onChange={(e) =>
          setClient((prev) => ({
            ...prev,
            total: e.target.value ? parseInt(e.target.value) : 0,
          }))
        }
      />
    </Form.Group>

    <Button
      variant="success"
      size="sm"
      className="mt-2"
      onClick={async () => {
        try {
          // Update in Firestore
          const clientRef = doc(db, "userData", companyId, "clientsData", client.id);
          await updateDoc(clientRef, {
            service: client.service,
            total: client.total,
          });
          Swal.fire({
            icon: "success",
            title: "Updated!",
            text: "Service and Total Amount updated.",
            timer: 1500,
            showConfirmButton: false,
          });
          refreshClients();
        } catch (error) {
          console.error(error);
          Swal.fire({ icon: "error", title: "Error", text: "Failed to update." });
        }
      }}
    >
      Save
    </Button>
  </div>
) : (
  <>
    <p><strong>Service:</strong> {client.service}</p>
    <p><strong>Total Amount:</strong> ₹{client.total.toLocaleString("en-IN")}</p>
  </>
)}
{pending!=0?<p><strong>Pending:</strong> ₹{pending.toLocaleString("en-IN")}</p>:
<p><i className="fa-solid fa-circle-check" style={{color:'#0cb644ff'}} ></i> Payment completed</p>
}

            <hr />
            <h5>Payment History</h5>
            <ul>
              {client.received && client.received.length > 0 ? (
                client.received.map((r, idx) => (
                  <li key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>₹{r.amount.toLocaleString("en-IN")} - {r.note || "No note"}</span>
                    <small>({formatDate(r.date)})</small>
                  </li>
                ))
              ) : (
                <p>No payments recorded yet.</p>
              )}
            </ul>

            {editMode && pending !== 0 && (
              <div>
                <h5>Add Payment</h5>
                <InputGroup className="mb-2">
                  <Form.Control type="number" placeholder="Amount" name="amount" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
                  <Form.Control type="text" placeholder="Note" name="note" value={newPayment.note} onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })} />
                  <Button variant="secondary" onClick={addPayment} disabled={addingPayment}>Add</Button>
                </InputGroup>
              </div>
            )}

            <hr />
            <h5>Client Information</h5>
            {editMode ? (
              <div>
                {infoFields.map((item, idx) => (
                  <InputGroup className="mb-2" key={idx}>
                    <Form.Control placeholder="Field" value={item.field} onChange={(e) => {
                      const copy = [...infoFields];
                      copy[idx].field = e.target.value;
                      setInfoFields(copy);
                    }} />
                    <Form.Control placeholder="Value" value={item.value} onChange={(e) => {
                      const copy = [...infoFields];
                      copy[idx].value = e.target.value;
                      setInfoFields(copy);
                    }} />
                    <Button variant="danger" onClick={() => {
                      const copy = infoFields.filter((_, i) => i !== idx);
                      setInfoFields(copy.length > 0 ? copy : [{ field: "", value: "" }]);
                    }}>Delete</Button>
                  </InputGroup>
                ))}
                <Button variant="primary" size="sm" onClick={() => setInfoFields([...infoFields, { field: "", value: "" }])}>Add Field</Button>
                <Button variant="success" size="sm" className="ms-2" onClick={saveClientInfo}>Save Info</Button>
              </div>
            ) : (
              <ul>
                {client.clientInformation && Object.entries(client.clientInformation).length > 0 ? (
                  Object.entries(client.clientInformation).map(([key, value], idx) => <li key={idx}><strong>{key}:</strong> {value}</li>)
                ) : <p>No extra client information.</p>}
              </ul>
            )}

            <hr />
            <h5>Remarks</h5>
            {editMode || editingRemarks ? (
              <div>
                <Form.Control as="textarea" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <div className="mt-2 d-flex justify-content-end gap-2">
                  <Button variant="success" size="sm" onClick={saveRemarks}>Save Remarks</Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditingRemarks(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <p className="mb-0">{client.remarks || "No remarks"}</p>
              </div>
            )}

            <hr />
            <div className="d-flex justify-content-end gap-2">
                <Button variant={editMode ? "secondary" : "outline-primary"} size="sm" onClick={() => setEditMode(!editMode)}>
          {editMode ? "Exit Edit Mode" : "Edit Client"}
        </Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteClient(client.id)}>Delete Client</Button>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ClientDetailsModal;

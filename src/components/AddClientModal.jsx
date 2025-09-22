import React, { useState } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { addClient } from "../services/clientServices";

const AddClientModal = ({ show, onHide, companyId, services, triggerRefresh, setTriggerRefresh }) => {
  const [form, setForm] = useState({
    name: "",
    service: services && services.length > 0 ? services[0] : "",
    total: "",
    received: [], // now an array
    notes: "",
  });

  // temporary state for adding a new payment
  const [payment, setPayment] = useState({ amount: "", note: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  };

  const addPayment = () => {
  if (!payment.amount) return;

  const paymentWithDate = {
    amount: parseInt(payment.amount),
    note: payment.note,
    date: new Date().toISOString(), // add today's date
  };

  setForm({
    ...form,
    received: [...form.received, paymentWithDate],
  });

  setPayment({ amount: "", note: "" });
};


  const handleSubmit = async () => {
    if (!form.name || !form.total) return;

    // total received sum
    const totalReceived = form.received.reduce(
      (sum, r) => sum + r.amount,
      0
    );
    
    

    const clientData = {
      name: form.name,
      service: form.service,
      total: parseInt(form.total),
      received: form.received, // array of payments
      pending: (Number(form.total-totalReceived)),
      notes: form.notes,
    };

    try {
      await addClient(companyId, clientData);

      setForm({
        name: "",
        service: services && services.length > 0 ? services[0] : "",
        total: "",
        received: [],
        notes: "",
      });
      setPayment({ amount: "", note: "" });
      setTriggerRefresh(!triggerRefresh)
      onHide();
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Client</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Client Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>service</Form.Label>
            <Form.Select
              name="service"
              value={form.service}
              onChange={handleChange}
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

          <Form.Group className="mb-3">
            <Form.Label>Total Amount</Form.Label>
            <Form.Control
              type="number"
              name="total"
              value={form.total}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Amount Received</Form.Label>
            {form.received.length > 0 && (
              <ul>
                {form.received.map((r, idx) => (
                  <li key={idx}>
                    {r.amount} - {r.note || "No note"}
                  </li>
                ))}
              </ul>
            )}
            <InputGroup className="mb-2">
              <Form.Control
                type="number"
                placeholder="Amount"
                name="amount"
                value={payment.amount}
                onChange={handlePaymentChange}
              />
              <Form.Control
                type="text"
                placeholder="Note"
                name="note"
                value={payment.note}
                onChange={handlePaymentChange}
              />
              <Button variant="secondary" onClick={addPayment}>
                Add Payment
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              name="notes"
              value={form.notes}
              onChange={handleChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Add Client
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddClientModal;

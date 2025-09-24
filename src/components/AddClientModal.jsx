import React, { useState } from "react";
import { Modal, Button, Form, InputGroup, Row, Col } from "react-bootstrap";
import { addClient } from "../services/clientServices";

  import Swal from "sweetalert2";

const AddClientModal = ({ show, onHide, companyId, services, triggerRefresh, setTriggerRefresh }) => {
  const [form, setForm] = useState({
    name: "",
    service: services && services.length > 0 ? services[0] : "",
    total: 0,
    received: [], // array of payments
    notes: "",
    clientInformation: {}, // new field
  });

  // temporary state for adding a new payment
  const [payment, setPayment] = useState({ amount: "", note: "" });

  // dynamic client information fields
  const [infoFields, setInfoFields] = useState([{ field: "", value: "" }]);

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
      date: new Date().toISOString(), // today's date
    };

    setForm({
      ...form,
      received: [...form.received, paymentWithDate],
    });

    setPayment({ amount: "", note: "" });
  };

  const handleInfoChange = (index, key, value) => {
    const newFields = [...infoFields];
    newFields[index][key] = value;
    setInfoFields(newFields);
  };

  const addInfoField = () => {
    setInfoFields([...infoFields, { field: "", value: "" }]);
  };


const handleSubmit = async () => {
  if (!form.name ) {
    Swal.fire({
      icon: "warning",
      title: "Missing Fields",
      text: "Please client name.",
    });
    return;
  }

  // build clientInformation object
  const clientInformation = {};
  infoFields.forEach((item) => {
    if (item.field && item.value) {
      clientInformation[item.field] = item.value;
    }
  });

  // total received sum
  const totalReceived = form.received.reduce(
    (sum, r) => sum + (parseInt(r.amount) || 0),
    0
  );

  const pending = Math.max(0, Number(form.total - totalReceived));

  const clientData = {
    name: form.name,
    service: form.service,
    total: parseInt(form.total),
    received: form.received,
    pending,
    notes: form.notes,
    clientInformation,
  };

  try {
    await addClient(companyId, clientData);

    // ✅ Success alert
    Swal.fire({
      icon: "success",
      title: "Client Added",
      text: `${form.name} has been added successfully.`,
      timer: 2000,
      showConfirmButton: false,
    });

    // reset everything
    setForm({
      name: "",
      service: services && services.length > 0 ? services[0] : "",
      total: 0,
      received: [],
      notes: "",
      clientInformation: {},
    });
    setPayment({ amount: "", note: "" });
    setInfoFields([{ field: "", value: "" }]);
    setTriggerRefresh(!triggerRefresh);
    onHide();
  } catch (error) {
    console.error("Error adding client:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to add client. Please try again.",
    });
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
            <Form.Label>Service</Form.Label>
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

          <Form.Group className="mb-3">
            <Form.Label>Client Information (If any)</Form.Label>
            {infoFields.map((item, idx) => (
              <Row key={idx} className="mb-2">
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Field (e.g. email)"
                    value={item.field}
                    onChange={(e) =>
                      handleInfoChange(idx, "field", e.target.value)
                    }
                  />
                </Col>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Value (e.g. abc@gmail.com)"
                    value={item.value}
                    onChange={(e) =>
                      handleInfoChange(idx, "value", e.target.value)
                    }
                  />
                </Col>
              </Row>
            ))}
            <Button variant="outline-primary" size="sm" onClick={addInfoField}>
              + Add Info
            </Button>
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

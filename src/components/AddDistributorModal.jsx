import { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { addDistributor } from "../services/fetchDistributors";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const REGIONS = ["North","South","East","West","North-East","Central"];

const empty = {
  distributorName: "", state: "", region: "", exclusive: "",
  teamSize: "", contactPersonName: "", contactNumber: "", email: "",
  address: "", gstNumber: "", establishedYear: "",
  currentStatus: "Contacted", lastMeetingDate: "", nextFollowUp: "",
  productLinesHandled: "", territoryDescription: "", remarks: "",
};

const AddDistributorModal = ({ companyId, employeeName, onAdded }) => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(empty);
  const today = new Date().toISOString().split("T")[0];

  const open = () => { setShow(true); setForm({ ...empty, lastMeetingDate: today }); };
  const close = () => setShow(false);
  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.distributorName || !form.contactNumber || !form.state) {
      Swal.fire({ icon: "warning", title: "Missing Fields", text: "Distributor Name, State and Contact Number are required." });
      return;
    }
    try {
      await addDistributor(companyId, { ...form, addedByName: employeeName });
      Swal.fire({ icon: "success", title: "Distributor Added", text: `${form.distributorName} has been added.`, timer: 2000, showConfirmButton: false });
      close();
      onAdded();
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to add distributor. Please try again." });
    }
  };

  return (
    <>
      <button style={{ background: "none", border: "none" }} onClick={open}>
        <i title="Add Distributor" className="fa-solid fa-handshake" style={{ fontSize: "1.2rem" }}></i>
      </button>

      <Modal show={show} onHide={close} dialogClassName="custom-modal" backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Distributor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              {/* Basic Info */}
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Distributor / Firm Name *</Form.Label>
                  <Form.Control type="text" placeholder="e.g. MedSupply Co." onChange={f("distributorName")} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>State *</Form.Label>
                  <Form.Select onChange={f("state")}>
                    <option value="">Select State</option>
                    {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    list="region-options"
                    placeholder="Type or select region"
                    onChange={f("region")}
                  />
                  <datalist id="region-options">
                    {REGIONS.map((r) => <option key={r} value={r} />)}
                  </datalist>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Exclusive Distributor?</Form.Label>
                  <Form.Select onChange={f("exclusive")}>
                    <option value="">Select</option>
                    <option value="Yes">Yes – Exclusive</option>
                    <option value="No">No – Non-exclusive</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Team Size</Form.Label>
                  <Form.Control type="number" min="1" placeholder="No. of field reps" onChange={f("teamSize")} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Year Established</Form.Label>
                  <Form.Control type="number" placeholder="e.g. 2010" onChange={f("establishedYear")} />
                </Form.Group>
              </div>

              {/* Contact */}
              <div className="col-12"><hr /><h6 className="mb-3">Contact Details</h6></div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Contact Person Name *</Form.Label>
                  <Form.Control type="text" onChange={f("contactPersonName")} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Contact Number *</Form.Label>
                  <Form.Control type="tel" onChange={f("contactNumber")} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" onChange={f("email")} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>GST Number</Form.Label>
                  <Form.Control type="text" placeholder="15-digit GSTIN" onChange={f("gstNumber")} />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control as="textarea" rows={2} onChange={f("address")} />
                </Form.Group>
              </div>

              {/* Business */}
              <div className="col-12"><hr /><h6 className="mb-3">Business Details</h6></div>
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Product Lines Handled</Form.Label>
                  <Form.Control type="text" placeholder="e.g. Surgical instruments, Diagnostics" onChange={f("productLinesHandled")} />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Territory / Coverage Description</Form.Label>
                  <Form.Control type="text" placeholder="e.g. All districts in Kerala except Trivandrum" onChange={f("territoryDescription")} />
                </Form.Group>
              </div>

              {/* Status & Follow-up */}
              <div className="col-12"><hr /><h6 className="mb-3">Status & Follow-up</h6></div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Current Status</Form.Label>
                  <Form.Select onChange={f("currentStatus")} value={form.currentStatus}>
                    <option value="Haven't yet contacted">Haven't yet contacted</option>
                    <option value="Called, no response">Called, no response</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Online demo done">Online demo done</option>
                    <option value="Live demo done">Live demo done</option>
                    <option value="Hospital presentation done">Live demo done</option>
                    <option value="To Follow Up">To Follow Up</option>
                    <option value="Agreement Sent & awaiting response">Agreement Sent & waiting</option>
                    <option value="Agreement Signed">Agreement Signed</option>
                    <option value="Doing Sales">Doing Sales</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Terminated">Terminated</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Last Meeting Date</Form.Label>
                  <Form.Control type="date" value={form.lastMeetingDate} onChange={f("lastMeetingDate")} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Next Follow-Up Date</Form.Label>
                  <Form.Control type="date" onChange={f("nextFollowUp")} />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control as="textarea" rows={3} onChange={f("remarks")} />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Add Distributor</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddDistributorModal;
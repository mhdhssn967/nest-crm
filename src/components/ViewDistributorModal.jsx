import { useState, useEffect, useCallback, useRef } from "react";
import { Modal, Form, Button, Table, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import {
  updateDistributor,
  fetchEnrolledCustomers,
  addEnrolledCustomer,
} from "../services/fetchDistributors";

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];
const REGIONS = ["North","South","East","West","North-East","Central"];

export const getStatusColor = (status) => {
  switch (status) {
    case "Contacted": return "#a3c9f1";
    case "To Follow Up": return "#fff3b0";
    case "Agreement Sent": return "#d2b7e5";
    case "Agreement Signed": return "#b0eacb";
    case "Doing Sales": return "#b2f2bb";
    case "Inactive": return "#ffd8a8";
    case "Terminated": return "#f5b7b1";
    default: return "#d6d6d6";
  }
};

const emptyCustomer = { customerName: "", notes: "" };

const ViewDistributorModal = ({ distributor, companyId, onClose, onUpdated, isAdmin }) => {
  // KEY FIX: snapshot on mount so parent re-renders (from onUpdated re-fetch)
  // never reset the form while the user is mid-edit.
  const initialSnapshot = useRef({ ...distributor });
  const [form, setForm] = useState(() => ({ ...distributor }));

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCust, setLoadingCust] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState(emptyCustomer);
  const [addingCust, setAddingCust] = useState(false);

  // Stable handlers - won't recreate on parent re-render
  const f = useCallback((field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value })), []);
  const fc = useCallback((field) => (e) => setNewCustomer((p) => ({ ...p, [field]: e.target.value })), []);

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    setLoadingCust(true);
    const data = await fetchEnrolledCustomers(companyId, distributor.id);
    setCustomers(data);
    setLoadingCust(false);
  };

  const handleSave = async () => {
    if (!form.distributorName || !form.contactNumber || !form.state) {
      Swal.fire({ icon: "warning", title: "Missing Fields", text: "Name, State and Contact are required." });
      return;
    }
    setSaving(true);
    try {
      await updateDistributor(companyId, distributor.id, form);
      initialSnapshot.current = { ...form }; // update snapshot after successful save
      Swal.fire({ icon: "success", title: "Updated", timer: 1500, showConfirmButton: false });
      setEditing(false);
      onUpdated(); // re-fetches parent list — does NOT reset local form
    } catch {
      Swal.fire({ icon: "error", title: "Failed to update." });
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setForm({ ...initialSnapshot.current }); // revert to last saved, not stale prop
    setEditing(false);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.customerName) {
      Swal.fire({ icon: "warning", title: "Customer name is required." });
      return;
    }
    setAddingCust(true);
    try {
      await addEnrolledCustomer(companyId, distributor.id, newCustomer);
      await loadCustomers();
      setNewCustomer(emptyCustomer);
      setShowAddCustomer(false);
      Swal.fire({ icon: "success", title: "Customer Added", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Failed to add customer." });
    }
    setAddingCust(false);
  };

  const Field = ({ label, value, editEl }) => (
    <div className="mb-3">
      <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 2 }}>{label}</div>
      {editing ? editEl : <div style={{ fontWeight: 500, color: "#222" }}>{value || <span style={{ color: "#bbb" }}>—</span>}</div>}
    </div>
  );

  return (
    <Modal show onHide={onClose} size="xl" backdrop="static" scrollable>
      <Modal.Header closeButton style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", color: "#fff", borderBottom: "none" }}>
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <Modal.Title style={{ fontWeight: 700, fontSize: "1.3rem" }}>{distributor.distributorName}</Modal.Title>
              <div style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: 2 }}>{distributor.state}{distributor.region ? ` • ${distributor.region}` : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ background: getStatusColor(distributor.currentStatus), color: "#333", borderRadius: 20, padding: "4px 14px", fontSize: "0.8rem", fontWeight: 600 }}>
                {distributor.currentStatus}
              </span>
              {distributor.exclusive === "Yes" && (
                <span style={{ background: "#ffd700", color: "#333", borderRadius: 20, padding: "4px 12px", fontSize: "0.78rem", fontWeight: 700 }}>★ Exclusive</span>
              )}
            </div>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {!editing ? (
            <Button size="sm" variant="outline-primary" onClick={() => setEditing(true)}>
              <i className="fa-solid fa-pen me-1"></i> Edit
            </Button>
          ) : (
            <>
              <Button size="sm" variant="success" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <><i className="fa-solid fa-floppy-disk me-1"></i> Save</>}
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={handleCancelEdit}>Cancel</Button>
            </>
          )}
        </div>

        <div className="row">
          <div className="col-12 mb-2"><h6 style={{ color: "#444", borderBottom: "2px solid #eee", paddingBottom: 6 }}>Basic Information</h6></div>
          <div className="col-md-4">
            <Field label="Distributor Name" value={form.distributorName}
              editEl={<Form.Control size="sm" value={form.distributorName} onChange={f("distributorName")} />} />
          </div>
          <div className="col-md-4">
            <Field label="State" value={form.state}
              editEl={<Form.Select size="sm" value={form.state} onChange={f("state")}>{INDIA_STATES.map(s => <option key={s}>{s}</option>)}</Form.Select>} />
          </div>
          <div className="col-md-4">
            <Field label="Region" value={form.region}
              editEl={<>
                <Form.Control size="sm" type="text" list="region-options-edit" value={form.region} placeholder="Type or select" onChange={f("region")} />
                <datalist id="region-options-edit">{REGIONS.map(r => <option key={r} value={r} />)}</datalist>
              </>} />
          </div>
          <div className="col-md-4">
            <Field label="Exclusive" value={form.exclusive}
              editEl={<Form.Select size="sm" value={form.exclusive} onChange={f("exclusive")}><option value="">—</option><option>Yes</option><option>No</option></Form.Select>} />
          </div>
          <div className="col-md-4">
            <Field label="Team Size" value={form.teamSize}
              editEl={<Form.Control size="sm" type="number" value={form.teamSize} onChange={f("teamSize")} />} />
          </div>
          <div className="col-md-4">
            <Field label="Year Established" value={form.establishedYear}
              editEl={<Form.Control size="sm" type="number" value={form.establishedYear} onChange={f("establishedYear")} />} />
          </div>

          <div className="col-12 mb-2 mt-2"><h6 style={{ color: "#444", borderBottom: "2px solid #eee", paddingBottom: 6 }}>Contact Details</h6></div>
          <div className="col-md-4">
            <Field label="Contact Person" value={form.contactPersonName}
              editEl={<Form.Control size="sm" value={form.contactPersonName} onChange={f("contactPersonName")} />} />
          </div>
          <div className="col-md-4">
            <Field label="Contact Number" value={form.contactNumber}
              editEl={<Form.Control size="sm" value={form.contactNumber} onChange={f("contactNumber")} />} />
          </div>
          <div className="col-md-4">
            <Field label="Email" value={form.email}
              editEl={<Form.Control size="sm" type="email" value={form.email} onChange={f("email")} />} />
          </div>
          <div className="col-md-4">
            <Field label="GST Number" value={form.gstNumber}
              editEl={<Form.Control size="sm" value={form.gstNumber} onChange={f("gstNumber")} />} />
          </div>
          <div className="col-md-8">
            <Field label="Address" value={form.address}
              editEl={<Form.Control as="textarea" size="sm" rows={2} value={form.address} onChange={f("address")} />} />
          </div>

          <div className="col-12 mb-2 mt-2"><h6 style={{ color: "#444", borderBottom: "2px solid #eee", paddingBottom: 6 }}>Business Details</h6></div>
          <div className="col-md-6">
            <Field label="Product Lines Handled" value={form.productLinesHandled}
              editEl={<Form.Control size="sm" value={form.productLinesHandled} onChange={f("productLinesHandled")} />} />
          </div>
          <div className="col-md-6">
            <Field label="Territory Description" value={form.territoryDescription}
              editEl={<Form.Control size="sm" value={form.territoryDescription} onChange={f("territoryDescription")} />} />
          </div>

          <div className="col-12 mb-2 mt-2"><h6 style={{ color: "#444", borderBottom: "2px solid #eee", paddingBottom: 6 }}>Status & Follow-up</h6></div>
          <div className="col-md-3">
            <Field label="Current Status" value={form.currentStatus}
              editEl={<Form.Select size="sm" value={form.currentStatus} onChange={f("currentStatus")}>
                {["Haven't yet contacted","Called, no response","Contacted","Online demo done","Live demo done","Hospital presentation done","To Follow Up","Agreement Sent & awaiting response","Agreement Signed","Doing Sales","Inactive","Terminated"].map(s => <option key={s}>{s}</option>)}
              </Form.Select>} />
          </div>
          <div className="col-md-3">
            <Field label="Last Meeting Date" value={form.lastMeetingDate}
              editEl={<Form.Control size="sm" type="date" value={form.lastMeetingDate} onChange={f("lastMeetingDate")} />} />
          </div>
          <div className="col-md-3">
            <Field label="Next Follow-Up" value={form.nextFollowUp}
              editEl={<Form.Control size="sm" type="date" value={form.nextFollowUp} onChange={f("nextFollowUp")} />} />
          </div>
          <div className="col-md-3">
            <Field label="Added By" value={form.addedByName} editEl={<Form.Control size="sm" value={form.addedByName} disabled />} />
          </div>
          <div className="col-12">
            <Field label="Remarks" value={form.remarks}
              editEl={<Form.Control as="textarea" size="sm" rows={3} value={form.remarks} onChange={f("remarks")} />} />
          </div>
        </div>

        {/* Enrolled Customers */}
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h6 style={{ color: "#444", margin: 0 }}>
              <i className="fa-solid fa-hospital me-2" style={{ color: "#4361ee" }}></i>
              Enrolled Customers ({customers.length})
            </h6>
            <Button size="sm" variant="outline-success" onClick={() => setShowAddCustomer(p => !p)}>
              <i className="fa-solid fa-plus me-1"></i> Add Customer
            </Button>
          </div>

          {showAddCustomer && (
            <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "1rem", marginBottom: "1rem", border: "1px solid #dee2e6" }}>
              <div className="row g-2">
                <div className="col-md-5">
                  <Form.Control size="sm" placeholder="Customer / Hospital Name *" value={newCustomer.customerName} onChange={fc("customerName")} />
                </div>
                <div className="col-md-5">
                  <Form.Control size="sm" placeholder="Notes (optional)" value={newCustomer.notes} onChange={fc("notes")} />
                </div>
                <div className="col-12 mt-2" style={{ display: "flex", gap: 8 }}>
                  <Button size="sm" variant="success" onClick={handleAddCustomer} disabled={addingCust}>
                    {addingCust ? <Spinner size="sm" /> : "Save Customer"}
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => { setShowAddCustomer(false); setNewCustomer(emptyCustomer); }}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {loadingCust ? (
            <div style={{ textAlign: "center", padding: "1rem" }}><Spinner size="sm" /></div>
          ) : customers.length === 0 ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "1rem", fontSize: "0.9rem" }}>No customers enrolled yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Table size="sm" hover style={{ fontSize: "0.85rem" }}>
                <thead style={{ background: "#f0f4ff" }}>
                  <tr><th>#</th><th>Customer / Hospital Name</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={c.id}><td>{i + 1}</td><td>{c.customerName}</td><td>{c.notes || "—"}</td></tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {editing && (
          <Button variant="success" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : "Save Changes"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ViewDistributorModal;
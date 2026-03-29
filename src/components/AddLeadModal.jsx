import { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { addLead } from "../services/fetchAdLeads";
import { fetchAllEmployees } from "../services/fetchNames";

const LEAD_TYPES = [
  "Hospital", "Distributor", "Physiotherapist",
  "Clinic", "Pharmacy", "Nursing Home", "Other",
];

const PRIORITIES = [
  { value: "Urgent", label: "⚡ Urgent", color: "#7c3aed" },
  { value: "High",   label: "🔴 High",   color: "#dc2626" },
  { value: "Medium", label: "🟡 Medium", color: "#d97706" },
  { value: "Low",    label: "🟢 Low",    color: "#16a34a" },
];

const empty = {
  name: "",
  institutionName: "",
  contactNumber: "",
  message: "",
  region: "",
  leadType: "",
  leadTypeOther: "",
  priority: "Medium",
  remarks: "",
  followUpDate: "",
  assignedToUid: "",
  assignedToName: "",
};

const AddLeadModal = ({ companyId, currentUser, onAdded }) => {
  const [show,      setShow]      = useState(false);
  const [form,      setForm]      = useState(empty);
  const [saving,    setSaving]    = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(false);

  // Load employees when modal opens
  useEffect(() => {
    if (!show || !companyId) return;
    const load = async () => {
      setLoadingEmp(true);
      const data = await fetchAllEmployees(companyId);
      setEmployees(data);
      setLoadingEmp(false);
    };
    load();
  }, [show, companyId]);

  const open  = () => { setShow(true); setForm(empty); };
  const close = () => setShow(false);
  const f = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleAssignChange = (e) => {
    const uid = e.target.value;
    const emp = employees.find((em) => em.uid === uid);
    setForm((p) => ({
      ...p,
      assignedToUid:  uid,
      assignedToName: emp?.empName || "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.contactNumber.trim() || !form.leadType) {
      Swal.fire({ icon: "warning", title: "Missing Fields", text: "Name, Contact Number and Lead Type are required." });
      return;
    }
    if (!form.assignedToUid) {
      Swal.fire({ icon: "warning", title: "Please assign this lead to an employee." });
      return;
    }

    setSaving(true);
    try {
      const authorName = currentUser?.displayName || "Admin";
      const payload = { ...form };

      // Resolve "Other" type to custom text
      if (payload.leadType === "Other") {
        payload.leadType = payload.leadTypeOther?.trim() || "Other";
      }
      delete payload.leadTypeOther;

      await addLead(companyId, payload, authorName);
      Swal.fire({ icon: "success", title: "Lead Added!", timer: 1500, showConfirmButton: false });
      close();
      onAdded();
    } catch {
      Swal.fire({ icon: "error", title: "Failed to add lead." });
    }
    setSaving(false);
  };

  return (
    <>
      <button className="add-lead-btn" onClick={open}>
        <i className="fa-solid fa-plus me-2"></i>Add Lead
      </button>

      <Modal show={show} onHide={close} size="lg" backdrop="static">
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            color: "#fff",
            borderBottom: "none",
          }}
        >
          <Modal.Title style={{ fontWeight: 700, fontSize: "1.1rem" }}>
            <i className="fa-solid fa-bullhorn me-2" style={{ color: "#f59e0b" }}></i>
            Add New Lead
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ padding: "1.5rem" }}>
          <div className="row g-3">

            {/* ── Contact details ── */}
            <div className="col-md-6">
              <Form.Label className="lead-form-label">Contact Name *</Form.Label>
              <Form.Control size="sm" placeholder="Dr. Arun Kumar" value={form.name} onChange={f("name")} />
            </div>
            <div className="col-md-6">
              <Form.Label className="lead-form-label">Institution Name</Form.Label>
              <Form.Control size="sm" placeholder="City Hospital, MedCare Clinic…" value={form.institutionName} onChange={f("institutionName")} />
            </div>
            <div className="col-md-6">
              <Form.Label className="lead-form-label">Contact Number *</Form.Label>
              <Form.Control size="sm" type="tel" placeholder="+91 98765 43210" value={form.contactNumber} onChange={f("contactNumber")} />
            </div>

            {/* ── Region (free-text, no fixed list) ── */}
            <div className="col-md-6">
              <Form.Label className="lead-form-label">Region</Form.Label>
              <Form.Control
                size="sm"
                placeholder="e.g. Ernakulam, Thrissur, North Kerala…"
                value={form.region}
                onChange={f("region")}
              />
            </div>

            {/* ── Lead type ── */}
            <div className="col-md-6">
              <Form.Label className="lead-form-label">Lead Type *</Form.Label>
              <Form.Select size="sm" value={form.leadType} onChange={f("leadType")}>
                <option value="">Select Type</option>
                {LEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </div>
            {form.leadType === "Other" && (
              <div className="col-md-6">
                <Form.Label className="lead-form-label">Specify Type *</Form.Label>
                <Form.Control
                  size="sm"
                  placeholder="e.g. Rehabilitation Centre"
                  value={form.leadTypeOther}
                  onChange={f("leadTypeOther")}
                />
              </div>
            )}

            {/* ── Assign to employee ── */}
            <div className="col-md-6">
              <Form.Label className="lead-form-label">
                Assign To *
                {loadingEmp && <Spinner size="sm" className="ms-2" />}
              </Form.Label>
              <Form.Select
                size="sm"
                value={form.assignedToUid}
                onChange={handleAssignChange}
                disabled={loadingEmp}
              >
                <option value="">
                  {loadingEmp ? "Loading employees…" : "Select Employee"}
                </option>
                {employees.map((emp) => (
                  <option key={emp.uid} value={emp.uid}>
                    {emp.empName}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* ── Priority ── */}
            <div className="col-md-6">
              <Form.Label className="lead-form-label">Priority</Form.Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                    style={{
                      padding: "4px 14px",
                      borderRadius: 20,
                      border: `2px solid ${form.priority === p.value ? p.color : "#ddd"}`,
                      background: form.priority === p.value ? p.color + "18" : "#fff",
                      color: form.priority === p.value ? p.color : "#888",
                      fontWeight: form.priority === p.value ? 700 : 400,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Follow-up date ── */}
            <div className="col-md-6">
              <Form.Label className="lead-form-label">Follow-Up Date</Form.Label>
              <Form.Control size="sm" type="date" value={form.followUpDate} onChange={f("followUpDate")} />
            </div>

            {/* ── Message ── */}
            <div className="col-12">
              <Form.Label className="lead-form-label">Message / Lead Details</Form.Label>
              <Form.Control
                as="textarea" size="sm" rows={3}
                placeholder="What did the lead enquire about? Any context from the ad…"
                value={form.message}
                onChange={f("message")}
              />
            </div>

            {/* ── Remarks ── */}
            <div className="col-12">
              <Form.Label className="lead-form-label">Internal Remarks</Form.Label>
              <Form.Control
                as="textarea" size="sm" rows={2}
                placeholder="Internal notes for the team…"
                value={form.remarks}
                onChange={f("remarks")}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={close}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving
              ? <><Spinner size="sm" className="me-1" />Saving…</>
              : <><i className="fa-solid fa-plus me-1"></i>Add Lead</>
            }
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddLeadModal;
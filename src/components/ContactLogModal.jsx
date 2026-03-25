import { useState, useEffect } from "react";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { fetchContactLog, addContactLogEntry, updateDistributor } from "../services/fetchDistributors";
import { auth } from "../firebaseConfig";

const STATUS_OPTIONS = [
  "Haven't yet contacted","Called, no response","Contacted and discussed via phone","Online demo done","Live demo done","Hospital presentation done","Agreement Sent & awaiting response","Agreement Signed","Purchased Demo Piece","Doing Sales","Inactive","Terminated"
];

const STATUS_COLORS = {
  "Contacted": "#a3c9f1",
  "To Follow Up": "#fff3b0",
  "Agreement Sent": "#d2b7e5",
  "Agreement Signed": "#b0eacb",
  "Doing Sales": "#b2f2bb",
  "Inactive": "#ffd8a8",
  "Terminated": "#f5b7b1",
};

const formatDate = (val) => {
  if (!val) return "";
  if (val?.toDate) return val.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  if (val instanceof Date) return val.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  return String(val);
};

const ContactLogModal = ({ distributor, companyId, isAdmin, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [newStatus, setNewStatus] = useState(distributor.currentStatus || "Contacted");
  const [whatHappened, setWhatHappened] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split("T")[0]);

  const loadLogs = async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    const data = await fetchContactLog(companyId, distributor.id, uid, isAdmin);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSubmit = async () => {
    if (!whatHappened.trim()) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please describe what happened in this contact." });
      return;
    }
    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      await addContactLogEntry(companyId, distributor.id, {
        date: meetingDate,
        authorName: auth.currentUser?.displayName || "Unknown",
        authorUid: uid,
        whatHappened: whatHappened.trim(),
        nextAction: nextAction.trim(),
        newStatus,
        createdAt: new Date(),
      });
      // Also update the distributor's current status and last meeting date
      await updateDistributor(companyId, distributor.id, {
        currentStatus: newStatus,
        lastMeetingDate: meetingDate,
        ...(nextAction.trim() ? { nextFollowUp: "" } : {}),
      });
      setWhatHappened("");
      setNextAction("");
      await loadLogs();
      Swal.fire({ icon: "success", title: "Entry Added", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Failed to save entry." });
    }
    setSubmitting(false);
  };

  return (
    <Modal show onHide={onClose} size="lg" backdrop="static" scrollable>
      <Modal.Header
        closeButton
        style={{
          background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
          color: "#fff",
          borderBottom: "none",
        }}
      >
        <div>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1.15rem" }}>
            <i className="fa-solid fa-timeline me-2" style={{ color: "#64d8cb" }}></i>
            Contact History
          </Modal.Title>
          <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: 2 }}>
            {distributor.distributorName} · {distributor.state}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body style={{ padding: 0 }}>
        {/* ── Add New Entry ── */}
        <div className="clog-add-section">
          <div className="clog-add-title">
            <i className="fa-solid fa-plus-circle me-2" style={{ color: "#4361ee" }}></i>
            Log New Contact
          </div>
          <div className="clog-add-grid">
            <div className="clog-form-group">
              <label>Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="clog-input"
              />
            </div>
            <div className="clog-form-group">
              <label>Update Status To</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="clog-input"
                style={{ background: STATUS_COLORS[newStatus] || "#f5f5f5" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="clog-form-group clog-form-group--full">
              <label>What happened? *</label>
              <textarea
                rows={3}
                placeholder="e.g. Called him, he said he's busy with a hospital order this week. Will follow up next Thursday."
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                className="clog-input"
              />
            </div>
            <div className="clog-form-group clog-form-group--full">
              <label>Next planned action</label>
              <input
                type="text"
                placeholder="e.g. Call on Thursday after 4pm"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="clog-input"
              />
            </div>
          </div>
          <button
            className="clog-submit-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Spinner size="sm" />
            ) : (
              <><i className="fa-solid fa-floppy-disk me-2"></i>Save Entry</>
            )}
          </button>
        </div>

        {/* ── Timeline ── */}
        <div className="clog-timeline-section">
          <div className="clog-timeline-title">
            History ({logs.length} {logs.length === 1 ? "entry" : "entries"})
            {!isAdmin && <span className="clog-mine-badge">Showing your entries</span>}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Spinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="clog-empty">
              <i className="fa-solid fa-inbox" style={{ fontSize: "1.8rem", color: "#ccc" }}></i>
              <p>No contact history yet. Add the first entry above.</p>
            </div>
          ) : (
            <div className="clog-timeline">
              {logs.map((log, i) => (
                <div key={log.id} className="clog-entry">
                  <div className="clog-entry__line">
                    <div className="clog-entry__dot" style={{ background: STATUS_COLORS[log.newStatus] || "#999" }} />
                    {i < logs.length - 1 && <div className="clog-entry__connector" />}
                  </div>
                  <div className="clog-entry__content">
                    <div className="clog-entry__header">
                      <span className="clog-entry__date">
                        <i className="fa-regular fa-calendar me-1"></i>
                        {log.date || formatDate(log.createdAt)}
                      </span>
                      <span className="clog-entry__author">
                        <i className="fa-solid fa-user me-1"></i>
                        {log.authorName}
                      </span>
                      {log.newStatus && (
                        <span
                          className="clog-entry__status"
                          style={{ background: STATUS_COLORS[log.newStatus] || "#ddd" }}
                        >
                          {log.newStatus}
                        </span>
                      )}
                    </div>
                    <div className="clog-entry__body">
                      <p className="clog-entry__what">{log.whatHappened}</p>
                      {log.nextAction && (
                        <div className="clog-entry__next">
                          <i className="fa-solid fa-arrow-right me-1" style={{ color: "#4361ee" }}></i>
                          <strong>Next:</strong> {log.nextAction}
                        </div>
                      )}
                    </div>
                    <div className="clog-entry__ts">{formatDate(log.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ContactLogModal;
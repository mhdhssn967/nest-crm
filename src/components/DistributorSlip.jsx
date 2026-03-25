import { useState } from "react";
import ViewDistributorModal from "./ViewDistributorModal";
import ContactLogModal from "./ContactLogModal";
import { deleteDistributor } from "../services/fetchDistributors";
import Swal from "sweetalert2";

const STATUS_COLORS = {
  "Contacted": "#a3c9f1",
  "To Follow Up": "#fff3b0",
  "Agreement Sent": "#d2b7e5",
  "Agreement Signed": "#b0eacb",
  "Doing Sales": "#b2f2bb",
  "Inactive": "#ffd8a8",
  "Terminated": "#f5b7b1",
};

const DistributorSlip = ({ distributor, companyId, isAdmin, onUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const statusColor = STATUS_COLORS[distributor.currentStatus] || "#ddd";

  const InfoChip = ({ icon, label }) =>
    label ? (
      <span className="slip-chip">
        <i className={`fa-solid ${icon}`}></i> {label}
      </span>
    ) : null;

    const handleDelete = async (e) => {
  e.stopPropagation();
  
  const result = await Swal.fire({
    title: "Delete Distributor?",
    text: `"${distributor.distributorName}" will be permanently removed. This cannot be undone.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  try {
    await deleteDistributor(companyId, distributor.id);
    onUpdated();
    Swal.fire({
      title: "Deleted",
      text: `"${distributor.distributorName}" has been removed.`,
      icon: "success",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({
      title: "Error",
      text: "Failed to delete distributor. Please try again.",
      icon: "error",
    });
  }
};

  return (
    <>
      <div
        className={`dist-slip ${expanded ? "dist-slip--expanded" : ""}`}
        style={{ borderLeft: `4px solid ${statusColor}`,marginBottom:'10px' }}
      >
        {/* ── Collapsed row (always visible) ── */}
        <div
          className="dist-slip__header"
          onClick={() => setExpanded((p) => !p)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setExpanded((p) => !p)}
        >
          <div className="dist-slip__title-row" >
            <span className="dist-slip__name">{distributor.distributorName}</span>
            <span
              className="dist-slip__status"
              style={{ background: statusColor }}
            >
              {distributor.currentStatus}
            </span>
            {distributor.exclusive === "Yes" && (
              <span className="dist-slip__exclusive">★ Exclusive</span>
            )}
          </div>

          <div className="dist-slip__meta">
            <InfoChip icon="fa-location-dot" label={distributor.state} />
            <InfoChip icon="fa-user" label={distributor.contactPersonName} />
            <InfoChip icon="fa-phone" label={distributor.contactNumber} />
            {distributor.nextFollowUp && (
              <InfoChip icon="fa-calendar-check" label={`Follow-up: ${distributor.nextFollowUp}`} />
            )}
          </div>

          <span className={`dist-slip__chevron ${expanded ? "dist-slip__chevron--open" : ""}`}>
            <i className="fa-solid fa-chevron-down"></i>
          </span>
        </div>

        {/* ── Expanded panel ── */}
        {expanded && (
          <div className="dist-slip__body">
            <div className="dist-slip__detail-grid">
              {distributor.email && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Email</span>
                  <span>{distributor.email}</span>
                </div>
              )}
              {distributor.address && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Address</span>
                  <span>{distributor.address}</span>
                </div>
              )}
              {distributor.productLinesHandled && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Products</span>
                  <span>{distributor.productLinesHandled}</span>
                </div>
              )}
              {distributor.territoryDescription && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Territory</span>
                  <span>{distributor.territoryDescription}</span>
                </div>
              )}
              {distributor.gstNumber && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">GST</span>
                  <span style={{ fontFamily: "monospace" }}>{distributor.gstNumber}</span>
                </div>
              )}
              {distributor.teamSize && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Team Size</span>
                  <span>{distributor.teamSize} reps</span>
                </div>
              )}
              {distributor.establishedYear && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Est.</span>
                  <span>{distributor.establishedYear}</span>
                </div>
              )}
              {distributor.lastMeetingDate && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Last Meeting</span>
                  <span>{distributor.lastMeetingDate}</span>
                </div>
              )}
              {distributor.addedByName && (
                <div className="dist-slip__detail-item">
                  <span className="dist-slip__detail-label">Added By</span>
                  <span>{distributor.addedByName}</span>
                </div>
              )}
              {distributor.remarks && (
                <div className="dist-slip__detail-item dist-slip__detail-item--full">
                  <span className="dist-slip__detail-label">Remarks</span>
                  <span>{distributor.remarks}</span>
                </div>
              )}
            </div>

            <div className="dist-slip__actions">
              <button
                className="dist-slip__btn dist-slip__btn--primary"
                onClick={(e) => { e.stopPropagation(); setShowFull(true); }}
              >
                <i className="fa-solid fa-pen-to-square me-1"></i> Full Details & Edit
              </button>
              <button
                className="dist-slip__btn dist-slip__btn--secondary"
                onClick={(e) => { e.stopPropagation(); setShowLog(true); }}
              >
                <i className="fa-solid fa-timeline me-1"></i> Contact History
              </button>
              <button
  className="dist-slip__btn dist-slip " style={{backgroundColor:'rgb(252, 200, 200)',border:'solid red 1px'}}
  onClick={handleDelete}
>
  <i className="fa-solid fa-trash me-1"></i> Delete Distributor
</button>
            </div>
          </div>
        )}
      </div>

      {showFull && (
        <ViewDistributorModal
          distributor={distributor}
          companyId={companyId}
          isAdmin={isAdmin}
          onClose={() => setShowFull(false)}
          onUpdated={() => { setShowFull(false); onUpdated(); }}
        />
      )}

      {showLog && (
        <ContactLogModal
          distributor={distributor}
          companyId={companyId}
          isAdmin={isAdmin}
          onClose={() => setShowLog(false)}
        />
      )}
    </>
  );
};

export default DistributorSlip;
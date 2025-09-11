import React, { useEffect, useState } from "react";
import "./ViewRecord.css";
import close from "../assets/close.png";
import getBDAName from "../services/fetchNames";
import { deleteRecord } from "../services/deleteRecords";
import updateRecord from "../services/editRecord";

const ViewRecord = ({
  setViewRecord,
  viewRecordData,
  setUpdateTable,
  updateTable,
  companyId,
}) => {
  const [bdaName, setBdaName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...viewRecordData });

  useEffect(() => {
    const fetchBDAName = async () => {
      if (!viewRecordData?.associate) return;
      const BDAname = await getBDAName(viewRecordData.associate);
      setBdaName(BDAname);
    };
    fetchBDAName();
  }, [viewRecordData]);

  const handleDeleteRecord = async (data) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?"
    );
    if (confirmDelete) {
      await deleteRecord(data,companyId);
      setViewRecord(false);
      setUpdateTable(!updateTable);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleSave = async () => {
    console.log("Updated Data:", editedData);
    setIsEditing(false);
    await updateRecord(viewRecordData.id, editedData, companyId);
    setUpdateTable(!updateTable);
    // You can send `editedData` to your backend API for updating the record
  };

  const handleChange = (e, field) => {
    setEditedData({ ...editedData, [field]: e.target.value });
  };

  return (
    <>
      <div className="view-record-overlay">
        <div className="viewRecord view-mobile">
          <div
            className="head"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            
           
  <div style={{display:'flex',gap:'15px'}}>
    {isEditing ? (
      <select
        value={editedData.priority}
        onChange={(e) => handleChange(e, "priority")}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    ) : (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
        }}
        title={editedData.priority} // optional tooltip
      >
        <span
          style={{
            display: "inline-block",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor:
              editedData.priority === "High"
                ? "#e63946" // darkish red
                : editedData.priority === "Medium"
                ? "#e9c46a" // darkish yellow
                : "#2a9d8f", // darkish green
          }}
        ></span>
        <span
          style={{
            visibility: "hidden",
            transition: "0.3s",
          }}
          className="priority-text"
        >
          {editedData.priority}
        </span>
      </div>
    )}
  <h1>Detailed Record Information</h1>
  </div>
            <img
              src={close}
              alt=""
              style={{ width: "40px", filter: "invert(1)", cursor: "pointer" }}
              onClick={() => setViewRecord(false)}
            />
            


          </div>

          {/* Record table System */}
          <table
            className="record-table pc-view"
            style={{ width: "100%", borderSpacing: "0 10px" }}
          >
            <tbody>
              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-hospital"></i> Institute Name:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.clientName}
                      onChange={(e) => handleChange(e, "institutionName")}
                    />
                  ) : (
                    editedData.clientName
                  )}
                </td>
                <td>
                  <strong>
                    <i className="fa-solid fa-calendar"></i> Initial Date:
                  </strong>
                </td>
                <td>{editedData.date}</td>
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-user-tie"></i> Associate:
                  </strong>
                </td>
                <td>{editedData.employeeName}</td>
                <td>
                  <strong>
                    <i className="fa-solid fa-bookmark"></i> Status:
                  </strong>
                </td>
                 
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-location-dot"></i> Place:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.place}
                      onChange={(e) => handleChange(e, "place")}
                    />
                  ) : (
                    editedData.place
                  )}
                </td>
                <td>
                  <strong>
                    <i className="fa-solid fa-globe"></i> Country:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.country}
                      onChange={(e) => handleChange(e, "country")}
                    />
                  ) : (
                    editedData.country
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-id-badge"></i> Person of Contact:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.personOfContact}
                      onChange={(e) => handleChange(e, "personOfContact")}
                    />
                  ) : (
                    `${editedData.personOfContact} (${editedData.pocDesignation})`
                  )}
                </td>
                <td>
                  <strong>
                    <i className="fa-solid fa-square-phone"></i> Contact No:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.contactNo}
                      onChange={(e) => handleChange(e, "contactNo")}
                    />
                  ) : (
                    <a
                      onClick={() => copyToClipboard(editedData.contactNo)}
                      href={`tel:${editedData.contactNo}`}
                    >
                      {editedData.contactNo}
                    </a>
                  )}
                </td>
              </tr>

              {editedData.personOfContact2 && (
                <tr>
                  <td>
                    <strong>
                      {" "}
                      <i className="fa-solid fa-id-badge"></i>Person of Contact
                      2:
                    </strong>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.personOfContact2}
                        onChange={(e) => handleChange(e, "personOfContact2")}
                      />
                    ) : (
                      editedData.personOfContact2
                    )}
                  </td>
                  <td>
                    <strong>Contact No 2:</strong>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.contactNo2}
                        onChange={(e) => handleChange(e, "contactNo2")}
                      />
                    ) : (
                      <a href={`tel:${editedData.contactNo2}`}>
                        {editedData.contactNo2}
                      </a>
                    )}
                  </td>
                </tr>
              )}

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-people-arrows"></i> Referral
                    Person:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.referralPerson}
                      onChange={(e) => handleChange(e, "referralPerson")}
                    />
                  ) : (
                    editedData.referralPerson
                  )}
                </td>
                <td>
                  <strong>
                    <i className="fa-solid fa-at"></i> Email ID:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedData.email}
                      onChange={(e) => handleChange(e, "email")}
                    />
                  ) : (
                    <a href={`mailto:${editedData.email}`}>
                      {editedData.email}
                    </a>
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-money-bill"></i> Initial Quotes
                    Price:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.fPrice}
                      onChange={(e) => handleChange(e, "fPrice")}
                    />
                  ) : (
                    `₹${editedData.fPrice}`
                  )}
                </td>
                <td>
                  <strong>
                    <i className="fa-solid fa-money-bill"></i> Final Agreed
                    Price:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.lPrice}
                      onChange={(e) => handleChange(e, "lPrice")}
                    />
                  ) : (
                    `₹${editedData.lPrice}`
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-calendar-days"></i> Last Contacted
                    Date:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedData.lastContacted}
                      onChange={(e) => handleChange(e, "lastContacted")}
                    />
                  ) : (
                    editedData.lastContacted
                  )}
                </td>
                <td>
                  <strong>
                    <i className="fa-solid fa-clock"></i> Next Follow Up Date:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedData.nextFollowUp}
                      onChange={(e) => handleChange(e, "nextFollowUp")}
                    />
                  ) : (
                    editedData.nextFollowUp
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-pen-to-square"></i> Remarks:
                  </strong>
                </td>
                <td colSpan="3">
                  {isEditing ? (
                    <textarea
                      style={{ width: "100%" }}
                      value={editedData.remarks}
                      onChange={(e) => handleChange(e, "remarks")}
                    />
                  ) : (
                    editedData.remarks
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Record table Mobile */}
          <table
            className="record-table mobile-view"
            style={{ width: "100%", borderSpacing: "0 10px" }}
          >
            <tbody>
              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-hospital"></i> Client Name:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.clientName}
                      onChange={(e) => handleChange(e, "institutionName")}
                    />
                  ) : (
                    editedData.clientName
                  )}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-calendar"></i> Initial Date:
                  </strong>
                </td>
                <td>{editedData.date}</td>
              </tr>

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-user-tie"></i> Associate:
                  </strong>
                </td>
                <td>{editedData.employeeName}</td>
              </tr>
              {(editedData.currentStatus || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-bookmark"></i> Status:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <select
                      value={editedData.currentStatus}
                      onChange={(e) => handleChange(e, "currentStatus")}
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Follow up needed">Follow-Up Needed</option>
                      <option value="Quotation Sent">Quotation Sent</option>
                      <option value="Awaiting Decision">
                        Awaiting Decision
                      </option>
                      <option value="Deal Closed">Converted (Deal Won)</option>
                      <option value="Deal Lost">
                        Not Interested (Deal Lost)
                      </option>
                    </select>
                  ) : (
                    editedData.currentStatus
                  )}
                </td>
              </tr>}

              {(editedData.place || isEditing) && (
                <tr>
                  <td>
                    <strong>
                      <i className="fa-solid fa-location-dot"></i> Place:
                    </strong>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.place}
                        onChange={(e) => handleChange(e, "place")}
                      />
                    ) : (
                      editedData.place
                    )}
                  </td>
                </tr>
              )}

              {(editedData.country || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-globe"></i> Country:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.country}
                      onChange={(e) => handleChange(e, "country")}
                    />
                  ) : (
                    editedData.country
                  )}
                </td>
              </tr>}

              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-id-badge"></i> Person of Contact:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.personOfContact}
                      onChange={(e) => handleChange(e, "personOfContact")}
                    />
                  ) : (
                    `${editedData.personOfContact} (${editedData.pocDesignation})`
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-square-phone"></i> Contact No:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.contactNo}
                      onChange={(e) => handleChange(e, "contactNo")}
                    />
                  ) : (
                    <a
                      onClick={() => copyToClipboard(editedData.contactNo)}
                      href={`tel:${editedData.contactNo}`}
                    >
                      {editedData.contactNo}
                    </a>
                  )}
                </td>
              </tr>

              {(editedData.personOfContact2 || isEditing) && (
                <>
                  <tr>
                    <td>
                      <strong>
                        {" "}
                        <i className="fa-solid fa-id-badge"></i>Person of
                        Contact 2:
                      </strong>
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.personOfContact2}
                          onChange={(e) => handleChange(e, "personOfContact2")}
                        />
                      ) : (
                        editedData.personOfContact2
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Contact No 2:</strong>
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.contactNo2}
                          onChange={(e) => handleChange(e, "contactNo2")}
                        />
                      ) : (
                        <a href={`tel:${editedData.contactNo2}`}>
                          {editedData.contactNo2}
                        </a>
                      )}
                    </td>
                  </tr>
                </>
              )}

              {(editedData.referralPerson || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-people-arrows"></i> Referral
                    Person:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.referralPerson}
                      onChange={(e) => handleChange(e, "referralPerson")}
                    />
                  ) : (
                    editedData.referralPerson
                  )}
                </td>
              </tr>}
              {(editedData.email || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-at"></i> Email ID:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editedData.email}
                      onChange={(e) => handleChange(e, "email")}
                    />
                  ) : (
                    <a href={`mailto:${editedData.email}`}>
                      {editedData.email}
                    </a>
                  )}
                </td>
              </tr>}

              {(editedData.fPrice || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-money-bill"></i> Initial Quotes
                    Price:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.fPrice}
                      onChange={(e) => handleChange(e, "fPrice")}
                    />
                  ) : (
                    `₹${editedData.fPrice}`
                  )}
                </td>
              </tr>}
              {(editedData.lPrice || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-money-bill"></i> Final Agreed
                    Price:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.lPrice}
                      onChange={(e) => handleChange(e, "lPrice")}
                    />
                  ) : (
                    `₹${editedData.lPrice}`
                  )}
                </td>
              </tr>}

              {(editedData.lastContacted || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-calendar-days"></i> Last Contacted
                    Date:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedData.lastContacted}
                      onChange={(e) => handleChange(e, "lastContacted")}
                    />
                  ) : (
                    editedData.lastContacted
                  )}
                </td>
              </tr>}
              {(editedData.nextFollowUp || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-clock"></i> Next Follow Up Date:
                  </strong>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedData.nextFollowUp}
                      onChange={(e) => handleChange(e, "nextFollowUp")}
                    />
                  ) : (
                    editedData.nextFollowUp
                  )}
                </td>
              </tr>}

              {(editedData.remarks || isEditing) &&<tr>
                <td>
                  <strong>
                    <i className="fa-solid fa-pen-to-square"></i> Remarks:
                  </strong>
                </td>
                <td colSpan="3">
                  {isEditing ? (
                    <textarea
                      style={{ width: "100%" }}
                      value={editedData.remarks}
                      onChange={(e) => handleChange(e, "remarks")}
                    />
                  ) : (
                    editedData.remarks
                  )}
                </td>
              </tr>}
            </tbody>
          </table>

          <div
            className="btn-div"
            style={{
              display: "flex",
              marginTop: "20px",
            }}
          >
            {isEditing ? (
              <button className="btn btn-success" onClick={handleSave}>
                Save Record
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleEdit}>
                Edit Record
              </button>
            )}
            <button
              className="btn btn-danger"
              onClick={() => handleDeleteRecord(viewRecordData.id)}
            >
              Delete Record
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewRecord;

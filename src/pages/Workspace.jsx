import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Modal,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import {
  addWorkspaceDocument,
  fetchWorkspaceDocuments,
  updateWorkspaceDocument,
  deleteWorkspaceDocument
} from "../services/workspaceService";
import './Workspace.css'

const Workspace = ({ companyId, userId }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docData, setDocData] = useState(null); // local editable copy
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(true);

  const [showDocModal, setShowDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");

  const [showClientModal, setShowClientModal] = useState(false);
  const [newClient, setNewClient] = useState("");

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [fieldClientIndex, setFieldClientIndex] = useState(null);

  // Load documents
  useEffect(() => {
    const loadDocs = async () => {
      try {
        const docs = await fetchWorkspaceDocuments(companyId, userId);
        setDocuments(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDocs();
  }, [companyId, userId]);

  const handleSelectDoc = (index) => {
    setSelectedDoc(index);
    setDocData(JSON.parse(JSON.stringify(documents[index]))); // deep copy
    setEditMode(false);
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim()) return;
    try {
      await addWorkspaceDocument(companyId, userId, newDocName);
      setDocuments([...documents, { name: newDocName, clients: [] }]);
      setNewDocName("");
      setShowDocModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddClient = () => {
    if (!newClient.trim() || !docData) return;
    const updated = { ...docData };
    updated.clients.push({ name: newClient, fields: [], notes: "" });
    setDocData(updated);
    setNewClient("");
    setShowClientModal(false);
  };

  const handleAddField = (clientIndex, label) => {
    if (!label) return;
    const updated = { ...docData };
    updated.clients[clientIndex].fields.push({ label, value: "" });
    setDocData(updated);
  };

  const handleFieldChange = (clientIndex, fieldIndex, value) => {
    const updated = { ...docData };
    updated.clients[clientIndex].fields[fieldIndex].value = value;
    setDocData(updated);
  };

  const handleNotesChange = (clientIndex, value) => {
    const updated = { ...docData };
    updated.clients[clientIndex].notes = value;
    setDocData(updated);
  };

  const handleDeleteField = (clientIndex, fieldIndex) => {
    const updated = { ...docData };
    updated.clients[clientIndex].fields.splice(fieldIndex, 1);
    setDocData(updated);
  };

  const handleDeleteClient = (clientIndex) => {
    const updated = { ...docData };
    updated.clients.splice(clientIndex, 1);
    setDocData(updated);
  };

  const handleSaveDoc = async () => {
    try {
      await updateWorkspaceDocument(companyId, userId, docData.name, docData);
      const updatedDocs = [...documents];
      updatedDocs[selectedDoc] = JSON.parse(JSON.stringify(docData));
      setDocuments(updatedDocs);
      setEditMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async () => {
    try {
      await deleteWorkspaceDocument(companyId, userId, docData.name);
      const updatedDocs = documents.filter((_, i) => i !== selectedDoc);
      setDocuments(updatedDocs);
      setSelectedDoc(null);
      setDocData(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="workspace-main">
      <Row>
        {/* Documents List */}
        <Col md={2}>
          <Card className="mb-3 shadow-sm rounded-3 border-0" style={{background: "linear-gradient(145deg, #f7f3f3ff, #f3eeeeff)"}}>
            <Card.Header style={{backgroundColor:'#1a1919ff'}} className="text-white rounded-top"><strong>Documents</strong></Card.Header>
            <Card.Body>
              {loading ? <Spinner animation="border" /> : (
                <>

                  <ListGroup variant="flush">
                    {documents.map((doc, idx) => (
  <ListGroup.Item
    key={idx}
    action
    active={selectedDoc === idx}
    onClick={() => handleSelectDoc(idx)}
    className="d-flex justify-content-between align-items-center"
    style={{
      borderRadius: "18px",
      marginBottom: "15px",
      backgroundColor: selectedDoc === idx ? "#383838ff" : "#c9c9c9ff", // change color if selected
      color: selectedDoc === idx ? "white" : "black", // adjust text color for contrast
      fontWeight: selectedDoc === idx ? "500" : "400",
      cursor: "pointer"
    }}
  >
    {doc.name}
  </ListGroup.Item>
))}

                  </ListGroup>
                  <Button 
                    className="mt-3 w-100" 
                    onClick={() => setShowDocModal(true)}
                    style={{background: "#2d5dfaff", border: "none"}}
                  >
                    + Add Document
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Document Details */}
        <Col md={6} style={{marginLeft:'80px'}}>
          {docData ? (
            <Card className="shadow-md rounded-1 border-3" style={{background: "#ffffffff"}}>
              <Card.Header className="bg-gradient rounded-top d-flex justify-content-between align-items-center" style={{background: "linear-gradient(90deg, #667eea, #764ba2)", color: "black"}}>
                <strong>{docData.name}</strong>
                <div>
                  {!editMode && <Button size="sm" variant="light" onClick={() => setEditMode(true)}>Edit</Button>}
                  {editMode && <>
                    <Button size="sm" variant="success" className="me-2" onClick={handleSaveDoc}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => {setDocData(JSON.parse(JSON.stringify(documents[selectedDoc]))); setEditMode(false);}}>Cancel</Button>
                  </>}
                </div>
              </Card.Header>
              <Card.Body>
                <Button size="sm" variant="danger" className="mb-2" onClick={handleDeleteDocument}>Delete Document</Button>
                {editMode && <Button size="sm" className="mb-2 ms-2" variant="info" onClick={() => setShowClientModal(true)}>+ Add Client</Button>}
                {docData.clients.length === 0 ? <p className="text-muted mt-3">No data</p> : (
                  docData.clients.map((client, ci) => (
                    <Card key={ci} className="mb-3 mt-2 shadow-sm rounded-3 p-2" style={{background: "white"}}>
                      <Card.Body>
                        <Row>
                          <Col><h6>{client.name}</h6></Col>
                          {editMode && <Col className="text-end"><Button size="sm" variant="danger" onClick={() => handleDeleteClient(ci)}>Delete Client</Button></Col>}
                        </Row>

                        {client.fields.map((f, fi) => (
                          <InputGroup key={fi} className="mb-3 mt-2">
                            <InputGroup.Text style={{background: "#1a1a1aff", color: "white"}}>{f.label}</InputGroup.Text>
                            <Form.Control
                              value={f.value}
                              disabled={!editMode}
                              onChange={(e) => handleFieldChange(ci, fi, e.target.value)}
                            />
                            {editMode && <Button variant="outline-danger" onClick={() => handleDeleteField(ci, fi)}>X</Button>}
                          </InputGroup>
                        ))}

                        {editMode && <Button size="sm" variant="secondary" className="mb-2 mt-2" onClick={() => {
                          setFieldClientIndex(ci);
                          setNewFieldLabel("");
                          setShowFieldModal(true);
                        }}>+ Add Field</Button>}

                        <Form.Group className="mt-2">
                          <Form.Label>Notes</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={client.notes}
                            disabled={!editMode}
                            onChange={(e) => handleNotesChange(ci, e.target.value)}
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Card.Body>
            </Card>
          ) : <p className="text-muted mt-4">Select a document to view details</p>}
        </Col>
      </Row>

      {/* Add Document Modal */}
      <Modal show={showDocModal} onHide={() => setShowDocModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Document</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Control placeholder="Document name" value={newDocName} onChange={e => setNewDocName(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDocModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddDocument}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Client Modal */}
      <Modal show={showClientModal} onHide={() => setShowClientModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Data</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Control placeholder="Data" value={newClient} onChange={e => setNewClient(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClientModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddClient}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Field Modal */}
      <Modal show={showFieldModal} onHide={() => setShowFieldModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Add Field</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Control placeholder="Field label" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFieldModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            if(newFieldLabel && fieldClientIndex !== null){
              handleAddField(fieldClientIndex, newFieldLabel);
              setShowFieldModal(false);
            }
          }}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Workspace;

import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { Form, FormControl, FormGroup, FormLabel, FormSelect } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { auth, db } from '../firebaseConfig';
import { logEvent } from 'firebase/analytics';
import './AddRecordModal.css'


const AddRecordModal = ({triggerRefresh, setTriggerRefresh, companyId, employeeName}) => {

    const [show, setShow] = useState(false);
    const [records,setRecords]=useState({date:"",clientName:"",priority:"",place:"",country:"",personOfContact:"",pocDesignation:"",contactNo:"",personOfContact2:"",contactNo2:"",referralPerson:"",email:"",associate:"",currentStatus:"",fPrice:"",lPrice:"",lastContacted:"",	nextFollowUp:"",	remarks:""})    
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
  const today = new Date().toISOString().split('T')[0];

    const openModal=()=>{
      handleShow()
      setRecords({date:today,clientName:"",priority:"",place:"",country:"",personOfContact:"",pocDesignation:"",contactNo:"",personOfContact2:"",contactNo2:"",referralPerson:"",email:"",associate:"",currentStatus:"New Lead",fPrice:"",lPrice:"",lastContacted:"",	nextFollowUp:"",	remarks:""})
    }



 const handleSubmit=async(e)=>{
  const {date,clientName,place,country,personOfContact,pocDesignation,contactNo,personOfContact2,contactNo2,referralPerson,email,associate,currentStatus,fPrice,lPrice,lastContacted,nextFollowUp,remarks}=records
  e.preventDefault();
    if(!clientName){
      alert("Enter Required Fields")
      return;
        }
        try{
          await addDoc(collection(db, "userData",companyId,"CRMdata" ),{
            date,
            clientName,
            priority,
            place,
            country,
            personOfContact,
            pocDesignation,
            contactNo,
            personOfContact2,
            contactNo2,
            referralPerson,
            email,
            currentStatus,
            fPrice,
            lPrice,
            lastContacted,	
            nextFollowUp,
            remarks,
            employeeName,
            companyId:companyId,
            associate: auth.currentUser.uid, // Store BDA who added it
            createdAt: new Date()
          })

        }catch(err){
          console.log(err);
        }
  handleClose()
  setTriggerRefresh(!triggerRefresh)
 }


    return (
        <>
            <button style={{background:'none', border:'none'}} onClick={openModal}><i title='Add New Record' className="fa-solid fa-file-circle-plus"></i></button>
            <Modal show={show} onHide={handleClose} dialogClassName="custom-modal" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Add a new Record</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>

          {/* Date */}
          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control type="date" placeholder="Enter todays date" onChange={(e)=>setRecords({...records,date:e.target.value})} />
          </Form.Group>
          {/* Client Name */}
          <Form.Group className="mb-3">
            <Form.Label>Client Name*</Form.Label>
            <Form.Control type="text" placeholder="Enter Client Name" onChange={(e)=>setRecords({...records,clientName:e.target.value})} />
          </Form.Group>

          {/* Priority dropdwon */}
          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select onChange={(e)=>setRecords({...records,priority:e.target.value})}>
              <option value="" disabled selected>Select Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              </Form.Select>
          </Form.Group>

          {/* Place */}
          <Form.Group className="mb-3">
            <Form.Label>Place</Form.Label>
            <Form.Control type="text" placeholder="Enter Place of Client" onChange={(e)=>setRecords({...records,place:e.target.value})} />
          </Form.Group>

          {/* Country */}
          <Form.Group className="mb-3">
            <Form.Label>Country</Form.Label>
            <Form.Control type="text" placeholder="Enter Country of instituion" onChange={(e)=>setRecords({...records,country:e.target.value})} />
          </Form.Group>

          {/* Contact Person */}
          <Form.Group className="mb-3">
            <Form.Label>Contact Person</Form.Label>
            <Form.Control type="text" placeholder="Enter Contact Person's Name" onChange={(e)=>setRecords({...records,personOfContact:e.target.value})}/>
          </Form.Group>

          {/* Rep Designation */}
          <Form.Group className="mb-3">
            <Form.Label>Contact Person Designation</Form.Label>
            <Form.Control type="text" placeholder="Enter Contact Person's Designation" onChange={(e)=>setRecords({...records,pocDesignation:e.target.value})}/>
          </Form.Group>

          {/* Contact Number */}
          <Form.Group className="mb-3">
            <Form.Label>Contact Number</Form.Label>
            <Form.Control type="number" placeholder="Enter Contact Number" onChange={(e)=>setRecords({...records,contactNo:e.target.value})}/>
          </Form.Group>

          {/* Contact Person 2*/}
          <Form.Group className="mb-3">
            <Form.Label>Contact Person 2(optional)</Form.Label>
            <Form.Control type="text" placeholder="Enter other contact Person's Name" onChange={(e)=>setRecords({...records,personOfContact2:e.target.value})}/>
          </Form.Group>

          {/* Contact Number 2*/}
          <Form.Group className="mb-3">
            <Form.Label>Contact person 2 Number</Form.Label>
            <Form.Control type="number" placeholder="Enter 2nd contact person Number" onChange={(e)=>setRecords({...records,contactNo2:e.target.value})}/>
          </Form.Group>

          {/* Representative */}
          <Form.Group className="mb-3">
            <Form.Label>Referral</Form.Label>
            <Form.Control type="text" placeholder="Enter Referral person's Name" onChange={(e)=>setRecords({...records,referralPerson:e.target.value})}/>
          </Form.Group>

          {/* Email */}
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" placeholder="Enter Email ID" onChange={(e)=>setRecords({...records,email:e.target.value})}/>
          </Form.Group>

          {/* Status Dropdown */}
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select onChange={(e)=>setRecords({...records,currentStatus:e.target.value})}>
              <option value="" disabled selected>Select Status</option>
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Follow up needed">Follow-Up Needed</option>
              <option value="Quotation Sent">Quotation Sent</option>
              <option value="Awaiting Decision">Awaiting Decision</option>
              <option value="Token Recieved">Token Recieved</option>
              <option value="Deal Closed">Converted (Deal Won)</option>
              <option value="Deal Lost">Not Interested (Deal Lost)</option>
            </Form.Select>
          </Form.Group>

          {/* fPrice */}
          <Form.Group className="mb-3">
            <Form.Label>Quoted Price</Form.Label>
            <Form.Control type="number" placeholder="Enter the first quoted price" onChange={(e)=>setRecords({...records,lPrice:e.target.value})}/>
          </Form.Group>

          {/* lPrice */}
          <Form.Group className="mb-3">
            <Form.Label>Last Agreed Price</Form.Label>
            <Form.Control type="number" placeholder="Enter the agreed price" onChange={(e)=>setRecords({...records,fPrice:e.target.value})}/>
          </Form.Group>

          {/* Last Contacted Date */}
          <Form.Group className="mb-3">
            <Form.Label>Last Contacted</Form.Label>
            <Form.Control type="date" onChange={(e)=>setRecords({...records,lastContacted:e.target.value})}/>
          </Form.Group>

          {/* Next Follow-Up Date */}
          <Form.Group className="mb-3">
            <Form.Label>Next Follow-Up</Form.Label>
            <Form.Control type="date" onChange={(e)=>setRecords({...records,nextFollowUp:e.target.value})}/>
          </Form.Group>

          {/* Remarks */}
          <Form.Group className="mb-3">
            <Form.Label>Remarks</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="Enter any additional remarks" onChange={(e)=>setRecords({...records,remarks:e.target.value})}/>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Add New Record
        </Button>
      </Modal.Footer>
    </Modal>
        </>
    )
}

export default AddRecordModal
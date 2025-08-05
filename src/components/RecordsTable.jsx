import React, { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import { fetchCRMRecords } from '../services/fetchRecords';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './RecordsTable.css';
import getBDAName from '../services/fetchNames';
import fetchChildBDAs from '../services/fetchChildRecords';
import loadingImg from '../assets/loading.png'
import ViewRecord from './ViewRecord';
import { Badge } from 'react-bootstrap';
import Summary from './Summary';
import UpcomingFollowUps from './UpcomingFollowUps';
import StatusChart from './StatusChart';
import ClientPerEmployeeChart from './ClientPerEmployeeChart';
const adminId = import.meta.env.VITE_ADMIN_ID

const RecordsTable = ({ triggerRefresh, admin, currentUser, companyId, allEmployees }) => {

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  const [updateTable, setUpdateTable] = useState(false)
  const [viewRecord, setViewRecord] = useState(false)
  const [viewRecordData, setViewRecordData] = useState({})
  const [records, setRecords] = useState([]);  
  const [displayedRecords, setDisplayedRecords] = useState([])  
  const [loading, setLoading] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  
  const [selectedStatus,setSelectedStatus]=useState('all')
console.log(selectedStatus);

    
// Filtering data
  const filterDisplay = async () => {
    if (employeeFilter === 'all') {
      setDisplayedRecords(records);
      return;
    }else{
      setDisplayedRecords(records.filter(rec=>rec.associate === employeeFilter))
    }
  };
  console.log(records);
  

  useEffect(() => {
    filterDisplay()
  }, [employeeFilter, records])

  const searchFilter = (value) => {
    setSearchText(value);

    const filtered = records.filter(record =>
      Object.values(record).some(field =>
        String(field).toLowerCase().includes(value.toLowerCase())
      )
    );
    setDisplayedRecords(filtered);
  };

 useEffect(() => {
  const fetchCRMData = async () => {
    if (currentUser && companyId) {
      const CRMDataRef = await fetchCRMRecords(companyId, currentUser.uid);
      setRecords(CRMDataRef)
      setDisplayedRecords(CRMDataRef)
      console.log(displayedRecords);
      setLoading(false)
    } else {
      console.warn("Missing currentUser or companyId");
    }
  };

  fetchCRMData();
}, [currentUser, companyId,triggerRefresh,updateTable] );



console.log(formattedDate);




  const getStatusColor = (status) => {
    switch (status) {
      case 'New Lead':
        return '#a3c9f1'; // Pastel Blue
      case 'Contacted':
        return '#a0d6e8'; // Pastel Teal
      case 'Interested':
        return '#b0eacb'; // Pastel Green
      case 'Follow up needed':
        return '#fff3b0'; // Pastel Yellow
      case 'Quotation Sent':
        return '#d2b7e5'; // Pastel Purple
      case 'Awaiting Decision':
        return '#ffd8a8'; // Pastel Orange
      case 'Deal Closed':
      case 'Converted (Deal Won)':
        return '#b2f2bb'; // Pastel Mint Green
      case 'Deal Lost':
      case 'Not Interested (Deal Lost)':
        return '#f5b7b1'; // Pastel Red
      default:
        return '#d6d6d6'; // Light Gray for unknown
    }
  };
  

  // Highlighting Function
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = String(text).split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: 'var(--secondary-color)', fontWeight: 'bold', borderRadius: '0px', padding: '1% 0% 1% 1%' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  


  // const fetchChilds = async () => {
  //   try {
  //     const childBDAids = await fetchChildBDAs();

  //     if (childBDAids.length === 0) return; // No child BDAs, exit early

  //     // Fetch records for all child BDAs in parallel
  //     const childRecordsArrays = await Promise.all(
  //       childBDAids.map(id => fetchRecords(id)) // Each fetchRecords() call returns an array
  //     );

  //     // Flatten the array since each fetchRecords call returns an array
  //     const allChildRecords = childRecordsArrays.flat();

  //     console.log("All Child Data:", allChildRecords);

  //     // Update state with all fetched records at once
  //     setRecords(prevRecords => [...prevRecords, ...allChildRecords]);

  //   } catch (err) {
  //     console.error("Error fetching child data:", err);
  //   }
  // };

  const getViewRecord = (record) => {
    setViewRecord(true)
    setViewRecordData(record)
  }

  if (loading) return <div className='loadingDiv' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h1 style={{ textAlign: 'center', margin: '10%' }}>Loading records <img src={loadingImg} width={'50px'} alt="image" /></h1></div>;

  if (!currentUser) return <p>Please log in to view records.</p>;

  return (
    <div>
      {
        viewRecord == true && <ViewRecord setViewRecord={setViewRecord} viewRecordData={viewRecordData} setUpdateTable={setUpdateTable} updateTable={updateTable} companyId={companyId}/>}
<UpcomingFollowUps records={records}/>
<div className='insights'>
<StatusChart records={displayedRecords}/>
<ClientPerEmployeeChart records={records}/>
</div>
<div className='tableSelect'>
          {/* Search Bar */}
          <div className='filter-main'>
            <div className="input-group" >
              <span className="input-group-text">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input onChange={(e) => searchFilter(e.target.value)} type="text" className="search-box" placeholder="Search records" />
            </div>
            <div className='filters'>
              {/* Associate Filter */}
              <label htmlFor="associateSelect" style={{textWrap:'nowrap',marginLeft:'50px'}}>Associate</label>
              <select style={{color:'black'}} name="" id="associateSelect" onChange={(e) => setEmployeeFilter(e.target.value)}>
                <option disabled>Select Associate</option>
                <option value={'all'}>All</option>
  
                {allEmployees.length > 0 &&
                  allEmployees.map((employee) =>
                    <option value={employee.uid} key={employee.uid}>
                      {employee.empName}
                    </option>
                  )}
              </select>
  
              {/* Common filter */}
              {/* <select name="" id="">
                <option disabled >Select Filter</option>
              </select> */}
  
              {/* Sort By */}
              {/* <select name="" id="">
                <option disabled >Sort By</option>
              </select> */}
            </div>
          </div>
          </div>
          <Summary selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} getStatusColor={getStatusColor} displayRecords={displayedRecords}/>
      <div className='tableMain'>

        <table className="recordsTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Client</th>
              <th id='hide-mobile'>Place</th>
              {/* <th>Country</th> */}
              <th id='hide-mobile'>Person of Contact</th>
              {/* <th>POC Designation</th> */}
              <th id='hide-mobile'>Contact No</th>
              {/* <th>Second contact person</th> */}
              {/* <th>Second contact person number</th> */}
              {/* <th>Referral Person</th> */}
              {/* <th>Email</th> */}
              <th id='hide-mobile'>Associate</th>
              <th>Status</th>
              {/* <th>First quoted Price</th> */}
              {/* <th>Final Agreed price</th> */}
              {/* <th>Last Contacted</th> */}
              <th id='hide-mobile'>Next Follow Up</th>
              {/* <th>Remarks</th> */}
            </tr>
          </thead>
          <tbody>
  {displayedRecords.length > 0 ? (
    displayedRecords
      .filter(record => selectedStatus === 'all' || record.currentStatus === selectedStatus)
      .map((record, index) => (
        <tr key={record.id} onClick={() => getViewRecord(record)}>
          <td>{index + 1}</td>
          <td className='client-td'>
            {highlightText(record.clientName, searchText)}
          </td>
          <td id='hide-mobile'>
            {highlightText(record.place, searchText)}
          </td>
          <td id='hide-mobile'>
            {highlightText(record.personOfContact, searchText)}
          </td>
          <td id='hide-mobile'>
            {highlightText(record.contactNo, searchText)}
          </td>
          <td id='hide-mobile'>
            {highlightText(record.employeeName, searchText)}
          </td>
          <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '20px' }}>
            <p style={{
              backgroundColor: getStatusColor(record.currentStatus),
              padding: '5px 10px',
              borderRadius: '40px',
              textWrap: 'nowrap',
              width: 'fit-content'
            }}>
              {highlightText(record.currentStatus, searchText)}
            </p>
          </td>
          <td
  id="hide-mobile"
  style={
    record.nextFollowUp && new Date(record.nextFollowUp) < new Date(formattedDate)
      ? { backgroundColor: 'var(--warning-color)' }
      : {}
  }
>

            {highlightText(record.nextFollowUp, searchText)}
          </td>
        </tr>
      ))
  ) : (
    <tr>
      <td colSpan="10" style={{ textAlign: 'center' }}>No records found</td>
    </tr>
  )}
</tbody>

        </table>
      </div>
    </div>
  );
};

export default RecordsTable;

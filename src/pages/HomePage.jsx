import React, { useEffect, useRef, useState } from 'react';
import './Homepage.css';
import RecordsTable from '../components/RecordsTable';
import AddRecordModal from '../components/AddRecordModal';
import  { fetchAdminName, getCurrentUser, getEmployeeName } from '../services/fetchNames';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AdminDashboard from '../components/AdminDashboard';
import { auth } from '../firebaseConfig';
import Notification from '../components/Notification';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { fetchAllEmployees, getUserCompanyDetails } from '../services/fetchRecords';
import { Await } from 'react-router-dom';
import Nav from '../components/Nav';
import ChatAI from '../components/ChatAI';

const HomePage = () => {
  const [userName, setUserName] = useState("BD Associate");
  const [triggerRefresh, setTriggerRefresh] = useState(true)
  const [companyId, setCompanyId] = useState('')
  const [currentUser, setCurrentUser] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [allEmployees, setAllmployees] = useState([])
  const [admin,setAdmin]=useState(false)
  console.log(allEmployees);
  


  
useEffect(() => {
  const auth = getAuth();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Try to fetch admin name first
        const adminName = await fetchAdminName(user.uid);
        
        if (adminName) {
          setUserName(adminName);
          setAdmin(true); // Optional: mark user as admin
        } else {
          // Not an admin, fallback to BDA          
          const userName = await getUserCompanyDetails(user.uid);
          setUserName(userName.companyName || "BD Associate");
          setAdmin(false); // Optional
        }

      } catch (err) {
        console.error("Error fetching user name:", err);
        setUserName("Unknown");
      }
    }
  });

  return () => unsubscribe();
}, [triggerRefresh]);


  useEffect(() => {
  const fetchCompanyDetails = async () => {
    const userRef = await getCurrentUser();
    setCurrentUser(userRef);

    try {
      // Check if user is an admin (i.e., document exists at userData/{userId})
      const adminDocRef = doc(db, 'userData', userRef.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        // Admin user
        setCompanyId(userRef.uid);
        const adminData = adminDocSnap.data();
        setEmployeeName(adminData.companyName || "Admin");
      } else {
        // Employee user
        const detRef = await getUserCompanyDetails(userRef.uid);
        const nameRef = await getEmployeeName(userRef.uid);

        if (detRef?.companyId) setCompanyId(detRef.companyId);
        setEmployeeName(nameRef || "Employee");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  fetchCompanyDetails();
}, []);

useEffect(()=>{
  const getAllEmployees=async()=>{
    const allEmployeesRef=await fetchAllEmployees(companyId)
    setAllmployees(allEmployeesRef)
  };getAllEmployees()
},[companyId])



  return (
    <>
    <Nav employeeName={employeeName}/>
    
      <div style={{ display: 'flex', alignItems: 'center' }}><h1 className='homeTitle'> {userName}</h1><AddRecordModal triggerRefresh={triggerRefresh} setTriggerRefresh={setTriggerRefresh} companyId={companyId} employeeName={employeeName} /></div>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'start' }}>
        {/* <button style={{ margin: '1%' }} className='btn btn-secondary'>View Associates</button> */}
      </div>


      {/* { admin==true&&(
      <div style={{margin:'3%'}}><AdminDashboard/></div>
      )
} */}
<ChatAI companyId={companyId}/>
      <RecordsTable triggerRefresh={triggerRefresh} allEmployees={allEmployees} currentUser={currentUser} companyId={companyId}/>
    </>
  );
};

export default HomePage;

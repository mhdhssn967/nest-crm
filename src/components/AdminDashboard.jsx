import React, { useEffect, useState } from 'react'
import './AdminDashboard.css'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useFetcher } from 'react-router-dom'

const AdminDashboard = () => {

  const today = new Date();
  const twoDaysLater = new Date()
  twoDaysLater.setDate(today.getDate() + 2);

  const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const formattedDate2daysLater = twoDaysLater.toISOString().split('T')[0]; // YYYY-MM-DD format


  const [records, setRecords] = useState([])
  const [user, setUser] = useState(null)
  const [BDAcount, setBDACount] = useState(0)
  const [dealsClosed, setDealsClosed] = useState([])
  const [dealsLoast, setDealsLost] = useState([])
  const [pendingFollowUps, setPendingFollowUps] = useState([])
  const [upcomingFollowUps, setupcomingFollowUps] = useState([])  
  const [totalRevenue,setTotalRevenue] = useState(0)



  useEffect(() => {
    const uniqueAssociates = new Set(records.map(record => record.associate));
    setBDACount(uniqueAssociates.size)
    const closedDeals = records.filter(record => record.currentStatus == 'Deal Closed')
    setDealsClosed(closedDeals)
    const lostDeals = records.filter(record => record.currentStatus == 'Deal Lost')
    setDealsLost(lostDeals)
    const followPending = records.filter(record => record.nextFollowUp <= formattedDate)
    setPendingFollowUps(followPending)
    const followUpComing = records.filter(record => record.nextFollowUp >= formattedDate && record.nextFollowUp <= formattedDate2daysLater)
    setupcomingFollowUps(followUpComing)
    const revenueTotal = records.reduce((sum, record) => {
    let price = record.lPrice ? Number(record.lPrice) : 0; // Handle empty values
    return sum + (isNaN(price) ? 0 : price); // Ensure no NaN values
}, 0);
setTotalRevenue(revenueTotal)
  }, [records])


  return (
    <>
          <div className='dashContainer'>
            <div className='dashMain'>
              <p>Total Leads : {records.length}</p>
            </div>
            <div className='dashMain'>
              <p>No of associates : {BDAcount}</p>
            </div>
            <div className='dashMain'>
              <p>Deals Closed: {dealsClosed.length}</p>
            </div>
            <div className='dashMain'>
              <p>Deals Lost : {dealsLoast.length}</p>
            </div>
            <div className='dashMain'>
              <p>Pending Follow-ups : {pendingFollowUps.length}</p>
            </div>
            <div className='dashMain'>
              <p>Upcoming Follow Ups : {upcomingFollowUps.length}</p>
            </div>
            <div className='dashMain'>
              <p>Total Revenue from closed deals : {totalRevenue}</p>
            </div>
          </div>

    </>
  )
}

export default AdminDashboard
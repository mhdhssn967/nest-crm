import React from 'react'
import './Navbar.css'
import logo from '../assets/OQ.png'
import Notification from './Notification'
import { auth } from '../firebaseConfig'


const Nav = () => {
   const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/login'; // Redirect to login
  };
  return (
    <>
    <div className='nav'>
      <div style={{display:'flex',alignItems:'center',textWrap:'nowrap'}}>
        
            <img src={logo} style={{width:'50px'}} alt="" />
            <h1>Oqulix CRM</h1>
     
      </div>
        <div>
          <button onClick={handleLogout} className='logout-btn'>Logout</button>
      
        </div></div>
    </>
  )
}

export default Nav
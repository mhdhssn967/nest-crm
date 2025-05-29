import React from 'react'
import './Navbar.css'
import logo from '../assets/OQ.png'
import Notification from './Notification'
import { auth } from '../firebaseConfig'


const Nav = ({employeeName}) => {
   const handleLogout = async () => {
    await auth.signOut();
    window.location.href = '/login'; // Redirect to login
  };
  return (
    <>
    <div className='nav'>
      <div style={{display:'flex',alignItems:'center',textWrap:'nowrap'}}>
        
            <img src={logo} alt="" />
     
      </div>
        <div className='nav-right'>
          <p style={{textWrap:'nowrap'}}><i className="fa-solid fa-circle-user"></i>{employeeName}</p>
          <button onClick={handleLogout} className='logout-btn'>Logout</button>
      
        </div></div>
    </>
  )
}

export default Nav
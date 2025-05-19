import React from 'react'
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import './Notification.css'


const Notification = ({...props}) => {

    const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return (
    <>
     <div className='notificationPanel'>
          <button  onClick={handleShow}><i className="fa-solid fa-bell"></i></button>
          <Offcanvas show={show} onHide={handleClose} {...props}>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Notifications</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className='notificationMessage'>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos obcaecati voluptas </p>
              </div>
              <div className='notificationMessage'>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos obcaecati voluptas </p>
              </div>
              <div className='notificationMessage'>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Dignissimos obcaecati voluptas </p>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
     </div>
    </>
  )
}

export default Notification
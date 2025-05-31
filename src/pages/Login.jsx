import React, { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { Form, Button, Container, Alert, Spinner } from "react-bootstrap";
import login from '../assets/OQ.png';
import './Login.css';
import loadingGif from  '../assets/loadingto.gif'

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/");
      } else {
        setLoading(false); // Only show login form if not logged in
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  // Loading screen while checking auth
  if (loading) {
    return (
      <>
      <div style={{width:'100vw',height:'100vh',backgroundColor:'#2f2e34',display:'flex',justifyContent:'center',alignItems:'center'}}>
        <img src={loadingGif} width={'600xp'} alt="" />
      </div>
      </>
    );
  }

  return (
    <Container className="loginContainer">
      <div className="loginDiv" style={{ boxShadow: '0px 0px 5px var(--secondary-color)' }}>
        <div className="d-flex align-items-center justify-content-center flex-column">
          <img className="m-3" src={login} alt="" width={'70px'} style={{ filter: 'invert(1)' }} />
          <h1 style={{ fontWeight: '100' }}>Oqulix CRM</h1>
        </div>

        <h2 className="text-center">Login</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleLogin}>
          <Form.Group controlId="email">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group controlId="password" className="mt-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 mt-3">
            Login
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default Login;

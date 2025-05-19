import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage"; // Your homepage
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
    <>
     <Router>
       <Routes>
        <Route path="/login" element={<Login />} />
  
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
     </Router>
    </>
  );
}

export default App;

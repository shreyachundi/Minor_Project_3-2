import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Login/Login';
import Register from './components/Login/Register'; // Add this import
import GuideDashboard from './components/Guide/GuideDashboard';
import StudentDashboard from './components/Student/StudentDashboard';
import ForgotPassword from './components/Login/ForgotPassword';
// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* Add this route */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route 
            path="/guide" 
            element={
              <ProtectedRoute>
                <GuideDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
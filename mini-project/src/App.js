import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Add this import
import './App.css';

// Import components
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import GuideDashboard from './components/Guide/GuideDashboard';
import StudentDashboard from './components/Student/StudentDashboard';
import ForgotPassword from './components/Login/ForgotPassword';
import LogSheetPage from './pages/LogSheetPage';

// Import Project Details components
import ProjectDetails from './components/Guide/ProjectDetails';
import StudentProjectDetails from './components/Student/StudentProjectDetails';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Role-based route component
const RoleBasedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Log Sheet Route - Can be accessed by both guide and student */}
            <Route 
              path="/logsheet/:projectId" 
              element={
                <ProtectedRoute>
                  <LogSheetPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Guide Routes */}
            <Route 
              path="/guide" 
              element={
                <RoleBasedRoute allowedRole="guide">
                  <GuideDashboard />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/guide/project/:projectId" 
              element={
                <RoleBasedRoute allowedRole="guide">
                  <ProjectDetails />
                </RoleBasedRoute>
              } 
            />
            
            {/* Student Routes */}
            <Route 
              path="/student" 
              element={
                <RoleBasedRoute allowedRole="student">
                  <StudentDashboard />
                </RoleBasedRoute>
              } 
            />
            <Route 
              path="/student/project/:projectId" 
              element={
                <RoleBasedRoute allowedRole="student">
                  <StudentProjectDetails />
                </RoleBasedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch all - 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LogSheet from '../components/LogSheet/LogSheet';
import { useAuth } from '../context/AuthContext';
import './LogSheetPage.css';

const LogSheetPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get userRole from navigation state or from auth context
  // Priority: 1. location.state, 2. user?.role, 3. default to 'student'
  const userRole = location.state?.userRole || user?.role || 'student';
  const userName = user?.name || location.state?.userName || 'User';

  console.log('🔍 LogSheetPage - Received state:', location.state);
  console.log('🔍 LogSheetPage - User Role:', userRole);
  console.log('🔍 LogSheetPage - User Name:', userName);

  return (
    <div className="logsheet-page-container">
      <div className="logsheet-page-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <h1>Project Log Sheet</h1>
      </div>
      
      <LogSheet 
        projectId={projectId} 
        userRole={userRole}
        userName={userName}
      />
    </div>
  );
};

export default LogSheetPage;
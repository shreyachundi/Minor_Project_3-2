import React, { useState, useEffect, useRef } from 'react';
import API from '../../services/api';
import './LogSheet.css';

const LogSheet = ({ projectId, userRole, userName }) => {
  const [logSheet, setLogSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ workCarried: '', remarks: '' });
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [savingHallTicket, setSavingHallTicket] = useState(false);
  
  // Add ref for print content
  const printRef = useRef();

  console.log('📋 LogSheet Component - Props:', { projectId, userRole, userName });
  
  const isGuide = userRole === 'guide';
  console.log('📋 Is Guide?', isGuide);

  useEffect(() => {
    console.log('🔍 LogSheet mounted with projectId:', projectId);
    console.log('🔍 User role:', userRole);
    console.log('🔍 Is Guide:', isGuide);
    console.log('🔍 User name:', userName);
    
    fetchLogSheet();
  }, [projectId, userRole]);

  // Print function
  const handlePrint = () => {
    const printContent = printRef.current;
    const originalTitle = document.title;
    
    // Store original styles
    const originalStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
    const stylesHTML = Array.from(originalStyles)
      .map(style => style.outerHTML)
      .join('');

    // Create print window
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Project Log Sheet - ${logSheet?.projectTitle || 'AcadSync'}</title>
          ${stylesHTML}
          <style>
            /* Print-specific styles */
            @media print {
              body { 
                background: white !important; 
                padding: 20px !important;
              }
              .whatsapp-attach-btn,
              .edit-btn,
              .sign-btn,
              .hod-sign-btn,
              .refresh-btn,
              .back-btn,
              .message-reply-btn,
              .send-reply-btn,
              .cancel-reply,
              .file-attachment-modal,
              .whatsapp-input-area,
              .role-badge {
                display: none !important;
              }
              .logsheet-container {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .logsheet-table {
                border: 2px solid #000 !important;
              }
              .logsheet-table th {
                background: #f0f0f0 !important;
                color: #000 !important;
              }
              .signed {
                background: #e8f5e9 !important;
                border: 1px solid #4caf50 !important;
                color: #2c3e50 !important;
              }
            }
          </style>
        </head>
        <body style="background: white; padding: 40px; font-family: Arial, sans-serif;">
          ${printContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Print after a short delay to ensure styles are loaded
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const fetchLogSheet = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📤 Fetching log sheet for project:', projectId);
      const response = await API.get(`/logsheet/project/${projectId}`);
      
      console.log('📥 Log sheet response:', response.data);
      
      if (response.data.success) {
        setLogSheet(response.data.logSheet);
      } else {
        setError('Failed to load log sheet: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error fetching log sheet:', error);
      setError('Failed to load log sheet');
      setErrorDetails(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (entry) => {
    console.log('✏️ Edit clicked - Is Guide?', isGuide);
    if (!isGuide) {
      alert('Only guides can edit the log sheet');
      return;
    }
    setEditingEntry(entry._id);
    setEditForm({
      workCarried: entry.workCarried || '',
      remarks: entry.remarks || ''
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSubmit = async (entryId) => {
    if (!isGuide) {
      alert('Only guides can edit the log sheet');
      return;
    }
    
    try {
      console.log('📤 Submitting edit for entry:', entryId, editForm);
      const response = await API.put(`/logsheet/entry/${entryId}`, editForm);
      console.log('📥 Edit response:', response.data);
      
      if (response.data.success) {
        setLogSheet(prev => ({
          ...prev,
          entries: prev.entries.map(e => 
            e._id === entryId ? response.data.entry : e
          )
        }));
        setEditingEntry(null);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSignEntry = async (entryId) => {
    if (!isGuide) {
      alert('Only guides can sign entries');
      return;
    }
    
    try {
      console.log('📤 Signing entry:', entryId);
      const response = await API.post(`/logsheet/entry/${entryId}/sign`, {
        signatureData: `✓ Signed by ${userName} on ${new Date().toLocaleDateString()}`
      });
      console.log('📥 Sign response:', response.data);
      
      if (response.data.success) {
        setLogSheet(prev => ({
          ...prev,
          entries: prev.entries.map(e => 
            e._id === entryId ? response.data.entry : e
          )
        }));
      }
    } catch (error) {
      console.error('Error signing entry:', error);
      alert('Failed to sign entry: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleHODSign = async () => {
    if (!isGuide) {
      alert('Only guides can sign as HOD');
      return;
    }
    
    try {
      console.log('📤 Adding HOD signature');
      const response = await API.post(`/logsheet/hod-signature/${projectId}`, {
        signatureData: `✓ Signed by HOD on ${new Date().toLocaleDateString()}`,
        remarks: 'Approved'
      });
      console.log('📥 HOD signature response:', response.data);
      
      if (response.data.success) {
        setLogSheet(response.data.logSheet);
      }
    } catch (error) {
      console.error('Error adding HOD signature:', error);
      alert('Failed to add HOD signature: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleHallTicketChange = (index, value) => {
    if (!isGuide) return;
    
    const updated = [...logSheet.students];
    updated[index].hallTicketNumber = value;
    setLogSheet({...logSheet, students: updated});
  };

  const handleHallTicketBlur = async (index) => {
    if (!isGuide) return;
    
    const student = logSheet.students[index];
    if (!student) return;
    
    setSavingHallTicket(true);
    
    try {
      console.log('📤 Saving hall ticket for student:', student.name, '->', student.hallTicketNumber);
      
      const response = await API.put(`/logsheet/student/${projectId}/${index}`, {
        hallTicketNumber: student.hallTicketNumber
      });
      
      console.log('📥 Hall ticket save response:', response.data);
      
    } catch (error) {
      console.error('Error saving hall ticket:', error);
      alert('Failed to save hall ticket number: ' + (error.response?.data?.message || error.message));
      fetchLogSheet();
    } finally {
      setSavingHallTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading log sheet...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>❌ {error}</h2>
          <p className="error-details">{errorDetails}</p>
          
          <div className="debug-info">
            <h4>Debug Information:</h4>
            <ul>
              <li><strong>Project ID:</strong> {projectId}</li>
              <li><strong>User Role:</strong> {userRole}</li>
              <li><strong>Is Guide:</strong> {isGuide ? 'Yes' : 'No'}</li>
            </ul>
          </div>
          
          <div className="error-actions">
            <button onClick={fetchLogSheet} className="retry-btn">
              🔄 Retry
            </button>
            <button onClick={() => window.history.back()} className="back-btn">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!logSheet) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>No Log Sheet Found</h2>
          <p>The log sheet for this project could not be found.</p>
          <button onClick={fetchLogSheet} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="logsheet-container" ref={printRef}>
      <div className="logsheet-header">
        <div className="header-actions">
          <button 
            className="print-btn"
            onClick={handlePrint}
            title="Print Log Sheet"
          >
            <i className="fas fa-print"></i> Print
          </button>
        </div>
        <h1>G. NARAYANAMMA INSTITUTE OF TECHNOLOGY AND SCIENCE</h1>
        <h2>(Autonomous) (For Women)</h2>
        <h3>Department of Information Technology</h3>
        <h3>Mini-Project Log Sheet</h3>
        {isGuide ? (
          <div className="role-badge guide-badge">
            <i className="fas fa-chalkboard-teacher"></i> Guide Mode - You can edit
            {savingHallTicket && <span className="saving-indicator"> Saving...</span>}
          </div>
        ) : (
          <div className="role-badge student-badge">
            <i className="fas fa-user-graduate"></i> Student Mode - View Only
          </div>
        )}
      </div>

      {/* Rest of your existing JSX remains exactly the same */}
      <div className="logsheet-info">
        <table className="info-table">
          <tbody>
            <tr>
              <td><strong>Title of the Project:</strong></td>
              <td>{logSheet.projectTitle}</td>
            </tr>
            <tr>
              <td><strong>Class & Semester:</strong></td>
              <td>{logSheet.class}</td>
            </tr>
            <tr>
              <td><strong>Academic Year:</strong></td>
              <td>{logSheet.academicYear}</td>
            </tr>
            <tr>
              <td><strong>Project Batch Number:</strong></td>
              <td>{logSheet.batchNumber}</td>
            </tr>
            <tr>
              <td><strong>Internal Guide:</strong></td>
              <td>{logSheet.internalGuide?.name || 'Not Assigned'}, {logSheet.internalGuide?.designation || 'Assistant professor'}, {logSheet.internalGuide?.department || 'IT'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="students-info">
        <h4>Student Details:</h4>
        <table className="students-table">
          <thead>
            <tr>
              <th>S. No</th>
              <th>Hall Ticket Number</th>
              <th>Name of the Student</th>
            </tr>
          </thead>
          <tbody>
            {logSheet.students && logSheet.students.length > 0 ? (
              logSheet.students.map((student, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    {isGuide ? (
                      <input
                        type="text"
                        value={student.hallTicketNumber || ''}
                        onChange={(e) => handleHallTicketChange(index, e.target.value)}
                        onBlur={() => handleHallTicketBlur(index)}
                        className="hallticket-input"
                        placeholder="Enter Hall Ticket"
                      />
                    ) : (
                      <span className="readonly-text">{student.hallTicketNumber || '—'}</span>
                    )}
                  </td>
                  <td>{student.name}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No students assigned</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="logsheet-table-container">
        <table className="logsheet-table">
          <thead>
            <tr>
              <th>Weeks</th>
              <th>Contents</th>
              <th>Work Carried (Module/Function)</th>
              <th>Sign with date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {logSheet.entries && logSheet.entries.length > 0 ? (
              logSheet.entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="week-cell">{entry.week}</td>
                  <td className="contents-cell">{entry.contents}</td>
                  <td className="work-cell">
                    {editingEntry === entry._id && isGuide ? (
                      <>
                        <textarea
                          name="workCarried"
                          value={editForm.workCarried}
                          onChange={handleEditChange}
                          className="edit-textarea"
                          rows="3"
                        />
                        <div className="edit-actions">
                          <button 
                            className="save-btn"
                            onClick={() => handleEditSubmit(entry._id)}
                          >
                            Save
                          </button>
                          <button 
                            className="cancel-btn"
                            onClick={() => setEditingEntry(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="work-content">
                        <span>{entry.workCarried || '—'}</span>
                        {isGuide && (
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditClick(entry)}
                            title="Edit Work Carried"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="sign-cell">
                    <div className="sign-content">
                      {entry.sign ? (
                        <span className="signed">{entry.sign}</span>
                      ) : (
                        isGuide && (
                          <button 
                            className="sign-btn"
                            onClick={() => handleSignEntry(entry._id)}
                          >
                            Sign
                          </button>
                        )
                      )}
                    </div>
                  </td>
                  <td className="remarks-cell">
                    {editingEntry === entry._id && isGuide ? (
                      <>
                        <textarea
                          name="remarks"
                          value={editForm.remarks}
                          onChange={handleEditChange}
                          className="edit-textarea"
                          rows="2"
                          placeholder="Remarks"
                        />
                      </>
                    ) : (
                      <div className="remarks-content">
                        <span>{entry.remarks || '—'}</span>
                        {isGuide && !editingEntry && (
                          <button 
                            className="edit-btn"
                            onClick={() => handleEditClick(entry)}
                            title="Edit Remarks"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="hod-section">
        <table className="hod-table">
          <tbody>
            <tr>
              <td><strong>Signature of HOD:</strong></td>
              <td>
                {logSheet.hodSignature ? (
                  <span className="signed">{logSheet.hodSignature}</span>
                ) : (
                  isGuide && (
                    <button className="hod-sign-btn" onClick={handleHODSign}>
                      Sign as HOD
                    </button>
                  )
                )}
              </td>
            </tr>
            {logSheet.hodRemarks && (
              <tr>
                <td><strong>HOD Remarks:</strong></td>
                <td>{logSheet.hodRemarks}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogSheet;
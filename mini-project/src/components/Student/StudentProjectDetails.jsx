import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import './StudentProjectDetails.css';

const StudentProjectDetails = ({
  project,
  student,
  onBack,
  onOpenDiscussion,
  showDiscussion,
  newDiscussion,
  setNewDiscussion,
  replyTo,
  setReplyTo,
  replyMessage,
  setReplyMessage,
  handleAddDiscussion,
  handleAddReply,
  onCloseModals,
  unreadCount = 0
}) => {
  const navigate = useNavigate();
  
  // Get user role from localStorage
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Get user from localStorage to know the role
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        console.log('👤 Student - User role loaded:', user.role);
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);
  
  const [localProject, setLocalProject] = useState(project);
  const [localTasks, setLocalTasks] = useState([]);
  const [localDiscussions, setLocalDiscussions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // File attachment states
  const [showFileAttachment, setShowFileAttachment] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize local state when project changes
  useEffect(() => {
    console.log('📥 Project data received:', project);
    setLocalProject(project);
    setLocalTasks(project?.tasks || []);
    
    // Sort discussions by date (oldest first for proper chat flow)
    const sortedDiscussions = (project?.discussions || []).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    setLocalDiscussions(sortedDiscussions);
  }, [project]);

  // Refresh project data function
  const refreshProjectData = async () => {
    if (!project?._id) return;
    
    try {
      setRefreshing(true);
      console.log('🔄 Refreshing project data for:', project._id);
      
      const response = await API.get(`/projects/${project._id}`);
      console.log('📥 Refreshed project data:', response.data);
      
      if (response.data.success) {
        const refreshedProject = response.data.project;
        const sortedDiscussions = (refreshedProject.discussions || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setLocalProject(refreshedProject);
        setLocalTasks(refreshedProject.tasks || []);
        setLocalDiscussions(sortedDiscussions);
      }
    } catch (error) {
      console.error('❌ Error refreshing project data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFile({
          file: file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile({
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
    
    setShowFileAttachment(false);
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile.file);
    formData.append('projectId', project?._id);
    formData.append('message', newDiscussion?.message || '');
    
    try {
      // Show upload progress
      const response = await API.post('/discussions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      if (response.data.success) {
        // Clear states
        clearSelectedFile();
        setNewDiscussion?.({...newDiscussion, message: ''});
        
        // Refresh discussions
        await refreshProjectData();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const getProjectProgress = () => {
    if (!localTasks || localTasks.length === 0) return 0;
    const completed = localTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / localTasks.length) * 100);
  };

  const getMyTasks = () => {
    return localTasks?.filter(t => 
      t.assignedTo && t.assignedTo.toLowerCase() === student.name.toLowerCase()
    ) || [];
  };

  const getOtherTasks = () => {
    return localTasks?.filter(t => 
      t.assignedTo && t.assignedTo.toLowerCase() !== student.name.toLowerCase()
    ) || [];
  };

  // Group tasks by title for better display
  const groupTasksByTitle = (tasks) => {
    const grouped = {};
    tasks.forEach(task => {
      if (!grouped[task.title]) {
        grouped[task.title] = {
          title: task.title,
          assignees: [],
          tasks: [],
          status: task.status
        };
      }
      grouped[task.title].assignees.push(task.assignedTo);
      grouped[task.title].tasks.push(task);
    });
    return Object.values(grouped);
  };

  const myTasks = getMyTasks();
  const otherTasks = getOtherTasks();
  const myGroupedTasks = groupTasksByTitle(myTasks);
  const otherGroupedTasks = groupTasksByTitle(otherTasks);

  // Handle adding discussion - FIXED to prevent modal closing
  const handleDiscussionSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newDiscussion?.message?.trim() && !selectedFile) return;
    
    if (selectedFile) {
      await handleFileUpload(e);
    } else {
      // Store current message to clear later
      const currentMessage = newDiscussion.message;
      
      try {
        await handleAddDiscussion();
        // Clear the message but KEEP THE MODAL OPEN
        setNewDiscussion?.({...newDiscussion, message: ''});
        
        // Refresh data without closing modal
        setTimeout(() => {
          refreshProjectData();
        }, 500);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Get file icon based on extension
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'csv': 'fa-file-csv',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'gif': 'fa-file-image',
      'zip': 'fa-file-archive',
      'rar': 'fa-file-archive',
      '7z': 'fa-file-archive',
      'txt': 'fa-file-alt',
      'mp4': 'fa-file-video',
      'mp3': 'fa-file-audio'
    };
    return icons[ext] || 'fa-file';
  };

  // Get recent discussions for preview (last 3 messages)
  const getRecentDiscussions = () => {
    if (localDiscussions.length === 0) return [];
    return localDiscussions.slice(-3);
  };

  const recentDiscussions = getRecentDiscussions();

  // Handle log sheet navigation with user role
  const handleLogSheetClick = () => {
    console.log('📋 Student navigating to log sheet with role:', userRole);
    navigate(`/logsheet/${project._id}`, { 
      state: { userRole: userRole } 
    });
  };

  return (
    <div className="student-project-details">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <header className="details-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
            Back to My Projects
          </button>
          <button 
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`} 
            onClick={refreshProjectData}
            disabled={refreshing}
          >
            <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="header-content">
          <h1 className="project-title">
            <i className="fas fa-project-diagram"></i>
            {localProject?.name || 'Untitled Project'}
          </h1>
          <div className="project-meta">
            <span><i className="fas fa-chalkboard-teacher"></i> Guide: {localProject?.guide || 'Unknown'}</span>
            <span><i className="fas fa-users"></i> {localProject?.students?.length || 0} Members</span>
            <span><i className="fas fa-comments"></i> {localDiscussions?.length || 0} Discussions</span>
          </div>
        </div>
      </header>

      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Overall Project Progress</span>
          <span className="progress-percentage">{getProjectProgress()}%</span>
        </div>
        <div className="progress-bar-large">
          <div className="progress-fill-large" style={{ width: `${getProjectProgress()}%` }}></div>
        </div>
        <p className="progress-note">Progress tracked by guide</p>
      </div>

      {/* Action Buttons Section */}
      <div className="action-buttons-grid">
        <button 
          className="action-button discussion" 
          onClick={onOpenDiscussion}
          style={{ position: 'relative' }}
        >
          <i className="fas fa-comments"></i>
          <span>Discussion Forum</span>
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Log Sheet Button for Students */}
        <button 
          className="action-button logsheet-btn" 
          onClick={handleLogSheetClick}
          style={{ 
            background: 'linear-gradient(135deg, #9c27b0, #673ab7)',
            marginLeft: '1rem'
          }}
        >
          <i className="fas fa-book"></i>
          <span>Project Log Sheet</span>
        </button>
      </div>

      <div className="tasks-section">
        <h2 className="section-title">
          <i className="fas fa-tasks"></i>
          MY ASSIGNED TASKS ({myTasks.length})
        </h2>
        
        {myTasks.length > 0 ? (
          <div className="tasks-grid">
            {myGroupedTasks.map((group, idx) => (
              <div key={idx} className={`task-card ${group.status}`}>
                <div className="task-card-header">
                  <h3 className="task-title">{group.title}</h3>
                  <span className={`task-status ${group.status}`}>
                    {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                  </span>
                </div>
                <div className="task-assignees">
                  <i className="fas fa-user"></i>
                  <span>Assigned to: {group.assignees.join(', ')}</span>
                </div>
                <div className="task-footer">
                  <span className="task-status-readonly">
                    <i className="fas fa-info-circle"></i>
                    Status: {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-tasks-container">
            <p className="empty-state">No tasks assigned to you yet.</p>
            <p className="empty-state-hint">Tasks will appear here once the guide allocates them.</p>
          </div>
        )}

        {otherTasks.length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: '2rem' }}>
              <i className="fas fa-users"></i>
              TEAM TASKS ({otherTasks.length})
            </h2>
            <div className="tasks-grid">
              {otherGroupedTasks.map((group, idx) => (
                <div key={idx} className={`task-card team-task ${group.status}`}>
                  <div className="task-card-header">
                    <h3 className="task-title">{group.title}</h3>
                    <span className={`task-status ${group.status}`}>
                      {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                    </span>
                  </div>
                  <div className="task-assignees">
                    <i className="fas fa-users"></i>
                    <span>Assigned to: {group.assignees.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Team Members Section */}
      <div className="team-section">
        <h2 className="section-title">
          <i className="fas fa-users"></i>
          TEAM MEMBERS
        </h2>
        <div className="members-grid">
          {localProject?.students?.map((member, idx) => (
            <div key={idx} className={`member-card ${member === student.name ? 'current-user' : ''}`}>
              <i className="fas fa-user-circle"></i>
              <span>{member}</span>
              {member === student.name && <span className="you-badge">You</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Discussions Section */}
      {recentDiscussions.length > 0 && (
        <div className="discussions-preview-section">
          <h2 className="card-title">
            <i className="fas fa-comments"></i>
            Recent Discussions
          </h2>
          <div className="preview-messages">
            {recentDiscussions.map((disc, idx) => (
              <div key={disc?.id || disc?._id || idx} className="preview-message">
                <span className="preview-author">{disc?.student || disc?.author || 'Unknown'}:</span>
                <span className="preview-text">{(disc?.message || '').substring(0, 40)}</span>
                <span className="preview-time">
                  {disc?.createdAt ? new Date(disc.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discussion Forum Modal - WhatsApp Style with File Attachment */}
      {showDiscussion && (
        <div className="modal" onClick={onCloseModals}>
          <div className="modal-content whatsapp-modal" onClick={(e) => {
            e.stopPropagation();
          }}>
            
            {/* WhatsApp-style Header */}
            <div className="whatsapp-header">
              <div className="whatsapp-header-left">
                <button className="whatsapp-back-btn" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseModals();
                }}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="whatsapp-chat-info">
                  <h3>{localProject?.name || 'Project'} Discussion</h3>
                  <span className="whatsapp-participants">
                    <i className="fas fa-users"></i> {localProject?.students?.length || 0} participants
                  </span>
                </div>
              </div>
              <div className="whatsapp-header-right">
                <button className="whatsapp-header-btn" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  refreshProjectData();
                }} title="Refresh">
                  <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
                </button>
                <button className="whatsapp-header-btn" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseModals();
                }} title="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* File Attachment Modal */}
            {showFileAttachment && (
              <div className="file-attachment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="file-attachment-content">
                  <h4>Attach File</h4>
                  <div className="file-options">
                    <label className="file-option">
                      <i className="fas fa-image"></i>
                      <span>Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileSelect(e, 'image')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="file-option">
                      <i className="fas fa-file-pdf"></i>
                      <span>PDF</span>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => handleFileSelect(e, 'pdf')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="file-option">
                      <i className="fas fa-file-word"></i>
                      <span>Document</span>
                      <input 
                        type="file" 
                        accept=".doc,.docx,.txt" 
                        onChange={(e) => handleFileSelect(e, 'document')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="file-option">
                      <i className="fas fa-file-excel"></i>
                      <span>Spreadsheet</span>
                      <input 
                        type="file" 
                        accept=".xls,.xlsx,.csv" 
                        onChange={(e) => handleFileSelect(e, 'spreadsheet')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="file-option">
                      <i className="fas fa-file-archive"></i>
                      <span>Archive</span>
                      <input 
                        type="file" 
                        accept=".zip,.rar,.7z" 
                        onChange={(e) => handleFileSelect(e, 'archive')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="file-option">
                      <i className="fas fa-file"></i>
                      <span>Other</span>
                      <input 
                        type="file" 
                        onChange={(e) => handleFileSelect(e, 'other')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <button className="cancel-file-btn" onClick={() => setShowFileAttachment(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* File Preview */}
            {selectedFile && (
              <div className="file-preview-container" onClick={(e) => e.stopPropagation()}>
                <div className="file-preview">
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={selectedFile.preview} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="file-icon-preview">
                      <i className={`fas ${getFileIcon(selectedFile.name)}`}></i>
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}
                  <button className="remove-file-btn" onClick={clearSelectedFile}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Chat Area */}
            <div className="whatsapp-chat-area" id="whatsapp-chat-area" onClick={(e) => e.stopPropagation()}>
              <div className="whatsapp-date-divider">
                <span>Today</span>
              </div>

              <div className="whatsapp-messages-container">
                {localDiscussions.length === 0 ? (
                  <div className="whatsapp-empty-state">
                    <div className="empty-state-icon">
                      <i className="fas fa-comments"></i>
                    </div>
                    <h4>No messages yet</h4>
                    <p>Start the conversation with your team</p>
                  </div>
                ) : (
                  localDiscussions.map((disc, idx) => {
                    const messageAuthor = disc?.student || disc?.author || 'Unknown';
                    const messageTime = disc?.createdAt || disc?.timestamp || '';
                    
                    const formattedTime = messageTime ? new Date(messageTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    }) : '';
                    
                    // IMPORTANT: Fix the alignment logic
                    // 1. Check if message is from current student (YOUR messages) - should be on RIGHT
                    const isCurrentUser = messageAuthor.trim().toLowerCase() === student?.name?.trim().toLowerCase();
                    
                    // 2. Check if message is from guide - should be on LEFT
                    const isGuide = messageAuthor === 'Guide' || 
                                    messageAuthor === localProject?.guide || 
                                    messageAuthor.includes('Guide') ||
                                    (localProject?.guide && messageAuthor.trim().toLowerCase() === localProject.guide.trim().toLowerCase());
                    
                    return (
                      <div key={disc?._id || disc?.id || idx} className="message-container">
                        {/* Main Message */}
                        <div className={`message-row ${isCurrentUser ? 'my-message-right' : isGuide ? 'guide-message-left' : 'other-message-left'}`}>
                          <div className="message-bubble-wrapper">
                            {/* Sender Name with Time */}
                            <div className="message-sender">
                              {isGuide ? (
                                <span className="guide-name">
                                  <i className="fas fa-chalkboard-teacher"></i> Guide
                                </span>
                              ) : isCurrentUser ? (
                                <span className="my-name">
                                  <i className="fas fa-user"></i> You
                                </span>
                              ) : (
                                <span className="other-name">
                                  <i className="fas fa-user-graduate"></i> {messageAuthor}
                                </span>
                              )}
                              <span className="message-time">{formattedTime}</span>
                            </div>
                            
                            {/* Message Bubble with File Support */}
                            <div className={`message-bubble ${isCurrentUser ? 'my-bubble-right' : isGuide ? 'guide-bubble-left' : 'other-bubble-left'}`}>
                              {/* Text Message */}
                              {disc?.message && (
                                <div className="message-text">
                                  {disc.message}
                                </div>
                              )}
                              
                              {/* File Attachment */}
                              {disc?.file && (
                                <div className="message-file">
                                  {disc.file.type?.startsWith('image/') ? (
                                    <div className="image-attachment">
                                      <img 
                                        src={disc.file.url} 
                                        alt={disc.file.name}
                                        onClick={() => window.open(disc.file.url, '_blank')}
                                      />
                                      <span className="file-name">{disc.file.name}</span>
                                    </div>
                                  ) : (
                                    <a 
                                      href={disc.file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="file-attachment"
                                      download
                                    >
                                      <i className={`fas ${getFileIcon(disc.file.name)} file-icon`}></i>
                                      <div className="file-info">
                                        <span className="file-name">{disc.file.name}</span>
                                        <span className="file-size">{(disc.file.size / 1024).toFixed(1)} KB</span>
                                      </div>
                                      <i className="fas fa-download download-icon"></i>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Reply Button */}
                            <button 
                              className="message-reply-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setReplyTo?.(replyTo === (disc?._id || disc?.id) ? null : (disc?._id || disc?.id));
                              }}
                            >
                              <i className="fas fa-reply"></i> Reply
                            </button>
                          </div>
                        </div>

                        {/* Replies Section */}
                        {disc?.replies && disc.replies.length > 0 && (
                          <div className="replies-section">
                            {disc.replies.map((reply, replyIdx) => {
                              const replyAuthor = reply?.student || reply?.author || 'Unknown';
                              const replyTime = reply?.createdAt || reply?.timestamp || '';
                              const formattedReplyTime = replyTime ? new Date(replyTime).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              }) : '';
                              
                              // Fix reply alignment logic
                              const isReplyCurrentUser = replyAuthor.trim().toLowerCase() === student?.name?.trim().toLowerCase();
                              const isReplyGuide = replyAuthor === 'Guide' || 
                                                  replyAuthor === localProject?.guide || 
                                                  replyAuthor.includes('Guide') ||
                                                  (localProject?.guide && replyAuthor.trim().toLowerCase() === localProject.guide.trim().toLowerCase());

                              return (
                                <div key={replyIdx} className={`reply-row ${isReplyCurrentUser ? 'my-reply-right' : isReplyGuide ? 'guide-reply-left' : 'other-reply-left'}`}>
                                  <div className="reply-bubble-wrapper">
                                    <div className="reply-sender">
                                      {isReplyGuide ? (
                                        <span className="guide-name">
                                          <i className="fas fa-chalkboard-teacher"></i> Guide
                                        </span>
                                      ) : isReplyCurrentUser ? (
                                        <span className="my-name">
                                          <i className="fas fa-user"></i> You
                                        </span>
                                      ) : (
                                        <span className="other-name">
                                          <i className="fas fa-user-graduate"></i> {replyAuthor}
                                        </span>
                                      )}
                                      <span className="reply-time">{formattedReplyTime}</span>
                                    </div>
                                    <div className={`reply-bubble ${isReplyCurrentUser ? 'my-bubble-right' : isReplyGuide ? 'guide-bubble-left' : 'other-bubble-left'}`}>
                                      {reply?.message || ''}
                                      {reply?.file && (
                                        <div className="message-file">
                                          <a href={reply.file.url} target="_blank" rel="noopener noreferrer">
                                            <i className={`fas ${getFileIcon(reply.file.name)}`}></i>
                                            {reply.file.name}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Input Field */}
                        {replyTo === (disc?._id || disc?.id) && (
                          <div className="reply-input-container" onClick={(e) => e.stopPropagation()}>
                            <div className="reply-preview">
                              <i className="fas fa-reply"></i>
                              <span>Replying to {messageAuthor}</span>
                              <button 
                                className="cancel-reply"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReplyTo?.(null);
                                }}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                            <div className="reply-input-wrapper">
                              <textarea
                                placeholder="Write your reply..."
                                value={replyMessage || ''}
                                onChange={(e) => setReplyMessage?.(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAddReply?.(disc?._id || disc?.id);
                                  }
                                }}
                                rows="1"
                              />
                              <button 
                                className="send-reply-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddReply?.(disc?._id || disc?.id);
                                }}
                                disabled={!replyMessage?.trim()}
                              >
                                <i className="fas fa-paper-plane"></i>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* WhatsApp Input Area - WITH FILE ATTACHMENT BUTTON */}
            <div className="whatsapp-input-area" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}>
              {/* File Attachment Button - The + symbol */}
              <button 
                className="whatsapp-attach-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFileAttachment(!showFileAttachment);
                }}
                title="Attach file"
              >
                <i className="fas fa-plus"></i>
              </button>
              
              <div className="input-wrapper" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}>
                <textarea
                  placeholder="Type a message..."
                  value={newDiscussion?.message || ''}
                  onChange={(e) => setNewDiscussion?.({...newDiscussion, message: e.target.value})}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDiscussionSubmit(e);
                    }
                  }}
                  rows="1"
                />
              </div>
              <button 
                className="send-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDiscussionSubmit(e);
                }}
                disabled={!newDiscussion?.message?.trim() && !selectedFile}
                type="button"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProjectDetails;
import React, { useState, useEffect } from 'react';
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
  const [localProject, setLocalProject] = useState(project);
  const [localTasks, setLocalTasks] = useState([]);
  const [localDiscussions, setLocalDiscussions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

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
    
    if (!newDiscussion?.message?.trim()) return;
    
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
  };

  // Get recent discussions for preview (last 3 messages)
  const getRecentDiscussions = () => {
    if (localDiscussions.length === 0) return [];
    return localDiscussions.slice(-3);
  };

  const recentDiscussions = getRecentDiscussions();

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

      <button 
        className="discussion-forum-btn" 
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
        <i className="fas fa-arrow-right"></i>
      </button>

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

      {/* Discussion Forum Modal - WhatsApp Style */}
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
                    
                    // Check if message is from current user
                    const isCurrentUser = messageAuthor.toLowerCase() === student?.name?.toLowerCase();
                    // Check if message is from guide
                    const isGuide = messageAuthor === 'Guide' || messageAuthor === localProject?.guide;
                    
                    return (
                      <div key={disc?._id || disc?.id || idx} className="message-container">
                        {/* Main Message */}
                        <div className={`message-row ${isCurrentUser ? 'my-message' : isGuide ? 'guide-message' : 'other-message'}`}>
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
                            
                            {/* Message Bubble */}
                            <div className={`message-bubble ${isCurrentUser ? 'my-bubble' : isGuide ? 'guide-bubble' : 'other-bubble'}`}>
                              <div className="message-text">
                                {disc?.message || ''}
                              </div>
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
                              const isReplyCurrentUser = replyAuthor.toLowerCase() === student?.name?.toLowerCase();
                              const isReplyGuide = replyAuthor === 'Guide' || replyAuthor === localProject?.guide;

                              return (
                                <div key={replyIdx} className={`reply-row ${isReplyCurrentUser ? 'my-reply' : isReplyGuide ? 'guide-reply' : 'other-reply'}`}>
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
                                    <div className={`reply-bubble ${isReplyCurrentUser ? 'my-bubble' : isReplyGuide ? 'guide-bubble' : 'other-bubble'}`}>
                                      {reply?.message || ''}
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

            {/* WhatsApp Input Area - FIXED: Won't close modal */}
            <div className="whatsapp-input-area" onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}>
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
                disabled={!newDiscussion?.message?.trim()}
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
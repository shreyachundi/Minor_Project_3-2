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
  unreadCount = 0  // Add this new prop
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
    setLocalDiscussions(project?.discussions || []);
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
        setLocalProject(refreshedProject);
        setLocalTasks(refreshedProject.tasks || []);
        setLocalDiscussions(refreshedProject.discussions || []);
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

      {/* Discussion Forum Modal */}
      {showDiscussion && (
        <div className="modal" onClick={onCloseModals}>
          <div className="modal-content discussion-modal" onClick={e => e.stopPropagation()}>
            <div className="discussion-header">
              <h3><i className="fas fa-comments"></i> Discussion Forum</h3>
              <button className="close-discussion-btn" onClick={onCloseModals}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="discussion-container">
              <div className="messages-list">
                {localDiscussions?.map(disc => (
                  <div key={disc._id} className="message-thread">
                    <div className="message-main">
                      <div className="message-header">
                        <div className="message-author-info">
                          <i className="fas fa-user-circle"></i>
                          <span className={`message-author ${disc.author.includes('Guide') ? 'guide' : ''}`}>
                            {disc.author}
                          </span>
                        </div>
                        <span className="message-time">{new Date(disc.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="message-content">{disc.message}</p>
                      <button 
                        className="reply-btn"
                        onClick={() => setReplyTo(replyTo === disc._id ? null : disc._id)}
                      >
                        <i className="fas fa-reply"></i>
                        Reply
                      </button>
                    </div>

                    {disc.replies?.map(reply => (
                      <div key={reply._id} className="message-reply">
                        <div className="message-header">
                          <div className="message-author-info">
                            <i className="fas fa-user-circle"></i>
                            <span className={`message-author ${reply.author.includes('Guide') ? 'guide' : ''}`}>
                              {reply.author}
                            </span>
                          </div>
                          <span className="message-time">{new Date(reply.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="message-content">{reply.message}</p>
                      </div>
                    ))}

                    {replyTo === disc._id && (
                      <div className="reply-input-container">
                        <input
                          type="text"
                          placeholder="Write your reply..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddReply(disc._id);
                            }
                          }}
                        />
                        <button onClick={() => handleAddReply(disc._id)}>
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="new-message">
                <textarea
                  placeholder="Start a new discussion..."
                  value={newDiscussion.message}
                  onChange={(e) => setNewDiscussion({...newDiscussion, message: e.target.value})}
                  rows="3"
                />
                <button 
                  className="post-message-btn"
                  onClick={handleAddDiscussion}
                >
                  <i className="fas fa-paper-plane"></i>
                  Post Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProjectDetails;
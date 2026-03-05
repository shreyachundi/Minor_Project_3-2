import React from 'react';
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
  onCloseModals
}) => {
  const getProjectProgress = () => {
    if (project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  const getMyTasks = () => {
    return project.tasks.filter(t => t.assignedTo === student.name);
  };

  const getOtherTasks = () => {
    return project.tasks.filter(t => t.assignedTo !== student.name);
  };

  return (
    <div className="student-project-details">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <header className="details-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Back to My Projects
        </button>
        <div className="header-content">
          <h1 className="project-title">
            <i className="fas fa-project-diagram"></i>
            {project.name}
          </h1>
          <div className="project-meta">
            <span><i className="fas fa-chalkboard-teacher"></i> Guide: {project.guide}</span>
            <span><i className="fas fa-users"></i> {project.students.length} Members</span>
            <span><i className="fas fa-comments"></i> {project.discussions.length} Discussions</span>
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

      <button className="discussion-forum-btn" onClick={onOpenDiscussion}>
        <i className="fas fa-comments"></i>
        <span>Discussion Forum</span>
        <i className="fas fa-arrow-right"></i>
      </button>

      <div className="tasks-section">
        <h2 className="section-title">
          <i className="fas fa-tasks"></i>
          MY ASSIGNED TASKS
        </h2>
        {getMyTasks().length > 0 ? (
          <div className="tasks-grid">
            {getMyTasks().map(task => (
              <div key={task.id} className={`task-card ${task.status}`}>
                <div className="task-card-header">
                  <h3 className="task-title">{task.title}</h3>
                  <span className={`task-status ${task.status}`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                <p className="task-description">{task.description}</p>
                <div className="task-meta">
                  <span><i className="fas fa-calendar"></i> Due: {task.dueDate}</span>
                  <span><i className="fas fa-user"></i> Assigned to you</span>
                </div>
                {/* REMOVED: Task status update dropdown - students cannot update status anymore */}
                <div className="task-footer">
                  <span className="task-status-readonly">
                    <i className="fas fa-info-circle"></i>
                    Status: {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No tasks assigned to you yet.</p>
        )}

        {getOtherTasks().length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: '2rem' }}>
              <i className="fas fa-users"></i>
              TEAM TASKS
            </h2>
            <div className="tasks-grid">
              {getOtherTasks().map(task => (
                <div key={task.id} className={`task-card team-task ${task.status}`}>
                  <div className="task-card-header">
                    <h3 className="task-title">{task.title}</h3>
                    <span className={`task-status ${task.status}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </div>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span><i className="fas fa-calendar"></i> Due: {task.dueDate}</span>
                    <span><i className="fas fa-user"></i> Assigned to: {task.assignedTo}</span>
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
          {project.students.map((member, idx) => (
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
                {project.discussions.map(disc => (
                  <div key={disc.id} className="message-thread">
                    <div className="message-main">
                      <div className="message-header">
                        <div className="message-author-info">
                          <i className="fas fa-user-circle"></i>
                          <span className={`message-author ${disc.author.includes('Guide') ? 'guide' : ''}`}>
                            {disc.author}
                          </span>
                        </div>
                        <span className="message-time">{disc.timestamp}</span>
                      </div>
                      <p className="message-content">{disc.message}</p>
                      <button 
                        className="reply-btn"
                        onClick={() => setReplyTo(replyTo === disc.id ? null : disc.id)}
                      >
                        <i className="fas fa-reply"></i>
                        Reply
                      </button>
                    </div>

                    {disc.replies.map(reply => (
                      <div key={reply.id} className="message-reply">
                        <div className="message-header">
                          <div className="message-author-info">
                            <i className="fas fa-user-circle"></i>
                            <span className={`message-author ${reply.author.includes('Guide') ? 'guide' : ''}`}>
                              {reply.author}
                            </span>
                          </div>
                          <span className="message-time">{reply.timestamp}</span>
                        </div>
                        <p className="message-content">{reply.message}</p>
                      </div>
                    ))}

                    {replyTo === disc.id && (
                      <div className="reply-input-container">
                        <input
                          type="text"
                          placeholder="Write your reply..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddReply(disc.id);
                            }
                          }}
                        />
                        <button onClick={() => handleAddReply(disc.id)}>
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
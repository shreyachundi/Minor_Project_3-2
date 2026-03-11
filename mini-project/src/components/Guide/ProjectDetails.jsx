import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import './ProjectDetails.css';

const ProjectDetails = ({
  project,
  onBack,
  onProjectUpdate,
  onAddStudent,
  onAllocateTask,
  onOpenDiscussion,
  onUpdateTaskStatus,
  showAddStudent,
  showAllocateTask,
  showDiscussion,
  newStudent,
  setNewStudent,
  newTask,
  setNewTask,
  newDiscussion,
  setNewDiscussion,
  replyTo,
  setReplyTo,
  replyMessage,
  setReplyMessage,
  handleAddStudent,
  handleAllocateTask,
  handleAddDiscussion,
  handleAddReply,
  onCloseModals,
  assignToAll = false,
  setAssignToAll,
  unreadCount = 0
}) => {
  // Local state for tasks to ensure real-time updates
  const [localTasks, setLocalTasks] = useState([]);
  const [localDiscussions, setLocalDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // New state for task deadline
  const [taskDeadline, setTaskDeadline] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // Update local state when project changes
  useEffect(() => {
    if (project?.tasks) {
      setLocalTasks(project.tasks);
    }
    if (project?.discussions) {
      // Sort discussions by date (oldest first for chat flow)
      const sorted = [...project.discussions].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setLocalDiscussions(sorted);
    }
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
        // Sort discussions by date (oldest first for chat flow)
        const sorted = (refreshedProject.discussions || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setLocalTasks(refreshedProject.tasks || []);
        setLocalDiscussions(sorted);
        
        if (onProjectUpdate) {
          onProjectUpdate(refreshedProject);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing project data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Call refresh when project ID changes
  useEffect(() => {
    if (project?._id) {
      refreshProjectData();
    }
  }, [project?._id]);

  // Safety check - if project is undefined
  if (!project) {
    return (
      <div className="project-details-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="error-container">
          <h2>Project not found</h2>
          <button className="back-btn" onClick={onBack}>
            <i className="fas fa-arrow-left"></i> Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Safe access with default values
  const students = project?.students || [];

  // Calculate project progress based on tasks
  const getProjectProgress = () => {
    if (!localTasks || localTasks.length === 0) return 0;
    const completed = localTasks.filter(t => t?.status === 'completed').length;
    return Math.round((completed / localTasks.length) * 100);
  };

  // Format date for display - CLEAN VERSION (no warnings)
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Function to group tasks by title
  const groupTasksByTitle = () => {
    const groupedMap = new Map();
    
    localTasks.forEach(task => {
      const taskTitle = task.title;
      if (!groupedMap.has(taskTitle)) {
        groupedMap.set(taskTitle, {
          title: taskTitle,
          assignees: [],
          tasks: [],
          status: task.status,
          dueDate: task.dueDate // Store the due date
        });
      }
      const group = groupedMap.get(taskTitle);
      group.assignees.push(task.assignedTo);
      group.tasks.push(task);
      
      if (group.tasks.length > 0) {
        group.status = group.tasks[0].status;
        group.dueDate = group.tasks[0].dueDate; // Use first task's due date
      }
    });
    
    return Array.from(groupedMap.values());
  };

  const groupedTasks = groupTasksByTitle();

  // Handle status update for a grouped task
  const handleGroupedTaskStatusChange = async (group, newStatus) => {
    try {
      setLoading(true);
      console.log('📝 Changing task status:', { groupTitle: group.title, newStatus });
      
      // Update all tasks in this group to the new status
      const updatePromises = group.tasks.map(task => 
        onUpdateTaskStatus(task._id, newStatus)
      );
      
      const results = await Promise.all(updatePromises);
      console.log('✅ Status update results:', results);
      
      // Update local state immediately for better UX
      const updatedTasks = localTasks.map(task => {
        if (group.tasks.some(t => t._id === task._id)) {
          return { ...task, status: newStatus };
        }
        return task;
      });
      
      setLocalTasks(updatedTasks);
      
      // Refresh data from server to ensure consistency
      await refreshProjectData();
      
    } catch (error) {
      console.error('❌ Error updating task status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle task allocation with deadline
  const handleTaskSubmit = () => {
    if (!taskDeadline) {
      alert('Please select a deadline date');
      return;
    }

    if (assignToAll) {
      // Create a task for each team member with deadline
      const tasks = students.map(student => ({
        title: newTask.title,
        assignedTo: student,
        status: 'pending',
        dueDate: taskDeadline
      }));
      handleAllocateTask(tasks);
    } else {
      // Single task allocation with deadline
      if (!newTask.assignedTo) {
        alert('Please select a student');
        return;
      }
      const task = {
        title: newTask.title,
        assignedTo: newTask.assignedTo,
        status: 'pending',
        dueDate: taskDeadline
      };
      handleAllocateTask(task);
    }
    setAssignToAll?.(false);
    setTaskDeadline('');
    setShowCalendar(false);
    
    setTimeout(() => {
      refreshProjectData();
    }, 500);
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Handle adding student
  const handleAddStudentSubmit = async () => {
    await handleAddStudent();
    setTimeout(() => {
      refreshProjectData();
    }, 500);
  };

  // Handle adding discussion
  const handleDiscussionSubmit = async () => {
    await handleAddDiscussion();
    setTimeout(() => {
      refreshProjectData();
    }, 500);
  };

  // Get recent discussions for preview (last 3 messages in chronological order)
  const getRecentDiscussions = () => {
    if (localDiscussions.length === 0) return [];
    // Get the last 3 messages (most recent)
    return localDiscussions.slice(-3);
  };

  const recentDiscussions = getRecentDiscussions();

  return (
    <div className="project-details-container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <header className="details-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            <i className="fas fa-arrow-left"></i>
            Back to Projects
          </button>
          <button 
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`} 
            onClick={refreshProjectData}
            title="Refresh project data"
            disabled={refreshing}
          >
            <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="header-content">
          <h1 className="project-title">
            <i className="fas fa-project-diagram"></i>
            {project?.name || 'Untitled Project'}
          </h1>
          <div className="project-meta">
            <span><i className="fas fa-users"></i> {students.length} Students</span>
            <span><i className="fas fa-tasks"></i> {localTasks.length} Tasks</span>
            <span><i className="fas fa-comments"></i> {localDiscussions.length} Discussions</span>
          </div>
        </div>
      </header>

      {/* Progress Section */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-percentage">{getProjectProgress()}%</span>
        </div>
        <div className="progress-bar-large">
          <div className="progress-fill-large" style={{ width: `${getProjectProgress()}%` }}></div>
        </div>
        
        {localTasks.length > 0 && (
          <div className="task-stats-breakdown">
            <div className="stat-chip pending">
              <span className="stat-label">Pending</span>
              <span className="stat-count">{localTasks.filter(t => t.status === 'pending').length}</span>
            </div>
            <div className="stat-chip in-progress">
              <span className="stat-label">In Progress</span>
              <span className="stat-count">{localTasks.filter(t => t.status === 'in-progress').length}</span>
            </div>
            <div className="stat-chip completed">
              <span className="stat-label">Completed</span>
              <span className="stat-count">{localTasks.filter(t => t.status === 'completed').length}</span>
            </div>
          </div>
        )}
      </div>

      <div className="action-buttons-grid">
        <button className="action-button add-student" onClick={onAddStudent}>
          <i className="fas fa-user-plus"></i>
          <span>Add Student</span>
        </button>
        <button className="action-button allocate-task" onClick={onAllocateTask}>
          <i className="fas fa-tasks"></i>
          <span>Allocate Task</span>
        </button>
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
      </div>

      <div className="details-grid">
        {/* Team Members Section */}
        <div className="details-card">
          <h2 className="card-title">
            <i className="fas fa-users"></i>
            Team Members ({students.length})
          </h2>
          {students.length > 0 ? (
            <div className="members-list">
              {students.map((student, idx) => (
                <div key={idx} className="member-item">
                  <i className="fas fa-user-graduate"></i>
                  <span>{student || 'Unnamed Student'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No students yet. Click "Add Student" to get started.</p>
          )}
        </div>

        {/* Tasks Section - CLEAN DEADLINE DISPLAY */}
        <div className="details-card">
          <h2 className="card-title">
            <i className="fas fa-tasks"></i>
            Tasks ({localTasks.length})
          </h2>
          
          {groupedTasks.length > 0 ? (
            <div className="tasks-list-detailed">
              {groupedTasks.map((group, groupIdx) => {
                const formattedDate = formatDate(group.dueDate);
                
                return (
                  <div key={groupIdx} className={`task-group ${group.status}`}>
                    <div className="task-group-header">
                      <div className="task-title-container">
                        <h3 className="task-group-title">{group.title}</h3>
                        <select 
                          value={group.status}
                          onChange={(e) => handleGroupedTaskStatusChange(group, e.target.value)}
                          className={`status-badge ${group.status}`}
                          disabled={loading}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Clean Deadline Display - Only shown if date exists */}
                    {formattedDate && (
                      <div className="task-deadline">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Due: {formattedDate}</span>
                      </div>
                    )}
                    
                    <div className="task-assignees">
                      <i className="fas fa-users"></i>
                      <span>{group.assignees.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No tasks yet. Click "Allocate Task" to add tasks.</p>
          )}
        </div>
      </div>

      {/* Recent Discussions Section - FIXED: Shows newest at BOTTOM */}
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

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="modal" onClick={onCloseModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3><i className="fas fa-user-plus"></i> Add Student</h3>
            <p className="modal-instruction">Enter the student's name to add to this project</p>
            <input
              type="text"
              placeholder="Student Name"
              value={newStudent?.name || ''}
              onChange={(e) => setNewStudent?.({ name: e.target.value })}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={onCloseModals}>Cancel</button>
              <button onClick={handleAddStudentSubmit} className="primary">Add Student</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Task Modal with Calendar */}
      {showAllocateTask && (
        <div className="modal" onClick={onCloseModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3><i className="fas fa-tasks"></i> Allocate Task</h3>
            <p className="modal-instruction">Assign a new task to team member(s)</p>
            
            <input
              type="text"
              placeholder="Task Title"
              value={newTask?.title || ''}
              onChange={(e) => setNewTask?.({...newTask, title: e.target.value})}
              autoFocus
            />

            {/* Deadline Selection with Calendar */}
            <div className="deadline-section">
              <label className="deadline-label">
                <i className="fas fa-calendar-alt"></i> Deadline
              </label>
              <div className="date-picker-container">
                <input
                  type="date"
                  className="date-picker"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  min={getTodayDate()}
                  required
                />
                <span className="date-hint">1 day before deadline, students will receive email reminder</span>
              </div>
            </div>

            {/* Assignment Type Selection */}
            <div className="assignment-type">
              <label className="radio-label">
                <input
                  type="radio"
                  name="assignmentType"
                  checked={!assignToAll}
                  onChange={() => setAssignToAll?.(false)}
                />
                <span>Assign to specific student</span>
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  name="assignmentType"
                  checked={assignToAll}
                  onChange={() => setAssignToAll?.(true)}
                />
                <span>Assign to all team members ({students.length} students)</span>
              </label>
            </div>

            {/* Student Selection */}
            {!assignToAll && (
              <select
                value={newTask?.assignedTo || ''}
                onChange={(e) => setNewTask?.({...newTask, assignedTo: e.target.value})}
                className="student-select"
              >
                <option value="">Select a student</option>
                {students.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {/* Preview of assignment */}
            {assignToAll && students.length > 0 && (
              <div className="assignment-preview">
                <p>This task will be assigned to:</p>
                <div className="preview-list">
                  {students.map(student => (
                    <span key={student} className="preview-tag">
                      <i className="fas fa-user"></i>
                      {student}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={onCloseModals}>Cancel</button>
              <button 
                onClick={handleTaskSubmit} 
                className="primary"
                disabled={!newTask?.title || (!assignToAll && !newTask?.assignedTo) || !taskDeadline}
              >
                {assignToAll ? 'Assign to All Members' : 'Allocate Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {showDiscussion && (
        <div className="modal" onClick={onCloseModals}>
          <div className="modal-content whatsapp-modal" onClick={e => e.stopPropagation()}>
            
            {/* WhatsApp-style Header */}
            <div className="whatsapp-header">
              <div className="whatsapp-header-left">
                <button className="whatsapp-back-btn" onClick={onCloseModals}>
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="whatsapp-chat-info">
                  <h3>{project?.name || 'Project'} Discussion</h3>
                  <span className="whatsapp-participants">
                    <i className="fas fa-users"></i> {students.length + 1} participants
                  </span>
                </div>
              </div>
              <div className="whatsapp-header-right">
                <button className="whatsapp-header-btn" onClick={refreshProjectData} title="Refresh">
                  <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
                </button>
                <button className="whatsapp-header-btn" onClick={onCloseModals} title="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* WhatsApp Chat Area */}
            <div className="whatsapp-chat-area" id="whatsapp-chat-area">
              {/* Date Divider */}
              <div className="whatsapp-date-divider">
                <span>Today</span>
              </div>
              

              {/* Messages Container */}
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
                    
                    // Format time properly
                    const formattedTime = messageTime ? new Date(messageTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    }) : '';
                    
                    // Check if message is from guide
                    const isGuide = messageAuthor === 'Guide' || messageAuthor === project?.guide;
                    
                    return (
                      <div key={disc?._id || disc?.id || idx} className="message-container">
                        {/* Main Message */}
                        <div className={`message-row ${isGuide ? 'guide-message' : 'student-message'}`}>
                          <div className="message-bubble-wrapper">
                            {/* Sender Name with Time */}
                            <div className="message-sender">
                              {isGuide ? (
                                <span className="guide-name">
                                  <i className="fas fa-chalkboard-teacher"></i> Guide
                                </span>
                              ) : (
                                <span className="student-name">
                                  <i className="fas fa-user-graduate"></i> {messageAuthor}
                                </span>
                              )}
                              <span className="message-time">{formattedTime}</span>
                            </div>
                            
                            {/* Message Bubble */}
                            <div className={`message-bubble ${isGuide ? 'guide-bubble' : 'student-bubble'}`}>
                              <div className="message-text">
                                {disc?.message || ''}
                              </div>
                            </div>

                            {/* Reply Button */}
                            <button 
                              className="message-reply-btn"
                              onClick={(e) => {
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
                              const isReplyGuide = replyAuthor === 'Guide' || replyAuthor === project?.guide;

                              return (
                                <div key={replyIdx} className={`reply-row ${isReplyGuide ? 'guide-reply' : 'student-reply'}`}>
                                  <div className="reply-bubble-wrapper">
                                    <div className="reply-sender">
                                      {isReplyGuide ? (
                                        <span className="guide-name">
                                          <i className="fas fa-chalkboard-teacher"></i> Guide
                                        </span>
                                      ) : (
                                        <span className="student-name">
                                          <i className="fas fa-user-graduate"></i> {replyAuthor}
                                        </span>
                                      )}
                                      <span className="reply-time">{formattedReplyTime}</span>
                                    </div>
                                    <div className={`reply-bubble ${isReplyGuide ? 'guide-bubble' : 'student-bubble'}`}>
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
                          <div className="reply-input-container">
                            <div className="reply-preview">
                              <i className="fas fa-reply"></i>
                              <span>Replying to {messageAuthor}</span>
                              <button 
                                className="cancel-reply"
                                onClick={() => setReplyTo?.(null)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                            <div className="reply-input-wrapper">
                              <textarea
                                placeholder="Write your reply..."
                                value={replyMessage || ''}
                                onChange={(e) => setReplyMessage?.(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddReply?.(disc?._id || disc?.id);
                                  }
                                }}
                                rows="1"
                              />
                              <button 
                                className="send-reply-btn"
                                onClick={() => handleAddReply?.(disc?._id || disc?.id)}
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

            {/* WhatsApp Input Area */}
            <div className="whatsapp-input-area">
              <div className="input-wrapper">
                <textarea
                  placeholder="Type a message as Guide..."
                  value={newDiscussion?.message || ''}
                  onChange={(e) => setNewDiscussion?.({...newDiscussion, message: e.target.value})}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleDiscussionSubmit();
                    }
                  }}
                  rows="1"
                />
              </div>
              <button 
                className="send-btn"
                onClick={handleDiscussionSubmit}
                disabled={!newDiscussion?.message?.trim()}
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

export default ProjectDetails;
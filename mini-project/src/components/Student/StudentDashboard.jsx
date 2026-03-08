import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import StudentProjectDetails from './StudentProjectDetails';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState({
    id: '',
    name: '',
    email: '',
    guideName: '',
    guideId: ''
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ message: '', author: '' });
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // Notification state
  const [unreadDiscussions, setUnreadDiscussions] = useState({});
  const [lastChecked, setLastChecked] = useState({});

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('🔍 StudentDashboard mounted');
    
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      
      if (userData.role !== 'student') {
        navigate('/guide');
        return;
      }
      
      setUser(userData);
      setStudent({
        id: userData._id,
        name: userData.name,
        email: userData.email,
        guideName: userData.guideName || 'Not Assigned',
        guideId: userData.guideId || ''
      });
      setNewDiscussion({ message: '', author: userData.name });
      
      // Load last checked timestamps from localStorage
      const saved = localStorage.getItem(`discussion_last_checked_${userData._id}`);
      if (saved) {
        setLastChecked(JSON.parse(saved));
      }
      
      fetchUserProfile();
      
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await API.get('/auth/profile');
      
      if (response.data.success) {
        const userData = response.data;
        setStudent({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          guideName: userData.guideName || 'Not Assigned',
          guideId: userData.guideId || ''
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
    }
  };

  // Fetch student's projects
  useEffect(() => {
    if (student.id) {
      fetchStudentProjects();
    }
  }, [student.id]);

  // Check for new discussions periodically
  useEffect(() => {
    if (projects.length > 0) {
      checkForNewDiscussions();
      
      // Set up interval to check every 30 seconds
      const interval = setInterval(checkForNewDiscussions, 30000);
      return () => clearInterval(interval);
    }
  }, [projects]);

  const fetchStudentProjects = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching student projects...');
      
      const response = await API.get('/projects/student');
      
      let projectsData = [];
      if (response.data?.projects) {
        projectsData = response.data.projects;
      } else if (Array.isArray(response.data)) {
        projectsData = response.data;
      }
      
      setProjects(projectsData);
      
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Check for new discussions in each project
  const checkForNewDiscussions = async () => {
    const newUnread = { ...unreadDiscussions };
    
    for (const project of projects) {
      // Only check projects where student is a member
      const isMember = project.students?.some(s => 
        s.toLowerCase().trim() === student.name.toLowerCase().trim()
      );
      
      if (!isMember) continue;
      
      try {
        const response = await API.get(`/projects/${project._id}`);
        if (response.data.success) {
          const discussions = response.data.project.discussions || [];
          const lastCheck = lastChecked[project._id] || 0;
          
          // Count discussions created after last check
          const newCount = discussions.filter(d => 
            new Date(d.createdAt) > new Date(lastCheck)
          ).length;
          
          if (newCount > 0) {
            newUnread[project._id] = newCount;
          } else {
            delete newUnread[project._id];
          }
        }
      } catch (error) {
        console.error(`Error checking discussions for project ${project._id}:`, error);
      }
    }
    
    setUnreadDiscussions(newUnread);
  };

  // Mark discussions as read when opening forum
  const handleOpenDiscussion = (projectId) => {
    const now = new Date().toISOString();
    setLastChecked(prev => {
      const updated = { ...prev, [projectId]: now };
      // Save to localStorage
      localStorage.setItem(`discussion_last_checked_${student.id}`, JSON.stringify(updated));
      return updated;
    });
    
    // Remove unread count for this project
    setUnreadDiscussions(prev => {
      const updated = { ...prev };
      delete updated[projectId];
      return updated;
    });
    
    setShowDiscussion(true);
  };

  // Filter projects where student is a member
  const myProjects = projects.filter(project => 
    project.students?.some(s => s.toLowerCase().trim() === student.name.toLowerCase().trim())
  );

  // Get all tasks assigned to this student
  const getMyTasks = () => {
    const allTasks = [];
    myProjects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        const studentTasks = project.tasks.filter(task => 
          task.assignedTo && task.assignedTo.toLowerCase().trim() === student.name.toLowerCase().trim()
        );
        allTasks.push(...studentTasks);
      }
    });
    return allTasks;
  };

  // Get pending tasks
  const getPendingTasks = () => {
    return getMyTasks().filter(task => task.status !== 'completed');
  };

  const myTasks = getMyTasks();
  const pendingTasks = getPendingTasks();

  const stats = {
    totalProjects: myProjects.length,
    pendingTasks: pendingTasks.length,
    completedTasks: myTasks.filter(t => t.status === 'completed').length,
    inProgressTasks: myTasks.filter(t => t.status === 'in-progress').length
  };

  const handleProjectClick = async (project) => {
    console.log('📂 Project clicked:', project._id);
    
    try {
      setLoading(true);
      
      const response = await API.get(`/projects/${project._id}`);
      
      if (response.data.success) {
        const projectWithTasks = response.data.project;
        setSelectedProject(projectWithTasks);
      } else {
        setSelectedProject(project);
      }
    } catch (error) {
      console.error('❌ Error fetching project details:', error);
      setSelectedProject(project);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscussion = async () => {
    if (!newDiscussion.message || !selectedProject) return;
    
    try {
      const response = await API.post('/discussions', {
        message: newDiscussion.message,
        projectId: selectedProject._id
      });
      
      const updatedProject = await API.get(`/projects/${selectedProject._id}`);
      setSelectedProject(updatedProject.data.project);
      
      setNewDiscussion({ message: '', author: student.name });
      setShowDiscussion(false);
      
    } catch (error) {
      console.error('❌ Failed to create discussion:', error);
    }
  };

  const handleAddReply = async (discussionId) => {
    if (!replyMessage || !selectedProject) return;
    
    try {
      const response = await API.post(`/discussions/${discussionId}/replies`, {
        message: replyMessage
      });
      
      const updatedProject = await API.get(`/projects/${selectedProject._id}`);
      setSelectedProject(updatedProject.data.project);
      
      setReplyMessage('');
      setReplyTo(null);
      
    } catch (error) {
      console.error('❌ Failed to add reply:', error);
    }
  };

  const getProjectProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  const getMyTaskProgress = (project) => {
    const myTasks = project.tasks?.filter(t => 
      t.assignedTo && t.assignedTo.toLowerCase().trim() === student.name.toLowerCase().trim()
    ) || [];
    if (myTasks.length === 0) return 0;
    const completed = myTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / myTasks.length) * 100);
  };

  if (loading) {
    return <div className="loading">Loading student dashboard...</div>;
  }

  if (selectedProject) {
    return (
      <StudentProjectDetails
        project={selectedProject}
        student={student}
        onBack={() => setSelectedProject(null)}
        onOpenDiscussion={() => handleOpenDiscussion(selectedProject._id)}
        showDiscussion={showDiscussion}
        newDiscussion={newDiscussion}
        setNewDiscussion={setNewDiscussion}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyMessage={replyMessage}
        setReplyMessage={replyMessage}
        handleAddDiscussion={handleAddDiscussion}
        handleAddReply={handleAddReply}
        onCloseModals={() => {
          setShowDiscussion(false);
          setReplyTo(null);
        }}
      />
    );
  }

  return (
    <div className="student-dashboard">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="app-title">
            AcadSync
            <span className="title-badge">Student Dashboard</span>
          </h1>
          <div className="header-right">
            <div className="welcome-section">
              <p className="welcome-text">
                Welcome back, <span className="user-name">{student.name}</span>
              </p>
              <p className="guide-info">
                <i className="fas fa-chalkboard-teacher"></i>
                Your Guide: <span className="guide-name">{student.guideName}</span>
              </p>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* STUDENT PANEL SECTION */}
        <section className="panel-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-user-graduate"></i>
              MY OVERVIEW
            </h2>
            <p className="section-description">Track your progress and tasks</p>
          </div>
          
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item-small">
              <i className="fas fa-project-diagram"></i>
              <div>
                <span className="stat-value-small">{stats.totalProjects}</span>
                <span className="stat-label-small">Projects</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-clock"></i>
              <div>
                <span className="stat-value-small">{stats.pendingTasks}</span>
                <span className="stat-label-small">Pending</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-spinner"></i>
              <div>
                <span className="stat-value-small">{stats.inProgressTasks}</span>
                <span className="stat-label-small">In Progress</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-check-circle"></i>
              <div>
                <span className="stat-value-small">{stats.completedTasks}</span>
                <span className="stat-label-small">Completed</span>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks Preview */}
          <div className="upcoming-tasks-preview">
            <h3><i className="fas fa-tasks"></i> Your Tasks</h3>
            {pendingTasks.length > 0 ? (
              <div className="preview-tasks-list">
                {pendingTasks.slice(0, 3).map(task => (
                  <div key={task._id} className="preview-task-item">
                    <div className="preview-task-header">
                      <span className={`task-status-dot ${task.status}`}></span>
                      <span className="preview-task-title">{task.title}</span>
                    </div>
                    <span className="preview-task-due">
                      <i className="fas fa-calendar"></i> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                ))}
                {pendingTasks.length > 3 && (
                  <div className="more-tasks-indicator">
                    +{pendingTasks.length - 3} more task{pendingTasks.length - 3 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-state">No pending tasks! 🎉</p>
            )}
          </div>
        </section>

        {/* MY PROJECTS SECTION */}
        <section className="projects-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-diagram-project"></i>
              MY PROJECTS
            </h2>
            <p className="section-description">Projects you're working on</p>
          </div>
          
          <div className="projects-grid">
            {myProjects.length > 0 ? (
              myProjects.map((project) => {
                const unreadCount = unreadDiscussions[project._id] || 0;
                
                return (
                  <div 
                    key={project._id} 
                    className="project-card-overview"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="project-card-header">
                      <i className="fas fa-project-diagram"></i>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 className="project-card-title">{project.name}</h3>
                        {unreadCount > 0 && (
                          <span className="notification-badge">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="project-card-stats">
                      <div className="project-stat">
                        <i className="fas fa-users"></i>
                        <span>{project.students?.length || 0} Team Members</span>
                      </div>
                      <div className="project-stat">
                        <i className="fas fa-tasks"></i>
                        <span>Your Tasks: {project.tasks?.filter(t => 
                          t.assignedTo && t.assignedTo.toLowerCase().trim() === student.name.toLowerCase().trim()
                        ).length || 0}</span>
                      </div>
                      <div className="project-stat">
                        <i className="fas fa-comments"></i>
                        <span>Discussions: {project.discussions?.length || 0}</span>
                        {unreadCount > 0 && (
                          <span className="notification-dot"></span>
                        )}
                      </div>
                    </div>

                    <div className="project-card-progress">
                      <div className="progress-label">
                        <span>Your Progress</span>
                        <span>{getMyTaskProgress(project)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${getMyTaskProgress(project)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="project-card-footer">
                      <span className="view-details">
                        View Project Details 
                        <i className="fas fa-arrow-right"></i>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-projects-message">
                <i className="fas fa-folder-open" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                <p>You are not assigned to any projects yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
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
  const [allTasks, setAllTasks] = useState([]); // New state for all tasks
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ message: '', author: '' });
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
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

  // Fetch student's projects and all tasks
  useEffect(() => {
    if (student.id) {
      fetchStudentProjects();
    }
  }, [student.id]);

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
      
      // After fetching projects, get all tasks for this student
      fetchAllStudentTasks(projectsData);
      
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tasks from all projects for this student
  const fetchAllStudentTasks = async (projectsList) => {
    try {
      const allStudentTasks = [];
      
      // Loop through each project and get its tasks
      for (const project of projectsList) {
        try {
          const response = await API.get(`/projects/${project._id}`);
          if (response.data.success) {
            const projectTasks = response.data.project.tasks || [];
            
            // Filter tasks assigned to this student
            const studentTasks = projectTasks.filter(task => 
              task.assignedTo && task.assignedTo.toLowerCase().trim() === student.name.toLowerCase().trim()
            );
            
            // Add project name to each task for reference
            const tasksWithProject = studentTasks.map(task => ({
              ...task,
              projectName: project.name,
              projectId: project._id
            }));
            
            allStudentTasks.push(...tasksWithProject);
          }
        } catch (error) {
          console.error(`Error fetching tasks for project ${project._id}:`, error);
        }
      }
      
      console.log('📋 All student tasks:', allStudentTasks);
      setAllTasks(allStudentTasks);
      
    } catch (error) {
      console.error('❌ Error fetching all tasks:', error);
    }
  };

  // Get pending tasks (not completed)
  const getPendingTasks = () => {
    return allTasks.filter(task => task.status !== 'completed');
  };

  // Get tasks by status for stats
  const getTasksByStatus = () => {
    return {
      pending: allTasks.filter(t => t.status === 'pending').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      completed: allTasks.filter(t => t.status === 'completed').length
    };
  };

  const taskStats = getTasksByStatus();
  const pendingTasks = getPendingTasks();

  // Filter projects where student is a member
  const myProjects = projects.filter(project => 
    project.students?.some(s => s.toLowerCase().trim() === student.name.toLowerCase().trim())
  );

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
        onOpenDiscussion={() => setShowDiscussion(true)}
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
                <span className="stat-value-small">{myProjects.length}</span>
                <span className="stat-label-small">Projects</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-clock"></i>
              <div>
                <span className="stat-value-small">{taskStats.pending}</span>
                <span className="stat-label-small">Pending</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-spinner"></i>
              <div>
                <span className="stat-value-small">{taskStats.inProgress}</span>
                <span className="stat-label-small">In Progress</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-check-circle"></i>
              <div>
                <span className="stat-value-small">{taskStats.completed}</span>
                <span className="stat-label-small">Completed</span>
              </div>
            </div>
          </div>

          {/* ALL PENDING TASKS - FROM ALL PROJECTS */}
          <div className="all-tasks-preview">
            <h3><i className="fas fa-tasks"></i> Your Tasks (All Projects)</h3>
            {pendingTasks.length > 0 ? (
              <div className="preview-tasks-list">
                {pendingTasks.map(task => (
                  <div key={task._id} className="preview-task-item">
                    <div className="preview-task-header">
                      <span className={`task-status-dot ${task.status}`}></span>
                      <span className="preview-task-title">{task.title}</span>
                    </div>
                    <div className="preview-task-details">
                      <span className="preview-project-name">
                        <i className="fas fa-folder"></i> {task.projectName}
                      </span>
                      <span className="preview-task-due">
                        <i className="fas fa-calendar"></i> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                  </div>
                ))}
                {pendingTasks.length > 5 && (
                  <div className="more-tasks-indicator">
                    +{pendingTasks.length - 5} more task{pendingTasks.length - 5 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-tasks">
                <i className="fas fa-check-circle"></i>
                <p>No pending tasks! 🎉</p>
              </div>
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
              myProjects.map((project) => (
                <div 
                  key={project._id} 
                  className="project-card-overview"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="project-card-header">
                    <i className="fas fa-project-diagram"></i>
                    <div>
                      <h3 className="project-card-title">{project.name}</h3>
                      <span className="project-guide">
                        <i className="fas fa-chalkboard-teacher"></i>
                        Guide: {project.guide}
                      </span>
                    </div>
                  </div>
                  
                  <div className="project-card-stats">
                    <div className="project-stat">
                      <i className="fas fa-users"></i>
                      <span>{project.students?.length || 0} Team Members</span>
                    </div>
                    <div className="project-stat">
                      <i className="fas fa-tasks"></i>
                      <span>Your Tasks: {allTasks.filter(t => t.projectId === project._id).length}</span>
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
              ))
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
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate} from 'react-router-dom';
import API from '../../services/api';
import ProjectDetails from './ProjectDetails';
import './GuideDashboard.css';

const GuideDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', student: '' });
  
  // State for modals
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAllocateTask, setShowAllocateTask] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  
  // Form states
  const [newStudent, setNewStudent] = useState({ name: '' });
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '', dueDate: '' });
  const [newDiscussion, setNewDiscussion] = useState({ message: '', author: '' });
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [assignToAll, setAssignToAll] = useState(false);
  
  // Notification state
  const [unreadDiscussions, setUnreadDiscussions] = useState({});
  const [lastChecked, setLastChecked] = useState({});

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
      
      if (userData.role !== 'guide') {
        navigate('/student');
        return;
      }
      
      setUser(userData);
      setNewDiscussion(prev => ({ ...prev, author: `Guide ${userData.name}` }));
      
      // Load last checked timestamps from localStorage
      const saved = localStorage.getItem(`discussion_last_checked_${userData._id}`);
      if (saved) {
        setLastChecked(JSON.parse(saved));
      }
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

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // Refresh projects when returning from project details
  useEffect(() => {
    if (!selectedProject) {
      fetchProjects();
    }
  }, [selectedProject]);

  // Check for new discussions periodically
  useEffect(() => {
    if (projects.length > 0) {
      checkForNewDiscussions();
      
      // Set up interval to check every 30 seconds
      const interval = setInterval(checkForNewDiscussions, 30000);
      return () => clearInterval(interval);
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await API.get('/projects');
      
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
      localStorage.setItem(`discussion_last_checked_${user?._id}`, JSON.stringify(updated));
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

  // Handle Add Project
  const handleAddProject = async () => {
    if (!newProject.name) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await API.post('/projects', {
        name: newProject.name,
        students: newProject.student ? [newProject.student] : []
      });
      
      const newProjectData = response.data.project || response.data;
      setProjects([...projects, newProjectData]);
      setNewProject({ name: '', student: '' });
      setShowAddProject(false);
      
    } catch (error) {
      console.error('❌ Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Student
  const handleAddStudent = async () => {
    if (!newStudent.name || !selectedProject) {
      return;
    }
    
    try {
      setLoading(true);
      await API.put(`/projects/${selectedProject._id}`, {
        students: [...selectedProject.students, newStudent.name]
      });
      
      // Refresh project data
      const updatedProject = await API.get(`/projects/${selectedProject._id}`);
      setSelectedProject(updatedProject.data.project);
      
      setNewStudent({ name: '' });
      setShowAddStudent(false);
      
    } catch (error) {
      console.error('❌ Failed to add student:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Allocate Task
  const handleAllocateTask = async (taskData) => {
    if (!selectedProject) {
      console.log('❌ No selected project');
      return;
    }
    
    try {
      setLoading(true);
      
      if (Array.isArray(taskData)) {
        const taskPromises = taskData.map(task => {
          return API.post('/tasks', {
            title: task.title,
            assignedTo: task.assignedTo,
            projectId: selectedProject._id,
            status: task.status || 'pending',
            dueDate: task.dueDate
          });
        });
        
        await Promise.all(taskPromises);
        
      } else {
        await API.post('/tasks', {
          title: taskData.title,
          assignedTo: taskData.assignedTo,
          projectId: selectedProject._id,
          status: taskData.status || 'pending',
          dueDate: taskData.dueDate
        });
      }
      
      // Refresh project data
      const updatedProject = await API.get(`/projects/${selectedProject._id}`);
      setSelectedProject(updatedProject.data.project);
      
      // Reset form
      setNewTask({ title: '', assignedTo: '', dueDate: '' });
      setAssignToAll(false);
      setShowAllocateTask(false);
      
    } catch (error) {
      console.error('❌ Failed to allocate task:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update Task Status
  const updateTaskStatus = async (taskId, newStatus) => {
    if (!selectedProject) {
      return;
    }
    
    try {
      const response = await API.put(`/tasks/${taskId}/status`, {
        status: newStatus
      });
      
      // Update the selected project tasks
      const updatedTasks = selectedProject.tasks.map(t => 
        t._id === taskId ? { ...t, status: newStatus } : t
      );
      
      setSelectedProject({
        ...selectedProject,
        tasks: updatedTasks
      });
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Failed to update task status:', error);
      throw error;
    }
  };

  // Handle Add Discussion - FIXED to keep modal open
  const handleAddDiscussion = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newDiscussion.message || !selectedProject) {
      return;
    }
    
    // Store current message to clear later
    const currentMessage = newDiscussion.message;
    
    try {
      await API.post('/discussions', {
        author: `Guide ${user?.name}`,
        message: currentMessage,
        projectId: selectedProject._id
      });
      
      // Fetch updated project data
      const response = await API.get(`/projects/${selectedProject._id}`);
      const updatedProject = response.data.project;
      
      // Update the selected project WITHOUT changing modal state
      setSelectedProject({
        ...selectedProject,
        ...updatedProject,
        discussions: updatedProject.discussions || []
      });
      
      // Clear the message but KEEP THE MODAL OPEN
      setNewDiscussion({ message: '', author: `Guide ${user?.name}` });
      
    } catch (error) {
      console.error('❌ Failed to create discussion:', error);
    }
  };

  // Handle Add Reply - FIXED to keep modal open
  const handleAddReply = async (discussionId) => {
    if (!replyMessage || !selectedProject) {
      return;
    }
    
    const currentReply = replyMessage;
    
    try {
      await API.post(`/discussions/${discussionId}/replies`, {
        author: `Guide ${user?.name}`,
        message: currentReply
      });
      
      // Fetch updated project data
      const response = await API.get(`/projects/${selectedProject._id}`);
      const updatedProject = response.data.project;
      
      // Update the selected project WITHOUT changing modal state
      setSelectedProject({
        ...selectedProject,
        ...updatedProject,
        discussions: updatedProject.discussions || []
      });
      
      setReplyMessage('');
      setReplyTo(null);
      
    } catch (error) {
      console.error('❌ Failed to add reply:', error);
    }
  };

  const handleCloseModals = () => {
    setShowAddStudent(false);
    setShowAllocateTask(false);
    setShowDiscussion(false);
    setReplyTo(null);
    setAssignToAll(false);
    setNewTask({ title: '', assignedTo: '', dueDate: '' });
  };

  // Safe stats calculation
  const stats = {
    active: projects?.reduce((acc, p) => acc + (p?.students?.length || 0), 0) || 0,
    pending: projects?.reduce((acc, p) => acc + (p?.tasks?.filter(t => t?.status === 'pending')?.length || 0), 0) || 0,
    completed: projects?.reduce((acc, p) => acc + (p?.tasks?.filter(t => t?.status === 'completed')?.length || 0), 0) || 0
  };

  if (loading) {
    return <div className="loading">Loading guide dashboard...</div>;
  }

  if (selectedProject) {
    return (
      <ProjectDetails
        key={selectedProject._id} // Add key to force re-render only when project changes
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onProjectUpdate={(updatedProject) => {
          // Update project without affecting modal state
          setSelectedProject(prev => ({
            ...prev,
            ...updatedProject
          }));
        }}
        onAddStudent={() => setShowAddStudent(true)}
        onAllocateTask={() => setShowAllocateTask(true)}
        onOpenDiscussion={() => handleOpenDiscussion(selectedProject._id)}
        onUpdateTaskStatus={updateTaskStatus}
        showAddStudent={showAddStudent}
        showAllocateTask={showAllocateTask}
        showDiscussion={showDiscussion}
        newStudent={newStudent}
        setNewStudent={setNewStudent}
        newTask={newTask}
        setNewTask={setNewTask}
        newDiscussion={newDiscussion}
        setNewDiscussion={setNewDiscussion}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        handleAddStudent={handleAddStudent}
        handleAllocateTask={handleAllocateTask}
        handleAddDiscussion={handleAddDiscussion}
        handleAddReply={handleAddReply}
        onCloseModals={handleCloseModals}
        assignToAll={assignToAll}
        setAssignToAll={setAssignToAll}
        unreadCount={unreadDiscussions[selectedProject._id] || 0}
      />
    );
  }

  return (
    <div className="dashboard">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="app-title">
            AcadSync
            <span className="title-badge">Guide Dashboard</span>
          </h1>
          <div className="header-right">
            <p className="welcome-text">
              Welcome back, <span className="user-name">{user?.name || 'Guide'}</span>
            </p>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* GUIDE PANEL SECTION */}
        <section className="panel-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-compass"></i>
              GUIDE PANEL
            </h2>
            <p className="section-description">Your command center for managing projects</p>
          </div>
          
          <div className="action-cards">
            <div className="action-card-wrapper">
              <button 
                className="action-card view-projects"
                onClick={() => document.querySelector('.projects-grid')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <i className="fas fa-folder-open"></i>
                <div className="action-text">
                  <span className="action-title">View My Projects</span>
                  <span className="action-hint">Browse all your coordinated projects</span>
                </div>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            
            <div className="action-card-wrapper">
              <button 
                className="action-card add-project"
                onClick={() => setShowAddProject(true)}
              >
                <i className="fas fa-plus-circle"></i>
                <div className="action-text">
                  <span className="action-title">Add New Project</span>
                  <span className="action-hint">Create a new project</span>
                </div>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>

          <div className="quick-stats">
            <div className="stat-item-small">
              <i className="fas fa-users"></i>
              <div>
                <span className="stat-value-small">{stats.active}</span>
                <span className="stat-label-small">Students</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-tasks"></i>
              <div>
                <span className="stat-value-small">{stats.pending}</span>
                <span className="stat-label-small">Pending</span>
              </div>
            </div>
            <div className="stat-item-small">
              <i className="fas fa-check-circle"></i>
              <div>
                <span className="stat-value-small">{stats.completed}</span>
                <span className="stat-label-small">Completed</span>
              </div>
            </div>
          </div>
        </section>

        {/* PROJECTS OVERVIEW SECTION */}
        <section className="projects-section">
          <div className="section-header">
            <h2 className="section-title">
              <i className="fas fa-diagram-project"></i>
              MY PROJECTS
            </h2>
            <p className="section-description">Click on any project to view details</p>
          </div>
          
          <div className="projects-grid">
            {projects && projects.length > 0 ? (
              projects.map((project, index) => (
                <div 
                  key={project._id || index} 
                  className="project-card-overview"
                  onClick={() => {
                    setSelectedProject({
                      ...project,
                      students: project.students || [],
                      tasks: project.tasks || [],
                      discussions: project.discussions || []
                    });
                  }}
                >
                  <div className="project-card-header">
                    <i className="fas fa-project-diagram"></i>
                    <h3 className="project-card-title">{project?.name || 'Unnamed Project'}</h3>
                  </div>
                  
                  <div className="project-card-stats">
                    <div className="project-stat">
                      <i className="fas fa-users"></i>
                      <span>{(project?.students?.length || 0)} Students</span>
                    </div>
                    <div className="project-stat">
                      <i className="fas fa-tasks"></i>
                      <span>{(project?.tasks?.length || 0)} Tasks</span>
                    </div>
                    <div className="project-stat">
                      <i className="fas fa-comments"></i>
                      <span>{(project?.discussions?.length || 0)} Discussions</span>
                    </div>
                  </div>

                  <div className="project-card-footer">
                    <span className="view-details">
                      Click to view details 
                      <i className="fas fa-arrow-right"></i>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-projects-message">
                <i className="fas fa-folder-open" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                <p>No projects yet. Click "Add New Project" to create one!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="modal" onClick={() => setShowAddProject(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3><i className="fas fa-plus-circle"></i> Add New Project</h3>
            <p className="modal-instruction">Fill in the details below to create a new project</p>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              autoFocus
            />
            <input
              type="text"
              placeholder="Initial Student Name (optional)"
              value={newProject.student}
              onChange={(e) => setNewProject({...newProject, student: e.target.value})}
            />
            <div className="modal-actions">
              <button onClick={() => setShowAddProject(false)}>Cancel</button>
              <button 
                onClick={handleAddProject} 
                className="primary"
                disabled={!newProject.name}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideDashboard;
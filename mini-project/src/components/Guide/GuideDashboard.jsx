import React, { useState, useEffect } from 'react';
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
  const [newTask, setNewTask] = useState({ title: '', assignedTo: '' });
  const [newDiscussion, setNewDiscussion] = useState({ message: '', author: '' });
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [assignToAll, setAssignToAll] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('🔍 GuideDashboard mounted');
    console.log('Stored user:', storedUser);
    console.log('Token exists:', !!token);
    
    if (!token || !storedUser) {
      console.log('❌ No token or user, redirecting to login');
      navigate('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      console.log('👤 User data:', userData);
      
      if (userData.role !== 'guide') {
        console.log('❌ User is not a guide, redirecting to student page');
        navigate('/student');
        return;
      }
      
      setUser(userData);
      // Set author for discussions
      setNewDiscussion(prev => ({ ...prev, author: `Guide ${userData.name}` }));
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  // API Base URL check
  useEffect(() => {
    console.log('🔍 API Base URL:', API.defaults?.baseURL);
    console.log('🔍 Full projects URL:', API.defaults?.baseURL + '/projects');
  }, []);

  // Fetch projects on mount and when returning from project details
  useEffect(() => {
    fetchProjects();
  }, []);

  // Refresh projects when returning from project details
  useEffect(() => {
    if (!selectedProject) {
      fetchProjects();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching projects from:', API.defaults?.baseURL + '/projects');
      
      const response = await API.get('/projects');
      console.log('📥 Full response:', response);
      console.log('📥 Response data:', response.data);
      
      let projectsData = [];
      if (response.data?.projects) {
        projectsData = response.data.projects;
      } else if (Array.isArray(response.data)) {
        projectsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        projectsData = response.data.data;
      }
      
      console.log('✅ Projects loaded:', projectsData.length, 'projects');
      setProjects(projectsData);
      
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name) {
      alert('Please enter a project name');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📤 Creating project with data:', {
        name: newProject.name,
        students: newProject.student ? [newProject.student] : []
      });
      
      const response = await API.post('/projects', {
        name: newProject.name,
        students: newProject.student ? [newProject.student] : []
      });
      
      console.log('✅ Project created:', response.data);
      
      const newProjectData = response.data.project || response.data;
      setProjects([...projects, newProjectData]);
      setNewProject({ name: '', student: '' });
      setShowAddProject(false);
      alert('Project created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      alert(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // ========== STUDENT MANAGEMENT ==========
  const handleAddStudent = async () => {
    if (!newStudent.name || !selectedProject) {
      alert('Please enter a student name');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📤 Adding student to project:', selectedProject._id);
      
      const response = await API.put(`/projects/${selectedProject._id}`, {
        students: [...selectedProject.students, newStudent.name]
      });
      
      console.log('✅ Student added:', response.data);
      
      // Update selected project with new student
      setSelectedProject({
        ...selectedProject,
        students: [...selectedProject.students, newStudent.name]
      });
      
      setNewStudent({ name: '' });
      setShowAddStudent(false);
      alert('Student added successfully!');
      
    } catch (error) {
      console.error('❌ Failed to add student:', error);
      alert(error.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  // ========== TASK MANAGEMENT ==========
  const handleAllocateTask = async (taskData = null) => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      
      if (Array.isArray(taskData)) {
        // Multiple tasks (assign to all)
        console.log('📤 Creating multiple tasks');
        
        const taskPromises = taskData.map(task => 
          API.post('/tasks', {
            title: task.title,
            assignedTo: task.assignedTo,
            projectId: selectedProject._id,
            status: 'pending'
          })
        );
        
        await Promise.all(taskPromises);
        console.log('✅ Multiple tasks created');
        
      } else {
        // Single task
        if (!newTask.title || !newTask.assignedTo) {
          alert('Please fill in all task details');
          return;
        }
        
        console.log('📤 Creating task:', newTask);
        await API.post('/tasks', {
          title: newTask.title,
          assignedTo: newTask.assignedTo,
          projectId: selectedProject._id,
          status: 'pending'
        });
        
        console.log('✅ Task created');
      }
      
      // Fetch updated project data
      const updatedProject = await API.get(`/projects/${selectedProject._id}`);
      setSelectedProject(updatedProject.data.project);
      
      setNewTask({ title: '', assignedTo: '' });
      setAssignToAll(false);
      setShowAllocateTask(false);
      alert('Task(s) allocated successfully!');
      
    } catch (error) {
      console.error('❌ Failed to allocate task:', error);
      alert(error.response?.data?.message || 'Failed to allocate task');
    } finally {
      setLoading(false);
    }
  };

  // ========== TASK STATUS UPDATE ==========
  const updateTaskStatus = async (taskId, newStatus) => {
    if (!selectedProject) return;
    
    try {
      console.log('📤 Updating task status:', taskId, newStatus);
      
      await API.put(`/tasks/${taskId}/status`, {
        status: newStatus
      });
      
      console.log('✅ Task status updated');
      
      // Update selected project tasks
      const updatedTasks = selectedProject.tasks.map(t => 
        t._id === taskId ? { ...t, status: newStatus } : t
      );
      
      setSelectedProject({
        ...selectedProject,
        tasks: updatedTasks
      });
      
    } catch (error) {
      console.error('❌ Failed to update task status:', error);
      alert(error.response?.data?.message || 'Failed to update task status');
    }
  };

  // ========== DISCUSSION FORUM ==========
  const handleAddDiscussion = async () => {
    if (!newDiscussion.message || !selectedProject) {
      alert('Please enter a message');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📤 Creating discussion for project:', selectedProject._id);
      
      const response = await API.post('/discussions', {
        author: `Guide ${user?.name}`,
        message: newDiscussion.message,
        projectId: selectedProject._id
      });
      
      console.log('✅ Discussion created:', response.data);
      
      // Fetch updated project data
      const updatedProject = await API.get(`/projects/${selectedProject._id}`);
      setSelectedProject(updatedProject.data.project);
      
      setNewDiscussion({ message: '', author: `Guide ${user?.name}` });
      setShowDiscussion(false);
      alert('Discussion posted successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create discussion:', error);
      alert(error.response?.data?.message || 'Failed to create discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (discussionId) => {
    if (!replyMessage || !selectedProject) {
      alert('Please enter a reply message');
      return;
    }
    
    try {
      console.log('📤 Adding reply to discussion:', discussionId);
      
      await API.post(`/discussions/${discussionId}/replies`, {
        author: `Guide ${user?.name}`,
        message: replyMessage
      });
      
      console.log('✅ Reply added');
      
      // Fetch updated project data
      const updatedProject = await API.get(`/projects/${selectedProject._id}`);
      setSelectedProject(updatedProject.data.project);
      
      setReplyMessage('');
      setReplyTo(null);
      
    } catch (error) {
      console.error('❌ Failed to add reply:', error);
      alert(error.response?.data?.message || 'Failed to add reply');
    }
  };

  // ========== MODAL CONTROLS ==========
  const handleCloseModals = () => {
    setShowAddStudent(false);
    setShowAllocateTask(false);
    setShowDiscussion(false);
    setReplyTo(null);
    setAssignToAll(false);
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
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onProjectUpdate={(updatedProject) => setSelectedProject(updatedProject)}
        // Student management
        onAddStudent={() => setShowAddStudent(true)}
        onAllocateTask={() => setShowAllocateTask(true)}
        onOpenDiscussion={() => setShowDiscussion(true)}
        onUpdateTaskStatus={updateTaskStatus}
        // Modal states
        showAddStudent={showAddStudent}
        showAllocateTask={showAllocateTask}
        showDiscussion={showDiscussion}
        // Form data
        newStudent={newStudent}
        setNewStudent={setNewStudent}
        newTask={newTask}
        setNewTask={setNewTask}
        newDiscussion={newDiscussion}
        setNewDiscussion={setNewDiscussion}
        // Reply handling
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        // Action handlers
        handleAddStudent={handleAddStudent}
        handleAllocateTask={handleAllocateTask}
        handleAddDiscussion={handleAddDiscussion}
        handleAddReply={handleAddReply}
        onCloseModals={handleCloseModals}
        assignToAll={assignToAll}
        setAssignToAll={setAssignToAll}
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
          <p className="welcome-text">
            Welcome back, <span className="user-name">{user?.name || 'Guide'}</span>
          </p>
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
                  key={project?._id || index} 
                  className="project-card-overview"
                  onClick={() => {
                    console.log('Selected project:', project);
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
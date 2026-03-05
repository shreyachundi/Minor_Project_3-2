import React, { useState, useEffect } from 'react';
import StudentProjectDetails from './StudentProjectDetails';
import './StudentDashboard.css';

const StudentDashboard = () => {
  // Get user from localStorage directly - NO useAuth
  const [user, setUser] = useState({ name: 'Student' });
  const [student, setStudent] = useState({
    id: 's1',
    name: 'Student',
    email: 'student@acadsync.com',
    guideName: 'Ammannamma',
    guideId: 'g1'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setStudent({
        id: 's1',
        name: userData.name,
        email: userData.email || 'student@acadsync.com',
        guideName: 'Ammannamma',
        guideId: 'g1'
      });
    }
  }, []);

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'AI Based Monitoring System',
      guide: 'Ammannamma',
      students: ['Varshitha', 'Harimya'],
      tasks: [
        { id: 't1', title: 'Data Collection', assignedTo: 'Varshitha', status: 'pending', dueDate: '2024-03-15', description: 'Collect training data for the AI model' },
        { id: 't2', title: 'Model Training', assignedTo: 'Harimya', status: 'completed', dueDate: '2024-03-10', description: 'Train the initial model' }
      ],
      discussions: [
        { 
          id: 'd1', 
          author: 'Varshitha', 
          message: 'Should we use TensorFlow or PyTorch?', 
          timestamp: '2024-02-23 10:30', 
          replies: [
            { id: 'r1', author: 'Guide Ammannamma', message: 'Let\'s start with TensorFlow - better deployment options.', timestamp: '2024-02-23 11:15' }
          ] 
        },
        { 
          id: 'd2', 
          author: 'Guide Ammannamma', 
          message: 'Team meeting tomorrow at 3 PM to discuss progress', 
          timestamp: '2024-02-24 09:00', 
          replies: [] 
        }
      ]
    },
    {
      id: 2,
      name: 'Blockchain Academic Records',
      guide: 'Ammannamma',
      students: ['Shreya', 'Indu'],
      tasks: [
        { id: 't3', title: 'Smart Contract Dev', assignedTo: 'Shreya', status: 'pending', dueDate: '2024-03-20', description: 'Develop smart contracts for record storage' },
        { id: 't4', title: 'UI Design', assignedTo: 'Indu', status: 'in-progress', dueDate: '2024-03-18', description: 'Design the user interface' },
      ],
      discussions: [
        { 
          id: 'd3', 
          author: 'Indu', 
          message: 'Which blockchain platform should we use?', 
          timestamp: '2024-02-23 09:45', 
          replies: [
            { id: 'r2', author: 'Guide Ammannamma', message: 'Let\'s go with Ethereum for better documentation.', timestamp: '2024-02-23 10:15' }
          ] 
        }
      ]
    },
  ]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ message: '', author: student.name });
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Filter projects where student is a member
  const myProjects = projects.filter(project => 
    project.students.includes(student.name)
  );

  // Stats calculation for student
  const stats = {
    totalProjects: myProjects.length,
    pendingTasks: myProjects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.assignedTo === student.name && t.status === 'pending').length, 0
    ),
    completedTasks: myProjects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.assignedTo === student.name && t.status === 'completed').length, 0
    ),
    inProgressTasks: myProjects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.assignedTo === student.name && t.status === 'in-progress').length, 0
    )
  };

  const handleAddDiscussion = () => {
    if (!newDiscussion.message || !selectedProject) return;
    
    const discussion = {
      id: Date.now().toString(),
      author: student.name,
      message: newDiscussion.message,
      timestamp: new Date().toLocaleString(),
      replies: []
    };
    
    setProjects(projects.map(p => 
      p.id === selectedProject.id 
        ? { ...p, discussions: [...p.discussions, discussion] }
        : p
    ));
    
    setSelectedProject({
      ...selectedProject,
      discussions: [...selectedProject.discussions, discussion]
    });
    
    setNewDiscussion({ message: '', author: student.name });
    setShowDiscussion(false);
  };

  const handleAddReply = (discussionId) => {
    if (!replyMessage || !selectedProject) return;
    
    const reply = {
      id: Date.now().toString(),
      author: student.name,
      message: replyMessage,
      timestamp: new Date().toLocaleString()
    };
    
    const updatedDiscussions = selectedProject.discussions.map(d => 
      d.id === discussionId 
        ? { ...d, replies: [...d.replies, reply] }
        : d
    );
    
    setProjects(projects.map(p => 
      p.id === selectedProject.id 
        ? { ...p, discussions: updatedDiscussions }
        : p
    ));
    
    setSelectedProject({
      ...selectedProject,
      discussions: updatedDiscussions
    });
    
    setReplyMessage('');
    setReplyTo(null);
  };

  const updateTaskStatus = (taskId, newStatus) => {
    if (!selectedProject) return;
    
    const updatedTasks = selectedProject.tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    
    setProjects(projects.map(p => 
      p.id === selectedProject.id 
        ? { ...p, tasks: updatedTasks }
        : p
    ));
    
    setSelectedProject({
      ...selectedProject,
      tasks: updatedTasks
    });
  };

  const getProjectProgress = (project) => {
    if (project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / project.tasks.length) * 100);
  };

  const getMyTaskProgress = (project) => {
    const myTasks = project.tasks.filter(t => t.assignedTo === student.name);
    if (myTasks.length === 0) return 0;
    const completed = myTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / myTasks.length) * 100);
  };

  if (selectedProject) {
    return (
      <StudentProjectDetails
        project={selectedProject}
        student={student}
        onBack={() => setSelectedProject(null)}
        onOpenDiscussion={() => setShowDiscussion(true)}
        onUpdateTaskStatus={updateTaskStatus}
        showDiscussion={showDiscussion}
        newDiscussion={newDiscussion}
        setNewDiscussion={setNewDiscussion}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
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
          <div className="welcome-section">
            <p className="welcome-text">
              Welcome back, <span className="user-name">{student.name}</span>
            </p>
            <p className="guide-info">
              <i className="fas fa-chalkboard-teacher"></i>
              Your Guide: <span className="guide-name">{student.guideName}</span>
            </p>
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
            {myProjects.flatMap(p => 
              p.tasks.filter(t => t.assignedTo === student.name && t.status !== 'completed')
            ).slice(0, 3).length > 0 ? (
              <div className="preview-tasks-list">
                {myProjects.flatMap(p => 
                  p.tasks.filter(t => t.assignedTo === student.name && t.status !== 'completed')
                ).slice(0, 3).map(task => (
                  <div key={task.id} className="preview-task-item">
                    <div className="preview-task-header">
                      <span className={`task-status-dot ${task.status}`}></span>
                      <span className="preview-task-title">{task.title}</span>
                    </div>
                    <span className="preview-task-due">Due: {task.dueDate}</span>
                  </div>
                ))}
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
            {myProjects.map((project) => (
              <div 
                key={project.id} 
                className="project-card-overview"
                onClick={() => setSelectedProject(project)}
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
                    <span>{project.students.length} Team Members</span>
                  </div>
                  <div className="project-stat">
                    <i className="fas fa-tasks"></i>
                    <span>Your Tasks: {project.tasks.filter(t => t.assignedTo === student.name).length}</span>
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
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
import { useState } from "react";

function ManageProject({ project }) {
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [studentName, setStudentName] = useState("");
  const [taskName, setTaskName] = useState("");

  const addStudent = () => {
    if (!studentName) return;
    setStudents([...students, studentName]);
    setStudentName("");
  };

  const addTask = () => {
    if (!taskName) return;
    setTasks([...tasks, taskName]);
    setTaskName("");
  };

  if (!project) return <div>Select a project</div>;

  return (
    <>
      <h2 className="section-title">Manage: {project.title}</h2>

      <div className="manage-grid">

        <div className="manage-section">
          <h3>Add Student</h3>

          <input
            type="text"
            placeholder="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />

          <button className="primary-btn" onClick={addStudent}>
            Add
          </button>

          <ul>
            {students.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="manage-section">
          <h3>Allocate Task</h3>

          <input
            type="text"
            placeholder="Task Name"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />

          <button className="primary-btn" onClick={addTask}>
            Add
          </button>

          <ul>
            {tasks.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

      </div>
    </>
  );
}

export default ManageProject;
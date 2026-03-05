import { useState } from "react";


function ViewProjects({ setActive, setSelectedProject }) {
  const [projects] = useState([
    { id: 1, title: "AI Based Monitoring System" },
    { id: 2, title: "Blockchain Academic Records" }
  ]);

  return (
    <>
      <h2 className="section-title">My Coordinated Projects</h2>

      {projects.map((project) => (
        <div key={project.id} className="project-item">
          <span>{project.title}</span>

          <button
            className="primary-btn"
            onClick={() => {
              setSelectedProject(project);
              setActive("manage");
            }}
          >
            Manage
          </button>
        </div>
      ))}
    </>
  );
}

export default ViewProjects;
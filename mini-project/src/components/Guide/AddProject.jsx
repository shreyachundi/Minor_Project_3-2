import { useState } from "react";

function AddProject({ setActive }) {
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (!title) return alert("Enter project title");
    alert("Project Added Successfully!");
    setTitle("");
    setActive("view");
  };

  return (
    <>
      <h2 className="section-title">Add New Project</h2>

      <input
        type="text"
        placeholder="Enter Project Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button className="primary-btn" onClick={handleAdd}>
        Create Project
      </button>
    </>
  );
}

export default AddProject;
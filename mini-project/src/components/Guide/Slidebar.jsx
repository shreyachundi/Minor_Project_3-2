function Sidebar({ setActive }) {
  return (
    <div className="sidebar">
      <h3>Guide Panel</h3>

      <button onClick={() => setActive("view")}>
        View My Projects
      </button>

      <button onClick={() => setActive("add")}>
        Add New Project
      </button>
    </div>
  );
}

export default Sidebar;
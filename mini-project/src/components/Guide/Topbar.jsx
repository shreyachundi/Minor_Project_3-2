function Topbar() {
  const guideName = localStorage.getItem("name") || "Guide";

  return (
    <div className="topbar">
      <div>AcadSync: Guide Dashboard</div>
      <div>Welcome, {guideName}</div>
    </div>
  );
}

export default Topbar;
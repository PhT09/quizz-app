import React from "react";

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button 
      onClick={toggleTheme} 
      className="btn btn-secondary btn-sm theme-toggle"
      title="Đổi giao diện Sáng/Tối"
      style={{fontSize: '1.2rem', padding: '5px 10px'}}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

export default ThemeToggle;

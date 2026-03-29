/**
 * App.jsx - Main Router for Version 2 with Theme Support
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quiz from "./pages/Quiz";
import AdminDashboard from "./pages/AdminDashboard";
import { apiService } from "./services/api";
import "./App.css";

// --- PRIVATE ROUTE WRAPPERS ---

const PrivateRoute = ({ children, role }) => {
  const isAuth = apiService.isAuthenticated();
  const userRole = apiService.getUserRole();

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    if (role === 'admin' && userRole !== 'admin') {
        return <Navigate to="/quiz" replace />;
    }
  }

  return children;
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/register" element={<Register theme={theme} toggleTheme={toggleTheme} />} />
        
        {/* PLAYER & ADMIN CAN PLAY */}
        <Route 
          path="/quiz" 
          element={
            <PrivateRoute>
              <Quiz theme={theme} toggleTheme={toggleTheme} />
            </PrivateRoute>
          } 
        />

        {/* ADMIN ONLY */}
        <Route 
          path="/admin" 
          element={
            <PrivateRoute role="admin">
              <AdminDashboard theme={theme} toggleTheme={toggleTheme} />
            </PrivateRoute>
          } 
        />

        {/* DEFAULT NAVIGATION */}
        <Route 
          path="/" 
          element={
            apiService.isAuthenticated() 
              ? (apiService.getUserRole() === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/quiz" />)
              : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;

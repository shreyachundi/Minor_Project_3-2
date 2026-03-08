import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log('📤 Sending login request with:', { 
        email, 
        password: password ? '***' : 'missing' 
      });
      
      const response = await API.post('/auth/login', {
        email,
        password
      });
      
      console.log('📥 Login response:', response.data);
      
      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      const userRole = response.data.role;
      console.log('👤 User role from server:', userRole);
      
      if (userRole === 'guide') {
        navigate('/guide');
      } else {
        navigate('/student');
      }
      
    } catch (error) {
      console.error('❌ Login error details:');
      console.error('Error object:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-main-container">
      <div className="login-card">
        <h1 className="login-title">AcadSync</h1>
        <p className="login-subtitle">Track • Manage • Succeed</p>

        {error && <div className="error-message">{error}</div>}

        <div className="login-role-toggle">
          <button
            type="button"
            className={role === "student" ? "active" : ""}
            onClick={() => setRole("student")}
          >
            <FaUserGraduate /> Student
          </button>
          <button
            type="button"
            className={role === "guide" ? "active" : ""}
            onClick={() => setRole("guide")}
          >
            <FaChalkboardTeacher /> Guide
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Enter Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          
          <div className="login-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="login-eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button 
            type="submit" 
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : `LOGIN AS ${role.toUpperCase()}`}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../services/api";
import {
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import "./Login.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: request email, 2: verify OTP, 3: reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Request password reset OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Requesting password reset OTP for:', email);
      
      const response = await API.post('/auth/forgot-password', { email });
      
      console.log('📥 Response:', response.data);
      
      setSuccess('OTP sent to your email! Please check your inbox.');
      setStep(2);
      
      // Start countdown for OTP expiry (10 minutes)
      setCountdown(600);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Verifying OTP for:', email);
      
      const response = await API.post('/auth/verify-otp', { email, otp });
      
      console.log('📥 Response:', response.data);
      
      setSuccess('OTP verified successfully! Please set your new password.');
      setStep(3);
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Resetting password for:', email);
      
      const response = await API.post('/auth/reset-password', { 
        email, 
        otp,
        newPassword 
      });
      
      console.log('📥 Response:', response.data);
      
      setSuccess('Password reset successful! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await API.post('/auth/forgot-password', { email });
      
      setSuccess('New OTP sent to your email!');
      
      // Reset countdown
      setCountdown(600);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Format countdown as MM:SS
  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="login-main-container">
      <div className="login-card forgot-password-card">
        <button 
          className="back-to-login-btn"
          onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)}
        >
          <FaArrowLeft /> Back
        </button>

        <h1 className="login-title">AcadSync</h1>
        
        {step === 1 && <p className="login-subtitle">Reset Your Password</p>}
        {step === 2 && <p className="login-subtitle">Verify OTP</p>}
        {step === 3 && <p className="login-subtitle">Create New Password</p>}

        {error && (
          <div className="error-message">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <FaCheckCircle /> {success}
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP}>
            <div className="input-with-icon">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <p className="info-text">
              We'll send a 6-digit OTP to your email address to verify your identity.
            </p>

            <button 
              type="submit" 
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'SEND OTP'}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP}>
            <div className="otp-input-container">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                pattern="\d*"
                className="otp-input"
                required
                autoFocus
              />
            </div>

            <p className="info-text">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            {countdown > 0 && (
              <p className="countdown-text">
                OTP expires in: <span className="countdown-timer">{formatCountdown()}</span>
              </p>
            )}

            <div className="resend-otp">
              <span>Didn't receive code? </span>
              <button 
                type="button"
                onClick={handleResendOTP}
                disabled={loading || countdown > 550} // Disable for first 50 seconds
                className="resend-btn"
              >
                Resend OTP
              </button>
            </div>

            <button 
              type="submit" 
              className="login-submit-btn"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'VERIFY OTP'}
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="input-with-icon password-field">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
              />
              <span
                className="login-eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="input-with-icon password-field">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
              />
            </div>

            <button 
              type="submit" 
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'RESET PASSWORD'}
            </button>
          </form>
        )}

        <p className="login-footer">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
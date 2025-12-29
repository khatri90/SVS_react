import React, { useState, useEffect } from 'react';
import './RegisterPage.css';

const RegisterPage = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Generate animated background particles
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        velocity: Math.random() * 0.5 + 0.1
      });
    }
    setParticles(newParticles);
    
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: (particle.y + particle.velocity) % 100,
        x: (particle.x + particle.velocity / 2) % 100
      })));
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Pulse animation for the logo
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // TODO: Replace with actual API call
      console.log('Registration data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      setSuccess(true);
      
      // Show success message and then switch to login
      setTimeout(() => {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
      }, 2000);
      
    } catch (error) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Animated particles in background */}
      {particles.map(particle => (
        <div 
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
        />
      ))}
      
      {/* Grid lines */}
      <div className="background-grid"></div>
      
      <div className="register-card">
        {/* Logo with pulse effect */}
        <div className={`logo-container`}>
          <div className={`logo-wrapper logo-pulse ${pulse ? 'active' : ''}`}>
            {/* Logo shield shape */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5L85 20V50C85 70 70 85 50 95C30 85 15 70 15 50V20L50 5Z" fill="black" stroke="#0dd3c5" strokeWidth="4"/>
                <circle cx="50" cy="50" r="25" fill="#0dd3c5" />
                <circle cx="50" cy="50" r="20" fill="white" />
                <path d="M40 50C42 48 45 45 50 45C55 45 58 50 60 55" stroke="black" strokeWidth="2"/>
              </svg>
            </div>
            
            {/* Animated ring */}
            <div className={`logo-ring ${pulse ? 'active' : ''}`}></div>
          </div>
        </div>
        
        <h1 className="register-title">CREATE ACCOUNT</h1>
        <p className="register-subtitle">Join the Signature Verification System</p>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <div className="input-group">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                placeholder="Enter first name"
              />
              <div className="input-underline"></div>
            </div>
            {validationErrors.firstName && (
              <span className="validation-error">{validationErrors.firstName}</span>
            )}
          </div>
          
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <div className="input-group">
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                placeholder="Enter last name"
              />
              <div className="input-underline"></div>
            </div>
            {validationErrors.lastName && (
              <span className="validation-error">{validationErrors.lastName}</span>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Username</label>
          <div className="input-group">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.username ? 'error' : ''}`}
              placeholder="Choose a username"
            />
            <div className="input-underline"></div>
          </div>
          {validationErrors.username && (
            <span className="validation-error">{validationErrors.username}</span>
          )}
        </div>
        
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="Enter email address"
            />
            <div className="input-underline"></div>
          </div>
          {validationErrors.email && (
            <span className="validation-error">{validationErrors.email}</span>
          )}
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
              placeholder="Create a password"
            />
            <div className="input-underline"></div>
          </div>
          {validationErrors.password && (
            <span className="validation-error">{validationErrors.password}</span>
          )}
        </div>
        
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
            />
            <div className="input-underline"></div>
          </div>
          {validationErrors.confirmPassword && (
            <span className="validation-error">{validationErrors.confirmPassword}</span>
          )}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="register-button"
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-spinner"></div>
              Creating Account...
            </span>
          ) : 'CREATE ACCOUNT'}
        </button>
        
        {/* Error and success messages */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            Account created successfully! Redirecting to login...
          </div>
        )}
        
        {/* Switch to login */}
        <div className="switch-form">
          <span>Already have an account? </span>
          <button onClick={onSwitchToLogin} className="switch-button">
            Sign In
          </button>
        </div>
        
        {/* Security feature indicators */}
        <div className="security-features">
          <div className="security-feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>Encrypted</span>
          </div>
          
          <div className="security-feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span>Secure</span>
          </div>
          
          <div className="security-feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span>Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import { authAPI } from './api';

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
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
  
  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Call the login API
      const result = await authAPI.login(username, password);
      
      if (result.success) {
        setSuccess(true);
        console.log('Login successful!');
        
        // Fetch user info after successful login
        const userInfo = await authAPI.getCurrentUser();
        
        // Transition to dashboard after showing success message briefly
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(userInfo);
          }
        }, 1000);
      } else {
        setError(result.error || 'Invalid username or password');
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
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
      
      <div className="login-card">
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
        
        <h1 className="login-title">SIGNATURE VERIFICATION SYSTEM</h1>
        
        <div className="form-group">
          <label className="form-label">Username</label>
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
            />
            <div className="input-underline"></div>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
            <div className="input-underline"></div>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="login-button"
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-spinner"></div>
              Verifying...
            </span>
          ) : 'LOGIN'}
        </button>
        
        {/* Error and success messages */}
        {error && (
          <div style={{ color: '#ff4d4d', textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ color: '#0dd3c5', textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            Login successful!
          </div>
        )}
        
        {/* Security feature indicators */}
        <div className="security-features">
          <div className="security-feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span>Secure</span>
          </div>
          
          <div className="security-feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span>Protected</span>
          </div>
          
          <div className="security-feature">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <span>Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
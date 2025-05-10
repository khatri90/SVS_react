import React, { useState, useEffect } from 'react'
import LoginPage from './LoginPage'
import Dashboard from './Dashboard'
import { authAPI, getToken } from './api'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check for auth token on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getToken();
      if (token) {
        try {
          // Verify token by getting current user
          const userData = await authAPI.getCurrentUser();
          if (!userData.error) {
            setUser(userData);
            setIsLoggedIn(true);
          } else {
            // Invalid token, clear it
            authAPI.logout();
          }
        } catch (error) {
          console.error('Auth check error:', error);
          authAPI.logout();
        }
      }
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);
  
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  }
  
  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    setIsLoggedIn(false);
  }
  
  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#000'
      }}>
        <div style={{ color: '#0dd3c5' }}>Loading...</div>
      </div>
    );
  }
  
  return (
    <>
      {isLoggedIn ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  )
}

export default App
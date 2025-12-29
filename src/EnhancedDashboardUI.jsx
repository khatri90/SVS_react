import React, { useState, useEffect } from 'react';

const EnhancedDashboardUI = () => {
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [particles, setParticles] = useState([]);
  const [statCards, setStatCards] = useState([
    { id: 1, title: 'Verified Signatures', count: 0, target: 87, color: '#0dd3c5' },
    { id: 2, title: 'Detected Forgeries', count: 0, target: 23, color: '#ff4d4d' },
    { id: 3, title: 'User Profiles', count: 0, target: 42, color: '#743ad5' },
    { id: 4, title: 'Accuracy Rate', count: 0, target: 97, color: '#f59e0b', suffix: '%' }
  ]);
  
  // Generate animated background particles
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        velocity: Math.random() * 0.3 + 0.1
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
  
  // Animate counter stats
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const interval = 20; // update every 20ms
    const steps = duration / interval;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      
      if (currentStep > steps) {
        clearInterval(timer);
        return;
      }
      
      setStatCards(cards =>
        cards.map(card => ({
          ...card,
          count: Math.round((card.target / steps) * currentStep)
        }))
      );
    }, interval);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="enhanced-dashboard">
      <div className="dashboard-container" style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: '#000',
        overflow: 'hidden',
        position: 'relative',
        color: 'white'
      }}>
        {/* Animated particles in background */}
        {particles.map(particle => (
          <div 
            key={particle.id}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              backgroundColor: '#0dd3c5',
              opacity: 0.2,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              zIndex: 0
            }}
          />
        ))}
        
        {/* Grid background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.1,
          backgroundImage: 'linear-gradient(to right, #0dd3c5 1px, transparent 1px), linear-gradient(to bottom, #0dd3c5 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          zIndex: 0
        }} />
        
        {/* Sidebar */}
        <div style={{
          width: '250px',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          height: '100%',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(13, 211, 197, 0.3)',
          zIndex: 10,
          boxShadow: '5px 0 15px rgba(0, 0, 0, 0.2)'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px 20px',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              marginRight: '10px',
              position: 'relative'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5L85 20V50C85 70 70 85 50 95C30 85 15 70 15 50V20L50 5Z" fill="black" stroke="#0dd3c5" strokeWidth="4"/>
                <circle cx="50" cy="50" r="25" fill="#0dd3c5" />
                <circle cx="50" cy="50" r="20" fill="white" />
                <path d="M40 50C42 48 45 45 50 45C55 45 58 50 60 55" stroke="black" strokeWidth="2"/>
              </svg>
              
              {/* Pulsing effect */}
              <div style={{
                position: 'absolute',
                inset: -5,
                borderRadius: '50%',
                border: '2px solid #0dd3c5',
                opacity: 0.6,
                animation: 'pulse 2s infinite'
              }} />
            </div>
            <h3 style={{ color: '#0dd3c5', fontSize: '1.5rem', fontWeight: 'bold' }}>SVS</h3>
          </div>
          
          {/* Navigation menu */}
          <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            {['Verify', 'Users', 'History', 'Analytics', 'Settings'].map((item, index) => (
              <button 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  color: '#e5e7eb',
                  background: hoveredMenu === index ? 'rgba(13, 211, 197, 0.1)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  borderLeft: index === 0 ? '3px solid #0dd3c5' : '3px solid transparent',
                  transform: hoveredMenu === index ? 'translateX(3px)' : 'translateX(0)'
                }}
                onMouseEnter={() => setHoveredMenu(index)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  marginRight: '12px', 
                  color: '#0dd3c5',
                  transition: 'transform 0.2s',
                  transform: hoveredMenu === index ? 'scale(1.2)' : 'scale(1)'
                }}>
                  {/* Simple icon placeholder */}
                  {index === 0 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {index === 1 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {index === 2 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {index === 3 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )}
                  {index === 4 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                <span>{item}</span>
              </button>
            ))}
            
            {/* Logout button */}
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                color: '#e5e7eb',
                background: hoveredMenu === 'logout' ? 'rgba(255, 77, 77, 0.1)' : 'transparent',
                border: 'none',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem',
                marginTop: 'auto',
                transition: 'background 0.2s'
              }}
              onMouseEnter={() => setHoveredMenu('logout')}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <div style={{ width: '20px', height: '20px', marginRight: '12px', color: '#ff4d4d' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span>Logout</span>
            </button>
          </nav>
        </div>
        
        {/* Main content */}
        <div style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 5,
          boxShadow: 'inset 5px 0 15px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 30px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}>
            <h1 style={{ fontSize: '1.5rem', color: '#0dd3c5' }}>Signature Verification System</h1>
            
            {/* User profile */}
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{ 
                backgroundColor: 'rgba(13, 211, 197, 0.1)', 
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                color: '#0dd3c5',
                display: 'flex',
                alignItems: 'center',
                marginRight: '15px'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: '#0dd3c5', 
                  borderRadius: '50%', 
                  marginRight: '6px' 
                }} />
                <span>System Online</span>
              </div>
              
              <span style={{ marginRight: '10px', color: '#e5e7eb' }}>Admin User</span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#0dd3c5',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: '0 0 10px rgba(13, 211, 197, 0.5)',
                transition: 'transform 0.2s',
              }}>A</div>
            </div>
          </div>
          
          {/* Page content */}
          <div style={{
            padding: '20px 30px',
            flexGrow: 1,
            overflowY: 'auto'
          }}>
            {/* Dashboard header with analytics */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white' }}>Dashboard</h2>
              
              <div style={{
                position: 'relative',
                width: '300px'
              }}>
                <input 
                  type="text" 
                  placeholder="Search signatures, users..." 
                  style={{
                    width: '100%',
                    padding: '10px 16px 10px 40px',
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    border: '1px solid #374151',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                />
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="#9ca3af"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px'
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Stats cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {statCards.map(card => (
                <div key={card.id} style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.6)',
                  borderRadius: '8px',
                  padding: '20px',
                  border: `1px solid ${card.color}20`,
                  boxShadow: `0 4px 15px ${card.color}10`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 8px 20px ${card.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 15px ${card.color}10`;
                }}
                >
                  {/* Background decoration */}
                  <div style={{
                    position: 'absolute',
                    right: '-20px',
                    bottom: '-20px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: card.color,
                    opacity: 0.05
                  }} />
                  
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '5px' }}>
                    {card.title}
                  </div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: card.color,
                  }}>
                    {card.count}{card.suffix || ''}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Recent activity & verification panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {/* Recent activity */}
              <div style={{
                backgroundColor: 'rgba(31, 41, 55, 0.6)',
                borderRadius: '8px',
                overflow: 'hidden',
                height: '300px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '15px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h3 style={{ color: '#0dd3c5', fontSize: '1rem' }}>Recent Verifications</h3>
                </div>
                
                <div style={{ overflow: 'auto', padding: '10px' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      backgroundColor: i % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                      borderRadius: '4px',
                      marginBottom: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: i % 3 === 0 ? '#ff4d4d' : '#0dd3c5',
                          marginRight: '10px'
                        }} />
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'white' }}>
                            {['John Smith', 'Maria Garcia', 'Alex Wong', 'Sarah Johnson', 'David Miller'][i]}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            {i % 3 === 0 ? 'Forgery detected' : 'Verified genuine'}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {['10 min ago', '1 hour ago', '3 hours ago', 'Yesterday', '2 days ago'][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quick verification panel */}
              <div style={{
                backgroundColor: 'rgba(31, 41, 55, 0.6)',
                borderRadius: '8px',
                overflow: 'hidden',
                height: '300px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '15px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h3 style={{ color: '#0dd3c5', fontSize: '1rem' }}>Quick Verification</h3>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(13, 211, 197, 0.05)'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(13, 211, 197, 0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#0dd3c5" style={{ width: '40px', height: '40px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <p style={{ color: '#9ca3af', marginBottom: '20px', textAlign: 'center' }}>
                    Drag & drop a signature image here or click to browse
                  </p>
                  
                  <button style={{
                    backgroundColor: '#0dd3c5',
                    color: '#000',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px', marginRight: '8px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Verify Signature
                  </button>
                </div>
              </div>
            </div>
            
            {/* Usage analytics section */}
            <div style={{
              backgroundColor: 'rgba(31, 41, 55, 0.6)',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '30px'
            }}>
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '15px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{ color: '#0dd3c5', fontSize: '1rem' }}>Verification Analytics</h3>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{
                  height: '180px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  position: 'relative'
                }}>
                  {/* Y-axis gridlines */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: `${i * 25}%`,
                      height: '1px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      zIndex: 1
                    }} />
                  ))}
                  
                  {/* Y-axis labels */}
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: '-5px',
                      bottom: `${i * 25}%`,
                      transform: 'translateY(50%)',
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      zIndex: 2
                    }}>
                      {(4-i) * 25}%
                    </div>
                  ))}
                  
                  {/* Chart bars */}
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={i} style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: `${100 / 7}%`,
                      zIndex: 5
                    }}>
                      <div style={{ 
                        width: '100%',
                        display: 'flex',
                        height: '100%',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingLeft: '20px',
                        paddingRight: '20px'
                      }}>
                        <div style={{
                          width: '100%',
                          height: `${[75, 45, 90, 60, 80, 30, 65][i]}%`,
                          backgroundColor: '#0dd3c5',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          transition: 'height 1s ease',
                          maxWidth: '30px'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            borderRadius: '2px'
                          }} />
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#9ca3af',
                        marginTop: '8px'
                      }}>
                        {day}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '20px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#0dd3c5',
                      borderRadius: '2px',
                      marginRight: '8px'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Genuine Signatures</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#ff4d4d',
                      borderRadius: '2px',
                      marginRight: '8px'
                    }} />
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Detected Forgeries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedDashboardUI;
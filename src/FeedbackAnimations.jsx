import React, { useState, useEffect } from 'react';

export const FeedbackAnimation = ({ type = 'success', message = '', onClose }) => {
  const [visible, setVisible] = useState(true);
  const [stage, setStage] = useState(0);
  
  useEffect(() => {
    // Start animation sequence
    const timer1 = setTimeout(() => setStage(1), 100);
    const timer2 = setTimeout(() => setStage(2), 800);
    
    // Auto-hide after delay if onClose is provided
    let closeTimer;
    if (onClose) {
      closeTimer = setTimeout(() => {
        setStage(3);
        setTimeout(() => {
          setVisible(false);
          onClose();
        }, 300);
      }, 3000);
    }
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [onClose]);
  
  // Handle manual close
  const handleClose = () => {
    setStage(3);
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 300);
  };
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      maxWidth: '400px',
      backgroundColor: type === 'success' ? 'rgba(13, 211, 197, 0.1)' : 'rgba(255, 77, 77, 0.1)',
      borderLeft: `4px solid ${type === 'success' ? '#0dd3c5' : '#ff4d4d'}`,
      borderRadius: '4px',
      padding: '15px',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
      transform: `translateX(${stage === 0 ? '120%' : stage === 3 ? '120%' : '0'})`,
      opacity: stage === 0 || stage === 3 ? 0 : 1,
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Icon */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: type === 'success' ? 'rgba(13, 211, 197, 0.2)' : 'rgba(255, 77, 77, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '15px',
        flexShrink: 0
      }}>
        {type === 'success' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#0dd3c5" style={{ width: '24px', height: '24px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ff4d4d" style={{ width: '24px', height: '24px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      
      {/* Content */}
      <div style={{ flexGrow: 1 }}>
        <h4 style={{ 
          margin: 0, 
          color: type === 'success' ? '#0dd3c5' : '#ff4d4d',
          fontSize: '1rem',
          fontWeight: 'bold'
        }}>
          {type === 'success' ? 'Success' : 'Error'}
        </h4>
        <p style={{ margin: '5px 0 0 0', color: '#e5e7eb', fontSize: '0.9rem' }}>
          {message || (type === 'success' ? 'Operation completed successfully!' : 'An error occurred. Please try again.')}
        </p>
      </div>
      
      {/* Close button */}
      <button 
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          cursor: 'pointer',
          padding: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: '10px',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Verification Success Animation
export const VerificationSuccessAnimation = ({ result, onClose }) => {
  const [animationStage, setAnimationStage] = useState(0);
  const isGenuine = result?.result === 'genuine';
  
  useEffect(() => {
    const stages = [
      setTimeout(() => setAnimationStage(1), 100),  // Start animation
      setTimeout(() => setAnimationStage(2), 1000), // Expand circle
      setTimeout(() => setAnimationStage(3), 1500), // Show icon
      setTimeout(() => setAnimationStage(4), 2000), // Show result text
      setTimeout(() => setAnimationStage(5), 2500)  // Show confidence
    ];
    
    return () => stages.forEach(t => clearTimeout(t));
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      backdropFilter: 'blur(5px)',
      opacity: animationStage >= 1 ? 1 : 0,
      transition: 'opacity 0.5s ease'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          position: 'relative',
          width: '300px',
          height: '300px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background circle */}
        <div style={{
          position: 'absolute',
          width: animationStage >= 2 ? '300px' : '0',
          height: animationStage >= 2 ? '300px' : '0',
          borderRadius: '50%',
          backgroundColor: isGenuine ? 'rgba(13, 211, 197, 0.1)' : 'rgba(255, 77, 77, 0.1)',
          transition: 'all 0.5s ease',
          zIndex: 1
        }} />
        
        {/* Inner circle */}
        <div style={{
          position: 'absolute',
          width: animationStage >= 2 ? '200px' : '0',
          height: animationStage >= 2 ? '200px' : '0',
          borderRadius: '50%',
          backgroundColor: isGenuine ? 'rgba(13, 211, 197, 0.2)' : 'rgba(255, 77, 77, 0.2)',
          transition: 'all 0.5s ease 0.2s',
          zIndex: 2
        }} />
        
        {/* Result icon */}
        <div style={{
          position: 'relative',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          backgroundColor: isGenuine ? '#0dd3c5' : '#ff4d4d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: animationStage >= 3 ? 1 : 0,
          transform: `scale(${animationStage >= 3 ? 1 : 0})`,
          transition: 'all 0.3s ease',
          zIndex: 3
        }}>
          {isGenuine ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" style={{ width: '50px', height: '50px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" style={{ width: '50px', height: '50px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        
        {/* Result text */}
        <h2 style={{
          color: isGenuine ? '#0dd3c5' : '#ff4d4d',
          fontSize: '2rem',
          fontWeight: 'bold',
          marginTop: '20px',
          opacity: animationStage >= 4 ? 1 : 0,
          transform: `translateY(${animationStage >= 4 ? 0 : '20px'})`,
          transition: 'all 0.3s ease',
          zIndex: 3,
          textAlign: 'center'
        }}>
          {isGenuine ? 'GENUINE' : 'FORGERY DETECTED'}
        </h2>
        
        {/* Confidence */}
        <p style={{
          color: '#e5e7eb',
          fontSize: '1.2rem',
          marginTop: '5px',
          opacity: animationStage >= 5 ? 1 : 0,
          transform: `translateY(${animationStage >= 5 ? 0 : '20px'})`,
          transition: 'all 0.3s ease',
          zIndex: 3
        }}>
          Confidence: {result ? (result.confidence * 100).toFixed(1) : 0}%
        </p>
        
        {/* View details button */}
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(13, 211, 197, 0.2)',
            color: '#ffffff',
            border: '1px solid rgba(13, 211, 197, 0.5)',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px',
            opacity: animationStage >= 5 ? 1 : 0,
            transform: `translateY(${animationStage >= 5 ? 0 : '20px'})`,
            transition: 'all 0.3s ease',
            zIndex: 4
          }}
        >
          View Detailed Results
        </button>
        
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            opacity: animationStage >= 5 ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 4
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
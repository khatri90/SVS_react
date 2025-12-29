import React, { useEffect, useState } from 'react';

const SignatureLoadingAnimation = ({ onComplete, isCompleted = false }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [signaturePoints, setSignaturePoints] = useState([]);
  const [shouldComplete, setShouldComplete] = useState(false);
  
  // Generate a simulated signature path
  useEffect(() => {
    // Create a random signature-like path
    const generateSignaturePath = () => {
      const points = [];
      let x = 10;
      let y = 50;
      
      // Generate random points for a signature-like path
      for (let i = 0; i < 80; i++) {
        x += Math.random() * 5 - 0.5 + Math.sin(i/5) * 8;
        y += Math.random() * 4 - 2 + Math.cos(i/3) * 4;
        points.push({ x, y });
      }
      
      return points;
    };
    
    setSignaturePoints(generateSignaturePath());
  }, []);
  
  // External completion trigger
  useEffect(() => {
    if (isCompleted && progress < 100) {
      setShouldComplete(true);
    }
  }, [isCompleted, progress]);
  
  // Progress animation
  useEffect(() => {
    // Force initial step to be visible
    if (progress === 0) {
      setStep(1);
    }
    
    const interval = setInterval(() => {
      setProgress(prev => {
        // If we should complete immediately, jump to 100%
        if (shouldComplete) {
          clearInterval(interval);
          
          // Set all steps before returning 100
          setStep(4);
          
          // Trigger completion callback after slight delay
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 1000);
          
          return 100;
        }
        
        // Normal incremental progress
        const newValue = prev + 1;
        if (newValue >= 100) {
          clearInterval(interval);
          
          // Trigger completion callback after slight delay
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 1000);
          
          return 100;
        }
        
        // Change verification step based on progress
        if (newValue >= 25 && newValue < 50 && step < 2) {
          setStep(2);
        } else if (newValue >= 50 && newValue < 75 && step < 3) {
          setStep(3);
        } else if (newValue >= 75 && step < 4) {
          setStep(4);
        }
        
        return newValue;
      });
    }, 50); // Make this faster (was 80ms)
    
    return () => clearInterval(interval);
  }, [onComplete, shouldComplete, step]);
  
  // Draw signature SVG path from points
  const getSignaturePath = () => {
    const visiblePoints = signaturePoints.slice(0, Math.floor((signaturePoints.length * progress) / 100));
    
    if (visiblePoints.length < 2) return '';
    
    let path = `M ${visiblePoints[0].x} ${visiblePoints[0].y}`;
    
    for (let i = 1; i < visiblePoints.length; i++) {
      path += ` L ${visiblePoints[i].x} ${visiblePoints[i].y}`;
    }
    
    return path;
  };
  
  return (
    <div className="loading-animation-container" style={{
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderRadius: '8px',
      padding: '24px',
      width: '100%',
      maxWidth: '600px',
      margin: '20px auto',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(13, 211, 197, 0.3)',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#0dd3c5', marginBottom: '16px' }}>
        Verifying Signature...
      </h3>
      
      {/* Signature animation */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        height: '150px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <svg width="350" height="100" viewBox="0 0 350 100">
          {/* Drawing pad lines */}
          <line x1="0" y1="70" x2="350" y2="70" stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="0" y1="30" x2="350" y2="30" stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
          
          {/* Animated signature path */}
          <path
            d={getSignaturePath()}
            fill="none"
            stroke="#0dd3c5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        
        {progress === 100 && (
          <div style={{
            position: 'absolute',
            right: '20px',
            bottom: '20px',
            color: '#0dd3c5',
            fontSize: '36px',
            fontWeight: 'bold',
            opacity: 0.8,
            animation: 'fadeIn 0.5s ease-in-out'
          }}>✓</div>
        )}
      </div>
      
      {/* Progress bar */}
      <div style={{
        width: '100%',
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        borderRadius: '4px',
        height: '8px',
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: `${progress}%`,
          backgroundColor: '#0dd3c5',
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      {/* Process steps */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        margin: '20px 0'
      }}>
        <div style={{
          padding: '10px',
          backgroundColor: step >= 1 ? 'rgba(13, 211, 197, 0.2)' : 'rgba(31, 41, 55, 0.4)',
          borderRadius: '4px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '0.75rem', color: step >= 1 ? '#0dd3c5' : '#9ca3af' }}>STEP 1</div>
          <div style={{ fontSize: '0.875rem', color: 'white' }}>Preprocessing</div>
        </div>
        
        <div style={{
          padding: '10px',
          backgroundColor: step >= 2 ? 'rgba(13, 211, 197, 0.2)' : 'rgba(31, 41, 55, 0.4)',
          borderRadius: '4px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '0.75rem', color: step >= 2 ? '#0dd3c5' : '#9ca3af' }}>STEP 2</div>
          <div style={{ fontSize: '0.875rem', color: 'white' }}>CNN Analysis</div>
        </div>
        
        <div style={{
          padding: '10px',
          backgroundColor: step >= 3 ? 'rgba(13, 211, 197, 0.2)' : 'rgba(31, 41, 55, 0.4)',
          borderRadius: '4px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '0.75rem', color: step >= 3 ? '#0dd3c5' : '#9ca3af' }}>STEP 3</div>
          <div style={{ fontSize: '0.875rem', color: 'white' }}>Feature Analysis</div>
        </div>
        
        <div style={{
          padding: '10px',
          backgroundColor: step >= 4 ? 'rgba(13, 211, 197, 0.2)' : 'rgba(31, 41, 55, 0.4)',
          borderRadius: '4px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ fontSize: '0.75rem', color: step >= 4 ? '#0dd3c5' : '#9ca3af' }}>STEP 4</div>
          <div style={{ fontSize: '0.875rem', color: 'white' }}>Final Verification</div>
        </div>
      </div>
      
      {/* AI insights animation */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '0.875rem',
        color: '#9ca3af',
        textAlign: 'left',
        fontFamily: 'monospace',
        height: '80px',
        overflow: 'hidden'
      }}>
        <div>
          {step >= 1 && (
            <div 
              style={{ 
                animation: 'typewriter 1s', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#9ca3af' }}>&gt;</span> Preprocessing signature image...
            </div>
          )}
          {step >= 2 && (
            <div 
              style={{ 
                animation: 'typewriter 1s', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#9ca3af' }}>&gt;</span> Running CNN deep learning models...
            </div>
          )}
          {step >= 3 && (
            <div 
              style={{ 
                animation: 'typewriter 1s', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#9ca3af' }}>&gt;</span> Analyzing multi-feature similarities...
            </div>
          )}
          {step >= 4 && (
            <div 
              style={{ 
                animation: 'typewriter 1s', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#9ca3af' }}>&gt;</span> Computing weighted verification result...
            </div>
          )}
          {progress === 100 && (
            <div 
              style={{ 
                color: '#0dd3c5', 
                animation: 'typewriter 1s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#0dd3c5' }}>&gt;</span> Verification complete!
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes typewriter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default SignatureLoadingAnimation;
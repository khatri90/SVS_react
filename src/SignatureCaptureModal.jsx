import React from 'react';
import SignatureCapture from './SignatureCapture';

const SignatureCaptureModal = ({ onImageCaptured, onCancel, type }) => {
  const handleCapturedImage = (file) => {
    if (onImageCaptured) {
      onImageCaptured(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(4px)'
    }}>
      <div 
        className="modal-content signature-capture-modal" 
        onClick={e => e.stopPropagation()}
        style={{ 
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          height: 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #0dd3c5',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ color: '#0dd3c5', fontSize: '1.25rem', margin: 0 }}>Capture Signature from Camera</h3>
          <button 
            className="close-button" 
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              style={{ width: '20px', height: '20px' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="modal-body" style={{ 
          overflow: 'auto', 
          flex: '1 1 auto', 
          padding: '16px 24px',
          maxHeight: 'calc(90vh - 70px)'  // 70px accounts for header height
        }}>
          <div style={{ marginBottom: '15px' }}>
            <p style={{ color: '#0dd3c5', fontWeight: 'bold', marginBottom: '5px' }}>Instructions:</p>
            <ol style={{ paddingLeft: '20px', color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
              <li>Position your signature document clearly in front of the camera</li>
              <li>Click 'Capture' when your signature is well-positioned</li>
              <li>Crop the signature area by drawing a rectangle around it</li>
              <li>Click 'Crop & Use' or 'Use Without Cropping' to proceed</li>
            </ol>
          </div>
          
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(13, 211, 197, 0.1)', borderRadius: '4px' }}>
            <p style={{ color: '#0dd3c5', fontWeight: 'bold', margin: '0 0 5px 0' }}>Camera Access:</p>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
              You may need to grant permission to access your camera when prompted. 
              If you don't see your camera, try refreshing the page or check your camera connections.
            </p>
          </div>
          
          <div>
            <SignatureCapture 
              onSignatureCaptured={handleCapturedImage} 
              type={type}
              onCancel={onCancel}
            />
          </div>
        </div>
        
        {/* Fixed action buttons at bottom */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          gap: '10px'
        }}>
          <button 
            onClick={onCancel}
            style={{
              backgroundColor: 'transparent',
              color: '#9ca3af',
              border: '1px solid #4b5563',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCaptureModal;
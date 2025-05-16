import React from 'react';
import SignatureCapture from './SignatureCapture';

const SignatureCaptureModal = ({ onImageCaptured, onCancel, type }) => {
  const handleCapturedImage = (file) => {
    if (onImageCaptured) {
      onImageCaptured(file);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="modal-content signature-capture-modal" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: '900px', 
          maxHeight: '90vh',
          width: '90%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="modal-header">
          <h3>Capture Signature from Camera</h3>
          <button className="close-button" onClick={onCancel}>
            <svg xmlns="http://www.w3.org/2000/svg" className="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="modal-body" style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ marginBottom: '15px' }}>
            <p>Instructions:</p>
            <ol style={{ paddingLeft: '20px', color: '#9ca3af', fontSize: '0.9rem' }}>
              <li>Select your webcam from the dropdown menu</li>
              <li>Click 'Connect' to access the camera feed</li>
              <li>Click 'Capture' when your signature is well-positioned</li>
              <li>Crop the signature area by drawing a rectangle around it</li>
              <li>Click 'Crop & Process' to finalize</li>
            </ol>
          </div>
          
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(13, 211, 197, 0.1)', borderRadius: '4px' }}>
            <p style={{ color: '#0dd3c5', fontWeight: 'bold' }}>Webcam Setup:</p>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
              Make sure your webcam is connected and working properly. You may need to grant permission 
              to access your camera when prompted by the browser. If you don't see your webcam in the dropdown, 
              try refreshing the page or check your camera connections.
            </p>
          </div>
          
          <div style={{ minHeight: '400px' }}>
            <SignatureCapture 
              onSignatureCaptured={handleCapturedImage} 
              type={type}
              onCancel={onCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureCaptureModal;
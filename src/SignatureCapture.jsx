import React, { useState } from 'react';
import CameraCapture from './CameraCapture';

const SignatureCapture = ({ onSignatureCaptured, type = 'reference', onCancel }) => {
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageCaptured = (imageDataUrl) => {
    setProcessingStatus('Processing captured image...');
    setError('');
    setIsProcessing(true);
    
    try {
      // If the input is already a File object
      if (imageDataUrl instanceof File) {
        console.log('Image captured as File:', {
          name: imageDataUrl.name,
          type: imageDataUrl.type,
          size: imageDataUrl.size
        });
        
        setProcessingStatus('');
        setIsProcessing(false);
        
        // Call the parent component's handler with the file
        if (onSignatureCaptured) {
          onSignatureCaptured(imageDataUrl);
        }
        return;
      }
      
      // Convert the data URL to a Blob for API upload
      fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
          console.log('Image captured and converted to blob:', {
            size: blob.size,
            type: blob.type
          });
          
          // Create a File object from the Blob with proper type
          const filename = `${type}_signature_${Date.now()}.png`;
          
          // Make sure the mime type is set correctly for Django
          const file = new File(
            [blob], 
            filename, 
            { type: 'image/png' }
          );
          
          console.log('Created file from blob:', {
            name: file.name,
            type: file.type,
            size: file.size
          });
          
          setProcessingStatus('');
          setIsProcessing(false);
          
          // Call the parent component's handler with the processed file
          if (onSignatureCaptured) {
            onSignatureCaptured(file);
          }
        })
        .catch(err => {
          console.error('Error processing captured image:', err);
          setError(`Error: ${err.message}`);
          setProcessingStatus('');
          setIsProcessing(false);
        });
    } catch (err) {
      console.error('Error in signature capture:', err);
      setError(`Error: ${err.message}`);
      setProcessingStatus('');
      setIsProcessing(false);
    }
  };

  return (
    <div className="signature-capture-container" style={{ width: '100%' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: 'rgba(13, 211, 197, 0.1)', 
        borderRadius: '4px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#0dd3c5" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p style={{ color: '#0dd3c5', marginBottom: '5px', fontWeight: 'bold' }}>Signature Capture</p>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
            Position your signature in the camera view and ensure it's well-lit before capturing.
          </p>
        </div>
      </div>
      
      <CameraCapture 
        onImageCaptured={handleImageCaptured}
        onCancel={onCancel}
      />
      
      {processingStatus && (
        <div className="processing-status" style={{ 
          padding: '10px', 
          backgroundColor: 'rgba(13, 211, 197, 0.1)', 
          color: '#0dd3c5',
          borderRadius: '4px',
          margin: '10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {isProcessing && (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {processingStatus}
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ 
          padding: '10px', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          color: '#ff4d4d',
          borderRadius: '4px',
          margin: '10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      <style jsx>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default SignatureCapture;
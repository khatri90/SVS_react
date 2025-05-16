import React, { useState } from 'react';
import CameraCapture from './CameraCapture';

const SignatureCapture = ({ onSignatureCaptured, type = 'reference', onCancel }) => {
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');

  const handleImageCaptured = (imageDataUrl) => {
    setProcessingStatus('Processing captured image...');
    setError('');
    
    try {
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
          
          // Call the parent component's handler with the processed file
          if (onSignatureCaptured) {
            onSignatureCaptured(file);
          }
        })
        .catch(err => {
          console.error('Error processing captured image:', err);
          setError(`Error: ${err.message}`);
          setProcessingStatus('');
        });
    } catch (err) {
      console.error('Error in signature capture:', err);
      setError(`Error: ${err.message}`);
      setProcessingStatus('');
    }
  };

  return (
    <div className="signature-capture-container" style={{ width: '100%' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: 'rgba(13, 211, 197, 0.1)', 
        borderRadius: '4px',
        marginBottom: '15px'
      }}>
        <p style={{ color: '#0dd3c5', marginBottom: '5px', fontWeight: 'bold' }}>Signature Capture</p>
        <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
          Use the camera to capture a clear image of the signature or upload an image file.
          The system will automatically process it for optimal verification.
        </p>
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
          margin: '10px 0'
        }}>
          {processingStatus}
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ 
          padding: '10px', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          color: '#ff4d4d',
          borderRadius: '4px',
          margin: '10px 0'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SignatureCapture;
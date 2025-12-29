import React, { useState, useRef, useEffect } from 'react';

const InteractiveSignatureUpload = ({ onFileSelected, onCaptureClick }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'uploading', 'success', 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file) => {
    // Validate file is an image
    if (!file.type.match('image.*')) {
      setUploadStatus('error');
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadStatus(null);
    
    // Call the parent callback with the file
    if (onFileSelected) {
      onFileSelected(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // Reset the upload form
  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadStatus(null);
    setUploadProgress(0);
  };

  return (
    <div style={{
      width: '100%',
      margin: '0 auto',
      padding: '10px 0'
    }}>
      <div style={{
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: 'white',
        border: isDragging ? '2px dashed #0dd3c5' : '2px dashed rgba(13, 211, 197, 0.3)'
      }}>
        <h3 style={{
          color: '#0dd3c5',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '1rem'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Signature Upload
        </h3>
        
        {!selectedFile ? (
          <div 
            style={{
              border: isDragging ? '2px dashed #0dd3c5' : '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '15px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: isDragging ? 'rgba(13, 211, 197, 0.1)' : 'rgba(31, 41, 55, 0.4)'
            }}
            onClick={triggerFileInput}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 15px',
              backgroundColor: 'rgba(13, 211, 197, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isDragging ? 'pulse 1.5s infinite' : 'none'
            }}>
              {isDragging ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#0dd3c5" style={{ width: '30px', height: '30px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#0dd3c5" style={{ width: '30px', height: '30px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                </svg>
              )}
            </div>
            
            <div style={{ color: '#9ca3af', marginBottom: '5px' }}>
              {isDragging ? 'Drop your signature image here' : 'Drag & drop signature image here'}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
              or <span style={{ color: '#0dd3c5', cursor: 'pointer' }}>browse files</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              position: 'relative',
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: 'rgba(31, 41, 55, 0.6)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <img 
                src={previewUrl} 
                alt="Signature Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '150px',
                  borderRadius: '4px',
                  transition: 'opacity 0.3s'
                }}
              />
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '10px' }}>
              <strong style={{ color: 'white' }}>{selectedFile.name}</strong>
              <div>{(selectedFile.size / 1024).toFixed(2)} KB</div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button 
                onClick={resetUpload}
                style={{
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #4b5563',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Change
              </button>
            </div>
          </div>
        )}
        
        {!selectedFile && (
          <div style={{ 
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ 
              width: '100%', 
              height: '1px', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)' 
            }} />
            <div style={{ 
              padding: '0 10px', 
              color: '#9ca3af', 
              fontSize: '0.875rem' 
            }}>OR</div>
            <div style={{ 
              width: '100%', 
              height: '1px', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)' 
            }} />
          </div>
        )}
        
        {!selectedFile && (
          <button
            onClick={onCaptureClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '8px',
              marginTop: '10px',
              backgroundColor: 'rgba(13, 211, 197, 0.1)',
              border: '1px solid rgba(13, 211, 197, 0.3)',
              borderRadius: '4px',
              color: '#0dd3c5',
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: '8px',
              fontSize: '0.9rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture from Camera
          </button>
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveSignatureUpload;
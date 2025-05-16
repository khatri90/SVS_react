import React, { useState, useEffect } from 'react';
import { verificationAPI } from './api';
import './Dashboard.css';

// New component for displaying verification results with image comparison
const VerificationResult = ({ result, onClose }) => {
  if (!result) return null;
  
  const confidence = result.confidence * 100; // Convert to percentage
  const isGenuine = result.result === 'genuine';
  
  return (
    <div className="verification-result" style={{ 
      padding: '20px', 
      backgroundColor: 'rgba(31, 41, 55, 0.6)', 
      borderRadius: '8px',
      marginTop: '20px' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#0dd3c5', marginBottom: '15px' }}>Verification Result</h3>
        {onClose && (
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#9ca3af', 
              cursor: 'pointer',
              fontSize: '1.25rem'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Display comparison image if available */}
      {result.comparison_image && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#9ca3af', marginBottom: '10px', fontSize: '0.9rem' }}>
            Image Processing Comparison:
          </p>
          <img 
            src={result.comparison_image} 
            alt="Signature comparison" 
            style={{
              maxWidth: '100%',
              border: '1px solid #374151',
              borderRadius: '4px',
              backgroundColor: '#1f2937'
            }}
          />
        </div>
      )}
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: isGenuine ? 'rgba(0, 128, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
        borderLeft: `4px solid ${isGenuine ? '#0dd3c5' : '#ff4d4d'}`,
        marginBottom: '15px',
        borderRadius: '4px'
      }}>
        <p style={{ fontSize: '1.25rem', color: isGenuine ? '#0dd3c5' : '#ff4d4d' }}>
          Result: <strong>{isGenuine ? 'GENUINE' : 'FORGED'}</strong>
        </p>
        <p>Confidence: {confidence.toFixed(2)}%</p>
        {result.added_to_references && (
          <p style={{ color: '#0dd3c5', marginTop: '5px' }}>✓ Added to reference signatures</p>
        )}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Similarity Metrics</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '10px' 
        }}>
          {result.details && result.details.metrics && (
            Object.entries(result.details.metrics).map(([key, value]) => (
              <div key={key} style={{ 
                backgroundColor: 'rgba(31, 41, 55, 0.4)', 
                padding: '10px', 
                borderRadius: '4px' 
              }}>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                  {key.replace('_similarity', '').toUpperCase()}
                </div>
                <div style={{ fontSize: '1.25rem', color: '#0dd3c5' }}>
                  {(value * 100).toFixed(2)}%
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Updated verification form component
const VerifySignatureForm = ({ profiles }) => {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [verificationFile, setVerificationFile] = useState(null);
  const [saveToReferences, setSaveToReferences] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const verificationFileRef = useRef(null);
  
  const handleVerificationFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVerificationFile(e.target.files[0]);
    }
  };
  
  const triggerVerificationFileInput = () => {
    if (verificationFileRef.current) {
      verificationFileRef.current.click();
    }
  };
  
  const captureFromCamera = () => {
    setCameraType('verification');
    setShowCameraModal(true);
  };
  
  const handleVerification = async () => {
    if (!selectedProfile) {
      setError('Please select a user profile');
      return;
    }
    
    if (!verificationFile) {
      setError('Please select a signature to verify');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setIsProcessing(true);
    
    try {
      const result = await verificationAPI.verify(
        selectedProfile,
        verificationFile,
        saveToReferences,
        verificationNotes
      );
      
      if (result.error) {
        setError(result.error || 'Verification failed');
        return;
      }
      
      setVerificationResult(result);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error during verification:', error);
      setError('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="data-table-container" style={{ padding: '20px' }}>
      <div className="form-group">
        <label className="form-label">Select User Profile</label>
        <select 
          className="form-input"
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
        >
          <option value="">-- Select a profile --</option>
          {profiles.map(profile => (
            <option key={profile.id} value={profile.id}>
              {profile.name} (ID: {profile.id_number})
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label">Upload Signature to Verify</label>
        <div className="file-upload-container">
          <input
            type="file"
            accept="image/*"
            onChange={handleVerificationFileChange}
            style={{ display: 'none' }}
            ref={verificationFileRef}
          />
          <button 
            type="button" 
            className="file-upload-button"
            onClick={triggerVerificationFileInput}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
            </svg>
            Select Signature Image
          </button>
          <button 
            type="button" 
            className="file-upload-button"
            onClick={captureFromCamera}
            style={{ marginLeft: '10px', backgroundColor: 'rgba(13, 211, 197, 0.2)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture from Camera
          </button>
          {verificationFile && (
            <div className="selected-files" style={{ marginTop: '10px' }}>
              <div className="file-item">
                <div className="file-info">
                  <svg xmlns="http://www.w3.org/2000/svg" className="file-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="file-name">{verificationFile.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input 
          type="checkbox" 
          id="saveToReferences" 
          checked={saveToReferences} 
          onChange={(e) => setSaveToReferences(e.target.checked)}
          style={{ width: 'auto' }}
        />
        <label htmlFor="saveToReferences" style={{ marginBottom: 0 }}>
          Add to reference signatures if verified as genuine
        </label>
      </div>
      
      <div className="form-group">
        <label className="form-label">Notes (Optional)</label>
        <textarea 
          className="form-input" 
          rows="3" 
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
          placeholder="Add any notes about this verification"
        ></textarea>
      </div>
      
      {/* Information about processing */}
      <div style={{ 
        marginBottom: '20px', 
        backgroundColor: 'rgba(13, 211, 197, 0.1)', 
        padding: '10px', 
        borderRadius: '4px',
        color: '#9ca3af',
        fontSize: '0.9rem'
      }}>
        <p style={{ color: '#0dd3c5', marginBottom: '5px' }}>Signature Processing:</p>
        <p>
          When you verify a signature, the system will preprocess it to optimize comparison with reference signatures.
          You'll see both the original and processed versions in the results.
        </p>
      </div>
      
      <button 
        className="save-button" 
        onClick={handleVerification}
        disabled={isSubmitting}
        style={{ marginTop: '10px' }}
      >
        {isSubmitting ? 'Processing...' : 'Verify Signature'}
      </button>
      
      {isProcessing && (
        <div style={{ 
          marginTop: '20px', 
          backgroundColor: 'rgba(13, 211, 197, 0.1)', 
          padding: '15px', 
          borderRadius: '4px',
          textAlign: 'center' 
        }}>
          <svg 
            className="animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            style={{ height: '24px', width: '24px', display: 'inline-block', marginRight: '10px', color: '#0dd3c5' }}
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span style={{ color: '#0dd3c5', fontSize: '1rem' }}>
            Processing signature...
          </span>
          <p style={{ marginTop: '10px', color: '#9ca3af', fontSize: '0.9rem' }}>
            The system is comparing the signature against references and generating comparison images.
          </p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: '20px', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          padding: '10px', 
          borderRadius: '4px',
          color: '#ff4d4d' 
        }}>
          {error}
        </div>
      )}
      
      {verificationResult && (
        <VerificationResult 
          result={verificationResult} 
          onClose={() => setVerificationResult(null)}
        />
      )}
    </div>
  );
};

export default VerifySignatureForm;
import React, { useState, useEffect, useRef } from 'react';
import { verificationAPI } from './api';
import './Dashboard.css';
import SignatureLoadingAnimation from './SignatureLoadingAnimation';
import InteractiveSignatureUpload from './InteractiveSignatureUpload';
import { VerificationSuccessAnimation } from './FeedbackAnimations';
import SignatureCaptureModal from './SignatureCaptureModal';

// Enhanced VerificationResult component with multi-feature analysis
const VerificationResultDisplay = ({ result, onClose }) => {
  if (!result) return null;
  
  const confidence = result.confidence * 100; // Convert to percentage
  const isGenuine = result.result === 'genuine';
  
  // Extract metrics from the result
  const metrics = result.metrics || {};
  
  // Extract voting information from details if available
  const details = result.details || {};
  const genuineCount = details.genuine_count || 0;
  const forgeryCount = details.forgery_count || 0;
  const totalReferences = details.total_references || 0;

  return (
    <div className="verification-result" style={{ 
      padding: '20px', 
      backgroundColor: 'rgba(31, 41, 55, 0.6)', 
      borderRadius: '8px',
      marginTop: '20px',
      position: 'relative'
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
              fontSize: '1.25rem',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
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
      
      {/* Combined final result */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: isGenuine ? 'rgba(0, 128, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
        borderLeft: `4px solid ${isGenuine ? '#0dd3c5' : '#ff4d4d'}`,
        marginBottom: '20px',
        borderRadius: '4px',
        animation: 'fadeIn 0.5s ease'
      }}>
        <p style={{ fontSize: '1.25rem', color: isGenuine ? '#0dd3c5' : '#ff4d4d', fontWeight: 'bold' }}>
          FINAL RESULT: {isGenuine ? 'GENUINE' : 'FORGED'}
        </p>
        <p style={{ color: '#e5e7eb', marginTop: '5px' }}>
          Combined Confidence: {confidence.toFixed(2)}%
        </p>
        {result.added_to_references && (
          <p style={{ color: '#0dd3c5', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Added to reference signatures
          </p>
        )}
        <p style={{ color: '#9ca3af', marginTop: '10px', fontSize: '0.9rem' }}>
          <strong>Multi-Feature Analysis:</strong> This result is based on weighted analysis of CNN, Siamese network, LSTM, geometric, structural, and texture features.
        </p>
      </div>

      {/* Multi-Feature Analysis Panel */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: 'rgba(13, 211, 197, 0.1)', 
        borderRadius: '8px',
        border: '1px solid rgba(13, 211, 197, 0.3)',
        marginBottom: '20px',
        animation: 'slideIn 0.5s ease'
      }}>
        <h4 style={{ color: '#0dd3c5', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Multi-Feature Verification Analysis
        </h4>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px',
          marginBottom: '15px'
        }}>
          {/* CNN Similarity */}
          {metrics.cnn_similarity !== undefined && (
            <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>CNN SIMILARITY</div>
              <div style={{ fontSize: '1.25rem', color: '#0dd3c5', fontWeight: 'bold' }}>
                {(metrics.cnn_similarity * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                Deep learning features
              </div>
            </div>
          )}
          
          {/* Siamese Similarity */}
          {metrics.siamese_similarity !== undefined && (
            <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>SIAMESE SIMILARITY</div>
              <div style={{ fontSize: '1.25rem', color: '#0dd3c5', fontWeight: 'bold' }}>
                {(metrics.siamese_similarity * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                Paired comparison network
              </div>
            </div>
          )}
          
          {/* LSTM Similarity */}
          {metrics.lstm_similarity !== undefined && (
            <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>LSTM SIMILARITY</div>
              <div style={{ fontSize: '1.25rem', color: '#0dd3c5', fontWeight: 'bold' }}>
                {(metrics.lstm_similarity * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                Temporal sequence analysis
              </div>
            </div>
          )}
          
          {/* Geometric Similarity */}
          {metrics.geometric_similarity !== undefined && (
            <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>GEOMETRIC SIMILARITY</div>
              <div style={{ fontSize: '1.25rem', color: '#0dd3c5', fontWeight: 'bold' }}>
                {(metrics.geometric_similarity * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                Shape and structure analysis
              </div>
            </div>
          )}
          
          {/* Texture Similarity */}
          {metrics.texture_similarity !== undefined && (
            <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>TEXTURE SIMILARITY</div>
              <div style={{ fontSize: '1.25rem', color: '#0dd3c5', fontWeight: 'bold' }}>
                {(metrics.texture_similarity * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                Surface pattern analysis
              </div>
            </div>
          )}
          
          {/* Structural Similarity */}
          {metrics.structural_similarity !== undefined && (
            <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>STRUCTURAL SIMILARITY</div>
              <div style={{ fontSize: '1.25rem', color: '#0dd3c5', fontWeight: 'bold' }}>
                {(metrics.structural_similarity * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px' }}>
                Skeleton and connectivity
              </div>
            </div>
          )}
        </div>
        
        {/* Feature Weights Information */}
        <div style={{ 
          padding: '10px', 
          backgroundColor: 'rgba(0, 0, 0, 0.2)', 
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: '#9ca3af'
        }}>
          <p style={{ marginBottom: '5px', fontWeight: 'bold', color: '#0dd3c5' }}>Feature Weights:</p>
          <p style={{ margin: 0 }}>
            CNN (50%) • Siamese (20%) • LSTM (10%) • Geometric (5%) • Texture (7.5%) • Structural (7.5%)
          </p>
        </div>
      </div>
      
      {/* Reference statistics */}
      {totalReferences > 0 && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          marginBottom: '15px',
          animation: 'fadeIn 0.5s ease 0.4s both'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '5px' }}>
            <strong>Reference Signature Analysis:</strong>
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            Compared against {totalReferences} reference signature{totalReferences !== 1 ? 's' : ''}.
            <br />
            Result is based on majority vote: {genuineCount} genuine vs {forgeryCount} forged.
          </p>
        </div>
      )}
      
      {/* Processing time if available */}
      {metrics.total_time && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
            Processing time: {metrics.total_time.toFixed(2)} seconds
          </span>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Simplified User Profile Selector (without signature management)
const SimpleUserProfileSelector = ({ profiles, selectedProfile, onProfileChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  
  const dropdownRef = useRef(null);
  
  // Update filtered profiles when search query or profiles change
  useEffect(() => {
    if (!profiles) return;
    
    if (!searchQuery) {
      setFilteredProfiles(profiles);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProfiles(
        profiles.filter(
          profile => 
            profile.name.toLowerCase().includes(query) || 
            profile.id_number.includes(query)
        )
      );
    }
  }, [searchQuery, profiles]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle profile selection
  const handleProfileSelect = (profileId) => {
    onProfileChange(profileId);
    setIsDropdownOpen(false);
  };
  
  // Format profile name for display
  const getProfileDisplayName = (profileId) => {
    if (!profileId || !profiles) return '-- Select a profile --';
    const profile = profiles.find(p => p.id.toString() === profileId.toString());
    return profile ? `${profile.name} (ID: ${profile.id_number})` : '-- Select a profile --';
  };
  
  return (
    <div className="dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <div 
        className="dropdown-header" 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: 'rgba(31, 41, 55, 0.6)',
          border: '1px solid #374151',
          borderRadius: '4px',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{getProfileDisplayName(selectedProfile)}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          style={{ 
            width: '16px', 
            height: '16px',
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isDropdownOpen && (
        <div 
          className="dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            border: '1px solid #374151',
            borderRadius: '0 0 4px 4px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 10,
            marginTop: '2px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="search-container" style={{ padding: '10px' }}>
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.9rem'
              }}
            />
          </div>
          
          <div className="dropdown-options">
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map(profile => (
                <div
                  key={profile.id}
                  className="dropdown-option"
                  onClick={() => handleProfileSelect(profile.id)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(13, 211, 197, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{profile.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>ID: {profile.id_number}</div>
                  </div>
                  <div 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: profile.signatureCount > 0 ? 'rgba(13, 211, 197, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                      color: profile.signatureCount > 0 ? '#0dd3c5' : '#ff4d4d',
                      fontSize: '0.75rem',
                      padding: '0 8px'
                    }}
                  >
                    {profile.signatureCount || 0}
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '15px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '0.9rem'
              }}>
                No profiles match your search
              </div>
            )}
          </div>
        </div>
      )}
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
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [showAnimatedResult, setShowAnimatedResult] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  
  const verificationFileRef = useRef(null);
  
  // Function to control the animation flow
  const handleAnimationComplete = () => {
    setAnimationCompleted(true);
    
    // If the verification is done, show the animation result
    if (verificationSuccess && verificationResult) {
      setIsProcessing(false);
      setShowAnimatedResult(true);
    }
  };
  
  // Reset animation state when animation view changes
  useEffect(() => {
    if (!isProcessing) {
      setAnimationCompleted(false);
    }
  }, [isProcessing]);
  
  const handleVerificationFileChange = (file) => {
    setVerificationFile(file);
    setError('');
  };
  
  const captureFromCamera = () => {
    setShowCameraModal(true);
  };
  
  const handleCapturedImage = (file) => {
    setShowCameraModal(false);
    setVerificationFile(file);
    setError('');
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
    setShowDetailedResults(false);
    setShowAnimatedResult(false);
    setAnimationCompleted(false);
    setVerificationSuccess(false);
    
    try {
      // API call to verify signature
      const result = await verificationAPI.verify(
        selectedProfile,
        verificationFile,
        saveToReferences,
        verificationNotes
      );
      
      if (result.error) {
        setError(result.error || 'Verification failed');
        setIsProcessing(false);
        setIsSubmitting(false);
        return;
      }
      
      console.log('Full verification result:', result);
      
      // Store the result - transform to match expected structure
      const transformedResult = {
        verification_id: result.verification_id,
        result: result.result,
        confidence: result.confidence,
        added_to_references: result.added_to_references,
        comparison_image: result.comparison_image,
        metrics: result.metrics || {},
        details: result.details || {}
      };
      
      setVerificationResult(transformedResult);
      setVerificationSuccess(true);
      
      // If animation is already completed, show the animated result
      if (animationCompleted) {
        setIsProcessing(false);
        setShowAnimatedResult(true);
      }
      
    } catch (error) {
      console.error('Error during verification:', error);
      setError('Verification failed. Please try again.');
      setIsProcessing(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="data-table-container" style={{ 
      padding: '20px',
      backgroundColor: 'rgba(31, 41, 55, 0.6)',
      borderRadius: '8px',
      marginBottom: '20px' 
    }}>
      <div className="form-group">
        <label className="form-label">Select User Profile</label>
        <SimpleUserProfileSelector
          profiles={profiles}
          selectedProfile={selectedProfile}
          onProfileChange={setSelectedProfile}
        />
        
        {selectedProfile && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: 'rgba(13, 211, 197, 0.1)', 
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#9ca3af'
          }}>
            <p style={{ color: '#0dd3c5', fontWeight: 'bold', marginBottom: '5px' }}>Note:</p>
            <p style={{ margin: 0 }}>
              To add or manage reference signatures for this user, visit the "Signatures" section in the navigation menu.
            </p>
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Upload Signature to Verify</label>
        <InteractiveSignatureUpload 
          onFileSelected={handleVerificationFileChange}
          onCaptureClick={captureFromCamera}
        />
      </div>
      
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input 
          type="checkbox" 
          id="saveToReferences" 
          checked={saveToReferences} 
          onChange={(e) => setSaveToReferences(e.target.checked)}
          style={{ width: 'auto' }}
        />
        <label htmlFor="saveToReferences" style={{ marginBottom: 0, cursor: 'pointer' }}>
          Add to reference signatures if verified as genuine
        </label>
      </div>
      
      <div className="form-group">
        <label className="form-label">Notes (Optional)</label>
        <textarea 
          className="form-input"
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            border: '1px solid #374151',
            borderRadius: '4px',
            color: 'white',
            fontSize: '1rem',
            resize: 'vertical',
            minHeight: '80px'
          }}
          rows="3" 
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
          placeholder="Add any notes about this verification"
        ></textarea>
      </div>
      
      {/* Information about multi-feature verification system */}
      <div style={{ 
        marginBottom: '20px', 
        backgroundColor: 'rgba(13, 211, 197, 0.1)', 
        padding: '15px', 
        borderRadius: '4px',
        color: '#9ca3af',
        fontSize: '0.9rem'
      }}>
        <p style={{ color: '#0dd3c5', marginBottom: '5px', fontWeight: 'bold' }}>Multi-Feature Verification System:</p>
        <p style={{ marginBottom: '10px' }}>
          This system uses advanced deep learning and traditional computer vision techniques for comprehensive signature analysis:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '10px', borderRadius: '4px' }}>
            <p style={{ color: '#0dd3c5', fontWeight: 'bold', marginBottom: '5px' }}>Deep Learning Features</p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
              <li><strong>CNN:</strong> Convolutional neural networks for image pattern recognition</li>
              <li><strong>Siamese:</strong> Paired comparison networks for similarity analysis</li>
              <li><strong>LSTM:</strong> Temporal sequence analysis for dynamic features</li>
            </ul>
          </div>
          <div style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '10px', borderRadius: '4px' }}>
            <p style={{ color: '#0dd3c5', fontWeight: 'bold', marginBottom: '5px' }}>Traditional Features</p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem' }}>
              <li><strong>Geometric:</strong> Shape, contour, and morphological analysis</li>
              <li><strong>Texture:</strong> Surface patterns and GLCM properties</li>
              <li><strong>Structural:</strong> Skeleton analysis and connectivity features</li>
            </ul>
          </div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>
          All features are combined using weighted averaging for the most accurate verification possible.
        </p>
      </div>
      
      <button 
        className="save-button" 
        onClick={handleVerification}
        disabled={isSubmitting || !selectedProfile || !verificationFile}
        style={{ 
          marginTop: '10px',
          backgroundColor: isSubmitting || !selectedProfile || !verificationFile ? '#2c3e50' : '#0dd3c5',
          color: isSubmitting || !selectedProfile || !verificationFile ? '#6c7983' : '#000',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          fontWeight: '500',
          cursor: isSubmitting || !selectedProfile || !verificationFile ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '1rem'
        }}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verify Signature
          </>
        )}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '20px', 
          backgroundColor: 'rgba(255, 0, 0, 0.1)', 
          padding: '10px', 
          borderRadius: '4px',
          color: '#ff4d4d',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px' 
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{error}</div>
        </div>
      )}
      
      {/* Loading animation - pass the isCompleted prop based on API call status */}
      {isProcessing && (
        <SignatureLoadingAnimation
          onComplete={handleAnimationComplete}
          isCompleted={verificationSuccess}
        />
      )}
      
      {/* Full screen animated result */}
      {showAnimatedResult && verificationResult && (
        <VerificationSuccessAnimation 
          result={verificationResult}
          onClose={() => {
            setShowAnimatedResult(false);
            setShowDetailedResults(true);
          }}
        />
      )}
      
      {/* Detailed verification result */}
      {showDetailedResults && verificationResult && (
        <VerificationResultDisplay 
          result={verificationResult} 
          onClose={() => {
            setVerificationResult(null);
            setShowDetailedResults(false);
          }}
        />
      )}
      
      {/* Camera capture modal */}
      {showCameraModal && (
        <SignatureCaptureModal
          onImageCaptured={handleCapturedImage}
          onCancel={() => setShowCameraModal(false)}
          type="verification"
        />
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

export default VerifySignatureForm;
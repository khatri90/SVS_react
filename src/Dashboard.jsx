import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import { profilesAPI, signaturesAPI, verificationAPI } from './api';
import SignatureCaptureModal from './SignatureCaptureModal';
import VerifySignatureForm from './VerifySignatureForm';
import SignatureLoadingAnimation from './SignatureLoadingAnimation';
import InteractiveSignatureUpload from './InteractiveSignatureUpload';
import ManageSignatures from './ManageSignatures';
import { FeedbackAnimation, VerificationSuccessAnimation } from './FeedbackAnimations';

const Dashboard = ({ user, onLogout }) => {
  // Main state variables
  const [activePage, setActivePage] = useState('verify');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [particles, setParticles] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserIdNumber, setNewUserIdNumber] = useState(''); // This will be auto-generated
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [selectedProfileForVerification, setSelectedProfileForVerification] = useState('');
  const [verificationFile, setVerificationFile] = useState(null);
  const [saveToReferences, setSaveToReferences] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showAnimatedVerificationResult, setShowAnimatedVerificationResult] = useState(false);
  const [showDetailedVerificationResult, setShowDetailedVerificationResult] = useState(false);
  
  // Camera capture related state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraType, setCameraType] = useState('');
  
  const fileInputRef = useRef(null);
  const verificationFileRef = useRef(null);
  
  // Function to generate 6-digit hex ID
  const generateHexId = () => {
    return Math.random().toString(16).substr(2, 6).toUpperCase();
  };
  
  // Check for auth token on initial load
  useEffect(() => {
    document.title = "SVS - Signature Verification System";
    
    // Add visual enhancement to body background
    document.body.style.backgroundColor = "#000";
    
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);
  
  // Fetch user profiles on initial load
  useEffect(() => {
    fetchUserProfiles();
  }, []);
  
  // Fetch verification history when active page changes to history
  useEffect(() => {
    if (activePage === 'history') {
      fetchVerificationHistory();
    }
  }, [activePage]);
  
  // Animation for background particles
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
  
  // Show notification
  const showNotificationWithTimeout = (type, message, duration = 3000) => {
    setNotificationType(type);
    setNotificationMessage(message);
    setShowNotification(true);
    
    setTimeout(() => {
      setShowNotification(false);
    }, duration);
  };
  
  // Fetch user profiles
  const fetchUserProfiles = async () => {
    setIsLoading(true);
    try {
      const profiles = await profilesAPI.getAll();
      if (!profiles.error) {
        // Map signatures to each profile
        const profilesWithSignatures = await Promise.all(
          profiles.map(async (profile) => {
            try {
              const signatures = await profilesAPI.getSignatures(profile.id);
              return {
                ...profile,
                signatureCount: signatures.length,
                signatures: signatures.map(sig => sig.image)
              };
            } catch (error) {
              console.error(`Error fetching signatures for profile ${profile.id}:`, error);
              return {
                ...profile,
                signatureCount: 0,
                signatures: []
              };
            }
          })
        );
        setUserProfiles(profilesWithSignatures);
      } else {
        showNotificationWithTimeout('error', profiles.error || 'Failed to fetch user profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      showNotificationWithTimeout('error', 'Failed to fetch user profiles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch verification history
  const fetchVerificationHistory = async () => {
    setIsLoading(true);
    try {
      const history = await verificationAPI.getHistory();
      if (!history.error) {
        setVerificationHistory(history);
      } else {
        showNotificationWithTimeout('error', history.error || 'Failed to fetch verification history');
      }
    } catch (error) {
      console.error('Error fetching verification history:', error);
      showNotificationWithTimeout('error', 'Failed to fetch verification history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle opening the signature modal
  const openSignatureModal = async (profile) => {
    // If we already have the signatures, use them
    if (profile.signatures && profile.signatures.length > 0) {
      setSelectedUser(profile);
      setShowModal(true);
      return;
    }
    
    // Otherwise fetch signatures
    setIsLoading(true);
    try {
      const signatures = await profilesAPI.getSignatures(profile.id);
      if (!signatures.error) {
        const updatedProfile = {
          ...profile,
          signatureCount: signatures.length,
          signatures: signatures.map(sig => sig.image)
        };
        setSelectedUser(updatedProfile);
        setShowModal(true);
      } else {
        showNotificationWithTimeout('error', signatures.error || 'Failed to fetch signatures');
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
      showNotificationWithTimeout('error', 'Failed to fetch signatures. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle opening the add user modal
  const openAddUserModal = () => {
    setShowAddUserModal(true);
    setNewUserName('');
    setNewUserIdNumber(generateHexId()); // Auto-generate hex ID
    setSelectedFiles([]);
  };
  
  // Handle file selection for adding signatures
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };
  
  // Handle verification file selection
  const handleVerificationFileChange = (file) => {
    setVerificationFile(file);
  };
  
  // Handle file removal
  const removeFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  // Handle regenerating the ID
  const regenerateId = () => {
    setNewUserIdNumber(generateHexId());
  };
  
  // Enhanced handleAddUser with better error tracking
  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      showNotificationWithTimeout('error', 'Please enter a user name');
      return;
    }
    
    if (!newUserIdNumber.trim()) {
      showNotificationWithTimeout('error', 'ID number is required');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Create new user profile
      const profileData = {
        name: newUserName.trim(),
        id_number: newUserIdNumber.trim()
      };
      
      console.log('Creating profile with data:', profileData);
      const newProfile = await profilesAPI.create(profileData);
      
      if (newProfile.error) {
        showNotificationWithTimeout('error', newProfile.error || 'Failed to create user profile');
        setIsLoading(false);
        return;
      }
      
      console.log('Profile created successfully:', newProfile);
      
      // Upload signatures if any are selected
      let uploadedCount = 0;
      let uploadErrors = [];
      
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          console.log(`Uploading signature ${uploadedCount + 1}/${selectedFiles.length}:`, file.name);
          
          try {
            const uploadResult = await signaturesAPI.upload(newProfile.id, file);
            
            if (uploadResult.error) {
              uploadErrors.push(`Failed to upload ${file.name}: ${uploadResult.error}`);
              console.error('Signature upload failed:', uploadResult.error);
            } else {
              uploadedCount++;
              console.log(`Signature ${uploadedCount} uploaded successfully`);
            }
          } catch (uploadError) {
            console.error('Exception during upload:', uploadError);
            uploadErrors.push(`Error uploading ${file.name}: ${uploadError.message}`);
          }
        }
      }
      
      // Reset form and close modal
      setNewUserName('');
      setNewUserIdNumber('');
      setSelectedFiles([]);
      setShowAddUserModal(false);
      
      // Refresh user profiles
      fetchUserProfiles();
      
      if (uploadErrors.length > 0) {
        // Show partial success message
        showNotificationWithTimeout('success', `User profile created, but ${uploadErrors.length} signature upload(s) failed.`);
        console.warn('Some signature uploads failed:', uploadErrors);
      } else if (selectedFiles.length > 0) {
        // Show complete success message
        showNotificationWithTimeout('success', `User profile for ${newProfile.name} created with ${uploadedCount} signature(s).`);
      } else {
        // No signatures included
        showNotificationWithTimeout('success', `User profile for ${newProfile.name} created successfully.`);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      showNotificationWithTimeout('error', 'Failed to create user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle verification submission
  const handleVerification = async () => {
    if (!selectedProfileForVerification) {
      showNotificationWithTimeout('error', 'Please select a user profile');
      return;
    }
    
    if (!verificationFile) {
      showNotificationWithTimeout('error', 'Please select a signature to verify');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setVerificationResult(null);
    setShowDetailedVerificationResult(false);
    setShowAnimatedVerificationResult(false);
    
    try {
      const result = await verificationAPI.verify(
        selectedProfileForVerification,
        verificationFile,
        saveToReferences,
        verificationNotes
      );
      
      if (result.error) {
        showNotificationWithTimeout('error', result.error || 'Verification failed');
        return;
      }
      
      setVerificationResult(result);
      
      // Show animated verification result first
      setShowAnimatedVerificationResult(true);
      
      // After animation completes, show detailed results
      setTimeout(() => {
        setShowAnimatedVerificationResult(false);
        setShowDetailedVerificationResult(true);
      }, 6000);
      
      showNotificationWithTimeout('success', 'Signature verification completed');
    } catch (error) {
      console.error('Error during verification:', error);
      showNotificationWithTimeout('error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Camera capture functions
  const captureReferenceFromCamera = () => {
    setCameraType('reference');
    setShowCameraModal(true);
  };

  const captureVerificationFromCamera = () => {
    setCameraType('verification');
    setShowCameraModal(true);
  };

  const handleCapturedSignature = (file) => {
    setShowCameraModal(false);
    
    if (cameraType === 'reference') {
      // Handle reference signature - add to selectedFiles
      setSelectedFiles(prevFiles => [...prevFiles, file]);
      showNotificationWithTimeout('success', 'Reference signature captured from camera');
    } else if (cameraType === 'verification') {
      // Handle verification signature
      setVerificationFile(file);
      showNotificationWithTimeout('success', 'Verification signature captured from camera');
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Trigger verification file input click
  const triggerVerificationFileInput = () => {
    if (verificationFileRef.current) {
      verificationFileRef.current.click();
    }
  };
  
  // Filter users based on search query
  const filteredUsers = userProfiles.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.id_number.includes(searchQuery)
  );
  
  // Enhanced VerificationResult component with multi-feature analysis
  const VerificationResultDisplay = ({ result, onClose }) => {
    if (!result) return null;
    
    const confidence = result.confidence * 100; // Convert to percentage
    const isGenuine = result.result === 'genuine';
    
    // Extract metrics from the result - handle both nested and direct structure
    const metrics = result.metrics || result.verification_metrics || {};
    
    // Extract voting information from details if available
    const details = result.details || {};
    const genuineCount = details.genuine_count || metrics.genuine_count || 0;
    const forgeryCount = details.forgery_count || metrics.forgery_count || 0;
    const totalReferences = details.total_references || metrics.total_references || 0;

    return (
      <div className="verification-result" style={{ 
        padding: '20px', 
        backgroundColor: 'rgba(31, 41, 55, 0.6)', 
        borderRadius: '8px',
        marginTop: '20px',
        animation: 'fadeIn 0.5s ease'
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
          borderRadius: '4px'
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
              CNN (60%) • Siamese (40%) • LSTM (8%) • Geometric (5%) • Texture (5%) • Structural (2%)
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
  
  // Render verify page
  const renderVerifyPage = () => (
    <>
      <div className="page-header">
        <h2>Signature Verification</h2>
      </div>
      
      <VerifySignatureForm profiles={userProfiles} />
    </>
  );
  
  // Render users page
  const renderUsersPage = () => (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Users</h2>
          
          {/* Add User Button */}
          <button 
            className="add-user-button" 
            onClick={openAddUserModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: '#0dd3c5',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              marginLeft: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px', marginRight: '8px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: 'white',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#0dd3c5';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(13, 211, 197, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#374151';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', stroke: '#9ca3af' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>ID Number</th>
              <th>Signatures</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(profile => (
                <tr key={profile.id}>
                  <td>{profile.id}</td>
                  <td>{profile.name}</td>
                  <td>{profile.id_number}</td>
                  <td>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: profile.signatureCount > 0 ? 'rgba(13, 211, 197, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                        color: profile.signatureCount > 0 ? '#0dd3c5' : '#ff4d4d',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {profile.signatureCount}
                      </span>
                      {profile.signatureCount === 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No signatures</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="view-button"
                      onClick={() => openSignatureModal(profile)}
                      disabled={profile.signatureCount === 0}
                      style={{
                        backgroundColor: profile.signatureCount === 0 ? 'rgba(75, 85, 99, 0.3)' : 'rgba(13, 211, 197, 0.2)',
                        color: profile.signatureCount === 0 ? '#6c7983' : '#0dd3c5',
                        border: profile.signatureCount === 0 ? '1px solid #4b5563' : '1px solid #0dd3c5',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: profile.signatureCount === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {profile.signatureCount > 0 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Signatures
                        </span>
                      ) : (
                        <span>No Signatures</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="#9ca3af" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading users...
                    </div>
                  ) : searchQuery ? 'No matching profiles found' : 'No user profiles found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
  
  // Render signatures management page
  const renderSignaturesPage = () => (
    <>
      <div className="page-header">
        <h2>Manage Signatures</h2>
        <div className="server-status" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
          <div className="status-indicator status-online" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0dd3c5', marginRight: '8px' }}></div>
          <span>System Online</span>
        </div>
      </div>
      
      <ManageSignatures profiles={userProfiles} />
    </>
  );
  
  // Render history page
  const renderHistoryPage = () => (
    <>
      <div className="page-header">
        <h2>Verification History</h2>
        <div className="server-status" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
          <div className="status-indicator status-online" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0dd3c5', marginRight: '8px' }}></div>
          <span>System Online</span>
        </div>
      </div>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Result</th>
              <th>Confidence</th>
              <th>Verified By</th>
              <th>Added to References</th>
            </tr>
          </thead>
          <tbody>
            {verificationHistory.length > 0 ? (
              verificationHistory.map(record => (
                <tr key={record.id} style={{ transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(13, 211, 197, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}>
                  <td>{new Date(record.verified_at).toLocaleString()}</td>
                  <td>{record.user_profile}</td>
                  <td style={{ 
                    color: record.result === 'genuine' ? '#0dd3c5' : '#ff4d4d',
                    fontWeight: 'bold'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {record.result === 'genuine' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {record.result.toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      width: '100%',
                      maxWidth: '120px'
                    }}>
                      <div style={{
                        flex: '1 1 auto',
                        height: '6px',
                        backgroundColor: 'rgba(31, 41, 55, 0.4)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${(record.confidence * 100)}%`,
                          backgroundColor: record.result === 'genuine' ? '#0dd3c5' : '#ff4d4d',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                      <span>{(record.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>{record.verified_by}</td>
                  <td>
                    {record.added_to_references ? (
                      <span style={{ color: '#0dd3c5', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>No</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  {isLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="#9ca3af" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading verification history...
                    </div>
                  ) : 'No verification records found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
  
  // Render active page content
  const renderPageContent = () => {
    switch (activePage) {
      case 'verify':
        return renderVerifyPage();
      case 'users':
        return renderUsersPage();
      case 'signatures':
        return renderSignaturesPage();
      case 'history':
        return renderHistoryPage();
      default:
        return renderVerifyPage();
    }
  };
  
  return (
    <div className="dashboard-container">
      {/* Animated particles in background */}
      {particles.map(particle => (
        <div 
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
        />
      ))}
      
      {/* Grid lines */}
      <div className="background-grid"></div>
      
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <div className="logo-wrapper" style={{ position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L85 20V50C85 70 70 85 50 95C30 85 15 70 15 50V20L50 5Z" fill="black" stroke="#0dd3c5" strokeWidth="4"/>
              <circle cx="50" cy="50" r="25" fill="#0dd3c5" />
              <circle cx="50" cy="50" r="20" fill="white" />
              <path d="M40 50C42 48 45 45 50 45C55 45 58 50 60 55" stroke="black" strokeWidth="2"/>
            </svg>
            
            {/* Pulsing animation */}
            <div style={{
              position: 'absolute',
              inset: '-5px',
              borderRadius: '50%',
              border: '2px solid rgba(13, 211, 197, 0.5)',
              animation: 'pulse 2s infinite'
            }}></div>
          </div>
          <h3 className="logo-text">SVS</h3>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activePage === 'verify' ? 'active' : ''}`}
            onClick={() => setActivePage('verify')}
            style={{
              transform: activePage === 'verify' ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.2s'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Verify</span>
          </button>
          
          <button 
            className={`nav-item ${activePage === 'users' ? 'active' : ''}`}
            onClick={() => setActivePage('users')}
            style={{
              transform: activePage === 'users' ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.2s'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Users</span>
          </button>
          
          <button 
            className={`nav-item ${activePage === 'signatures' ? 'active' : ''}`}
            onClick={() => setActivePage('signatures')}
            style={{
              transform: activePage === 'signatures' ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.2s'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Signatures</span>
          </button>
          
          <button 
            className={`nav-item ${activePage === 'history' ? 'active' : ''}`}
            onClick={() => setActivePage('history')}
            style={{
              transform: activePage === 'history' ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.2s'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
          </button>
          
          <button 
            className="nav-item logout" 
            onClick={onLogout}
            style={{ transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#ff4d4d' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="main-content">
        <div className="header">
          <h1>Signature Verification System</h1>
          <div className="user-profile">
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
              }}></div>
              <span>System Online</span>
            </div>
            
            <span>{user ? user.username : 'User'}</span>
            <div className="avatar" style={{
              boxShadow: '0 0 10px rgba(13, 211, 197, 0.3)',
              transition: 'transform 0.2s'
            }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>{user ? user.username.charAt(0).toUpperCase() : 'U'}</div>
          </div>
        </div>
        
        <div className="page-content">
          {/* Success and error messages */}
          {showNotification && (
            <FeedbackAnimation 
              type={notificationType} 
              message={notificationMessage} 
              onClose={() => setShowNotification(false)} 
            />
          )}
          
          {/* Animated verification result */}
          {showAnimatedVerificationResult && verificationResult && (
            <VerificationSuccessAnimation 
              result={verificationResult}
              onClose={() => {
                setShowAnimatedVerificationResult(false);
                setShowDetailedVerificationResult(true);
              }}
            />
          )}
          
          {renderPageContent()}
        </div>
      </div>
      
      {/* Signature Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Signatures for {selectedUser.name}</h3>
              <button 
                className="close-button" 
                onClick={() => setShowModal(false)}
                style={{ transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="signatures-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedUser.signatures.length > 0 ? (
                selectedUser.signatures.map((sig, index) => (
                  <div 
                    className="signature-item" 
                    key={index}
                    style={{ transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    <div className="signature-preview">
                      <img 
                        src={sig} 
                        alt={`Signature ${index + 1}`} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div className="signature-info">
                      <span>Signature #{index + 1}</span>
                      {/* Display other signature metadata here if available */}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  No signatures found for this user.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content add-user-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button 
                className="close-button" 
                onClick={() => setShowAddUserModal(false)}
                style={{ transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user full name"
                  style={{ 
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#0dd3c5';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(13, 211, 197, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#374151';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Auto-Generated ID</label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(31, 41, 55, 0.4)',
                  border: '1px solid #374151',
                  borderRadius: '4px'
                }}>
                  <input 
                    type="text" 
                    value={newUserIdNumber}
                    readOnly
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#0dd3c5',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={regenerateId}
                    style={{
                      backgroundColor: 'rgba(13, 211, 197, 0.2)',
                      border: '1px solid rgba(13, 211, 197, 0.3)',
                      color: '#0dd3c5',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(13, 211, 197, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(13, 211, 197, 0.2)';
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '12px', height: '12px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </button>
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#9ca3af', 
                  marginTop: '5px' 
                }}>
                  This ID is automatically generated and will be used to identify the user profile.
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Reference Signatures</label>
                <InteractiveSignatureUpload 
                  onFileSelected={(file) => setSelectedFiles(prev => [...prev, file])}
                  onCaptureClick={captureReferenceFromCamera}
                />
                
                {/* Selected files list */}
                {selectedFiles.length > 0 && (
                  <div className="selected-files">
                    <div className="selected-files-header">
                      <h4>Selected Files ({selectedFiles.length})</h4>
                    </div>
                    <ul className="file-list">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="file-item" style={{ transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(13, 211, 197, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}>
                          <div className="file-info">
                            <svg xmlns="http://www.w3.org/2000/svg" className="file-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="file-name">{file.name}</span>
                          </div>
                          <button 
                            className="remove-file-button" 
                            onClick={() => removeFile(index)}
                            style={{ transition: 'all 0.2s' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#9ca3af';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="remove-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={() => setShowAddUserModal(false)}
                style={{ transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >Cancel</button>
              <button 
                className="save-button" 
                onClick={handleAddUser}
                disabled={isLoading}
                style={{ transition: 'all 0.2s' }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = '#0bbfb3';
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = '#0dd3c5';
                }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Capture Modal */}
      {showCameraModal && (
        <SignatureCaptureModal
          onImageCaptured={handleCapturedSignature}
          onCancel={() => setShowCameraModal(false)}
          type={cameraType}
        />
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
        }
        
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

export default Dashboard;
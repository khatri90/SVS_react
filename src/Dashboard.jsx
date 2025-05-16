import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import { profilesAPI, signaturesAPI, verificationAPI } from './api';
import SignatureCaptureModal from './SignatureCaptureModal';
import VerifySignatureForm from './VerifySignatureForm';

const Dashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('verify');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [particles, setParticles] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserIdNumber, setNewUserIdNumber] = useState('');
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
  
  // Camera capture related state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraType, setCameraType] = useState('');
  
  const fileInputRef = useRef(null);
  const verificationFileRef = useRef(null);
  
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
        setErrorMessage(profiles.error || 'Failed to fetch user profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setErrorMessage('Failed to fetch user profiles. Please try again.');
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
        setErrorMessage(history.error || 'Failed to fetch verification history');
      }
    } catch (error) {
      console.error('Error fetching verification history:', error);
      setErrorMessage('Failed to fetch verification history. Please try again.');
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
        setErrorMessage(signatures.error || 'Failed to fetch signatures');
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
      setErrorMessage('Failed to fetch signatures. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle opening the add user modal
  const openAddUserModal = () => {
    setShowAddUserModal(true);
    setNewUserName('');
    setNewUserIdNumber('');
    setSelectedFiles([]);
  };
  
  // Handle file selection for adding signatures
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };
  
  // Handle verification file selection
  const handleVerificationFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVerificationFile(e.target.files[0]);
    }
  };
  
  // Handle file removal
  const removeFile = (index) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  // Enhanced handleAddUser with better error tracking
  
  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      setErrorMessage('Please enter a user name');
      return;
    }
    
    if (!newUserIdNumber.trim()) {
      setErrorMessage('Please enter an ID number');
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
        setErrorMessage(newProfile.error || 'Failed to create user profile');
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
        setSuccessMessage(`User profile created, but ${uploadErrors.length} signature upload(s) failed.`);
        console.warn('Some signature uploads failed:', uploadErrors);
      } else if (selectedFiles.length > 0) {
        // Show complete success message
        setSuccessMessage(`User profile for ${newProfile.name} created with ${uploadedCount} signature(s).`);
      } else {
        // No signatures included
        setSuccessMessage(`User profile for ${newProfile.name} created successfully.`);
      }
      
      setTimeout(() => setSuccessMessage(''), 5000); // Show message longer
    } catch (error) {
      console.error('Error creating user profile:', error);
      setErrorMessage('Failed to create user profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle verification submission
  const handleVerification = async () => {
    if (!selectedProfileForVerification) {
      setErrorMessage('Please select a user profile');
      return;
    }
    
    if (!verificationFile) {
      setErrorMessage('Please select a signature to verify');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    setVerificationResult(null);
    
    try {
      const result = await verificationAPI.verify(
        selectedProfileForVerification,
        verificationFile,
        saveToReferences,
        verificationNotes
      );
      
      if (result.error) {
        setErrorMessage(result.error || 'Verification failed');
        return;
      }
      
      setVerificationResult(result);
      setSuccessMessage('Signature verification completed');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error during verification:', error);
      setErrorMessage('Verification failed. Please try again.');
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
    } else if (cameraType === 'verification') {
      // Handle verification signature
      setVerificationFile(file);
    }
    
    setSuccessMessage(`Signature captured from camera`);
    setTimeout(() => setSuccessMessage(''), 3000);
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
  
  // Render verification form
  const renderVerifyPage = () => (
    <>
      <div className="page-header">
        <h2>Signature Verification</h2>
      </div>
      
      <div className="data-table-container" style={{ padding: '20px' }}>
        <div className="form-group">
          <label className="form-label">Select User Profile</label>
          <select 
            className="form-input"
            value={selectedProfileForVerification}
            onChange={(e) => setSelectedProfileForVerification(e.target.value)}
          >
            <option value="">-- Select a profile --</option>
            {userProfiles.map(profile => (
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
              onClick={captureVerificationFromCamera}
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
        
        <button 
          className="save-button" 
          onClick={handleVerification}
          disabled={isLoading}
          style={{ marginTop: '20px' }}
        >
          {isLoading ? 'Processing...' : 'Verify Signature'}
        </button>
        
        {verificationResult && (
          <div className="verification-result" style={{ marginTop: '30px', padding: '20px', backgroundColor: 'rgba(31, 41, 55, 0.6)', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px', color: '#0dd3c5' }}>Verification Result</h3>
            
            <div style={{ 
              padding: '10px', 
              backgroundColor: verificationResult.result === 'genuine' ? 'rgba(0, 128, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
              borderLeft: `4px solid ${verificationResult.result === 'genuine' ? '#0dd3c5' : '#ff4d4d'}`,
              marginBottom: '15px',
              borderRadius: '4px'
            }}>
              <p style={{ fontSize: '1.25rem', color: verificationResult.result === 'genuine' ? '#0dd3c5' : '#ff4d4d' }}>
                Result: <strong>{verificationResult.result === 'genuine' ? 'GENUINE' : 'FORGED'}</strong>
              </p>
              <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
              {verificationResult.added_to_references && (
                <p style={{ color: '#0dd3c5', marginTop: '5px' }}>✓ Added to reference signatures</p>
              )}
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>Similarity Metrics</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {verificationResult.details && verificationResult.details.metrics && (
                  Object.entries(verificationResult.details.metrics).map(([key, value]) => (
                    <div key={key} style={{ backgroundColor: 'rgba(31, 41, 55, 0.4)', padding: '10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{key.replace('_similarity', '').toUpperCase()}</div>
                      <div style={{ fontSize: '1.25rem', color: '#0dd3c5' }}>{(value * 100).toFixed(2)}%</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
  
  // Render users page
  const renderUsersPage = () => (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Users</h2>
          
          {/* Add User Button */}
          <button className="add-user-button" onClick={openAddUserModal}>
            <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <td>{profile.signatureCount}</td>
                  <td>
                    <button 
                      className="view-button"
                      onClick={() => openSignatureModal(profile)}
                      disabled={profile.signatureCount === 0}
                    >
                      View Signatures
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  {isLoading ? 'Loading...' : 'No user profiles found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
  
  // Render history page
  const renderHistoryPage = () => (
    <>
      <div className="page-header">
        <h2>Verification History</h2>
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
                <tr key={record.id}>
                  <td>{new Date(record.verified_at).toLocaleString()}</td>
                  <td>{record.user_profile}</td>
                  <td style={{ 
                    color: record.result === 'genuine' ? '#0dd3c5' : '#ff4d4d',
                    fontWeight: 'bold'
                  }}>
                    {record.result.toUpperCase()}
                  </td>
                  <td>{record.confidence.toFixed(2)}%</td>
                  <td>{record.verified_by}</td>
                  <td>{record.added_to_references ? 'Yes' : 'No'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  {isLoading ? 'Loading...' : 'No verification records found'}
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
          <div className="logo-wrapper">
            <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L85 20V50C85 70 70 85 50 95C30 85 15 70 15 50V20L50 5Z" fill="black" stroke="#0dd3c5" strokeWidth="4"/>
              <circle cx="50" cy="50" r="25" fill="#0dd3c5" />
              <circle cx="50" cy="50" r="20" fill="white" />
              <path d="M40 50C42 48 45 45 50 45C55 45 58 50 60 55" stroke="black" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="logo-text">SVS</h3>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activePage === 'verify' ? 'active' : ''}`}
            onClick={() => setActivePage('verify')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Verify</span>
          </button>
          
          <button 
            className={`nav-item ${activePage === 'users' ? 'active' : ''}`}
            onClick={() => setActivePage('users')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Users</span>
          </button>
          
          <button 
            className={`nav-item ${activePage === 'history' ? 'active' : ''}`}
            onClick={() => setActivePage('history')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History</span>
          </button>
          
          <button className="nav-item logout" onClick={onLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <span>{user ? user.username : 'User'}</span>
            <div className="avatar">{user ? user.username.charAt(0).toUpperCase() : 'U'}</div>
          </div>
        </div>
        
        <div className="page-content">
          {/* Success and error messages */}
          {errorMessage && (
            <div style={{ 
              backgroundColor: 'rgba(255, 0, 0, 0.1)', 
              color: '#ff4d4d', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>{errorMessage}</div>
              <button 
                style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}
                onClick={() => setErrorMessage('')}
              >
                ✕
              </button>
            </div>
          )}
          
          {successMessage && (
            <div style={{ 
              backgroundColor: 'rgba(13, 211, 197, 0.1)', 
              color: '#0dd3c5', 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>{successMessage}</div>
              <button 
                style={{ background: 'none', border: 'none', color: '#0dd3c5', cursor: 'pointer' }}
                onClick={() => setSuccessMessage('')}
              >
                ✕
              </button>
            </div>
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
              <button className="close-button" onClick={() => setShowModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="signatures-container">
              {selectedUser.signatures.length > 0 ? (
                selectedUser.signatures.map((sig, index) => (
                  <div className="signature-item" key={index}>
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
          <div className="modal-content add-user-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="close-button" onClick={() => setShowAddUserModal(false)}>
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
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">ID Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newUserIdNumber}
                  onChange={(e) => setNewUserIdNumber(e.target.value)}
                  placeholder="Enter ID number or identifier"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Signatures</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <button 
                    type="button" 
                    className="file-upload-button"
                    onClick={triggerFileInput}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                    </svg>
                    Upload Signatures
                  </button>
                  <button 
                    type="button" 
                    className="file-upload-button"
                    onClick={captureReferenceFromCamera}
                    style={{ marginLeft: '10px', backgroundColor: 'rgba(13, 211, 197, 0.2)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capture from Camera
                  </button>
                  <span className="file-help-text">Choose multiple signature images</span>
                </div>
                
                {/* Selected files list */}
                {selectedFiles.length > 0 && (
                  <div className="selected-files">
                    <div className="selected-files-header">
                      <h4>Selected Files ({selectedFiles.length})</h4>
                    </div>
                    <ul className="file-list">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="file-item">
                          <div className="file-info">
                            <svg xmlns="http://www.w3.org/2000/svg" className="file-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="file-name">{file.name}</span>
                          </div>
                          <button className="remove-file-button" onClick={() => removeFile(index)}>
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
              <button className="cancel-button" onClick={() => setShowAddUserModal(false)}>Cancel</button>
              <button 
                className="save-button" 
                onClick={handleAddUser}
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add User'}
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
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect, useRef } from 'react';
import { profilesAPI, signaturesAPI } from './api';
import InteractiveSignatureUpload from './InteractiveSignatureUpload';
import SignatureCaptureModal from './SignatureCaptureModal';

const ManageSignatures = ({ profiles }) => {
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [selectedProfileData, setSelectedProfileData] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // Load profile data when selected profile changes
  useEffect(() => {
    if (!selectedProfile) {
      setSelectedProfileData(null);
      return;
    }
    
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const signatures = await profilesAPI.getSignatures(selectedProfile);
        
        // Find the profile data
        const profile = profiles.find(p => p.id.toString() === selectedProfile.toString());
        
        if (profile && !signatures.error) {
          setSelectedProfileData({
            ...profile,
            signatures: signatures
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [selectedProfile, profiles]);
  
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
    setSelectedProfile(profileId);
    setIsDropdownOpen(false);
    setUploadError('');
    setUploadSuccess(false);
    setDeleteError('');
    setDeleteSuccess(false);
  };
  
  // Handle camera capture click
  const handleCaptureClick = () => {
    setShowCameraModal(true);
  };
  
  // Handle captured image from camera
  const handleCapturedImage = async (file) => {
    setShowCameraModal(false);
    
    if (!selectedProfile) {
      setUploadError('No profile selected');
      return;
    }
    
    await uploadSignature(file);
  };
  
  // Handle file selection
  const handleFileSelected = async (file) => {
    if (!selectedProfile) {
      setUploadError('No profile selected');
      return;
    }
    
    await uploadSignature(file);
  };
  
  // Upload signature to server
  const uploadSignature = async (file) => {
    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError('');
    
    try {
      const result = await signaturesAPI.upload(selectedProfile, file);
      
      if (result.error) {
        setUploadError(result.error || 'Failed to upload signature');
      } else {
        setUploadSuccess(true);
        
        // Refresh signature list
        const signatures = await profilesAPI.getSignatures(selectedProfile);
        
        if (!signatures.error) {
          setSelectedProfileData(prevData => ({
            ...prevData,
            signatures: signatures
          }));
        }
        
        // Clear success message after delay
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error uploading signature:', error);
      setUploadError('Failed to upload signature. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle signature delete click
  const handleDeleteClick = (signatureId) => {
    setSignatureToDelete(signatureId);
    setShowConfirmDelete(true);
    setDeleteError('');
  };
  
  // Confirm and delete signature
  const confirmDelete = async () => {
    if (!signatureToDelete) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      const result = await signaturesAPI.delete(signatureToDelete);
      
      if (result.error) {
        setDeleteError(result.error || 'Failed to delete signature');
      } else {
        // Show success message
        setDeleteSuccess(true);
        setTimeout(() => {
          setDeleteSuccess(false);
        }, 3000);
        
        // Refresh signature list
        const signatures = await profilesAPI.getSignatures(selectedProfile);
        
        if (!signatures.error) {
          setSelectedProfileData(prevData => ({
            ...prevData,
            signatures: signatures
          }));
        }
        
        setShowConfirmDelete(false);
        setSignatureToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      setDeleteError('Failed to delete signature. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setSignatureToDelete(null);
    setDeleteError('');
  };
  
  // Format profile name for display
  const getProfileDisplayName = (profileId) => {
    if (!profileId || !profiles) return '-- Select a profile --';
    const profile = profiles.find(p => p.id.toString() === profileId.toString());
    return profile ? `${profile.name} (ID: ${profile.id_number})` : '-- Select a profile --';
  };
  
  return (
    <div style={{ width: '100%' }}>
      {/* Profile selection */}
      <div style={{
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#0dd3c5', marginBottom: '15px', fontSize: '1.1rem' }}>
          Select User Profile
        </h3>
        
        <div className="dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            className="dropdown-header" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              width: '100%',
              padding: '12px 16px',
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
                        padding: '12px 16px',
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
      </div>

      {/* Signature management section */}
      {selectedProfileData && (
        <div 
          className="signature-management"
          style={{
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderRadius: '8px',
            padding: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#0dd3c5', fontSize: '1.1rem', margin: 0 }}>
              Manage Signatures for {selectedProfileData.name}
            </h3>
            
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0dd3c5' }}>
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            )}
          </div>
          
          {/* Upload new signature */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '1rem' }}>
              Add New Reference Signature
            </h4>
            
            <InteractiveSignatureUpload
              onFileSelected={handleFileSelected}
              onCaptureClick={handleCaptureClick}
            />
            
            {isUploading && (
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                backgroundColor: 'rgba(13, 211, 197, 0.1)', 
                borderRadius: '4px',
                color: '#0dd3c5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading signature...
              </div>
            )}
            
            {uploadSuccess && (
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                backgroundColor: 'rgba(13, 211, 197, 0.1)', 
                borderRadius: '4px',
                color: '#0dd3c5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Signature uploaded successfully
              </div>
            )}
            
            {uploadError && (
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                borderRadius: '4px',
                color: '#ff4d4d',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {uploadError}
              </div>
            )}
          </div>
          
          {/* Existing signatures */}
          <div>
            <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '1rem' }}>
              Existing Signatures ({selectedProfileData.signatures?.length || 0})
            </h4>
            
            {deleteSuccess && (
              <div style={{ 
                marginBottom: '15px', 
                padding: '12px', 
                backgroundColor: 'rgba(13, 211, 197, 0.1)', 
                borderRadius: '4px',
                color: '#0dd3c5',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Signature deleted successfully
              </div>
            )}
            
            {selectedProfileData.signatures && selectedProfileData.signatures.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                {selectedProfileData.signatures.map((signature, index) => (
                  <div 
                    key={signature.id || index} 
                    style={{
                      backgroundColor: 'rgba(31, 41, 55, 0.4)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(13, 211, 197, 0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    <div style={{
                      height: '150px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '15px'
                    }}>
                      <img 
                        src={signature.image} 
                        alt={`Signature ${index + 1}`} 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                    
                    <div style={{
                      padding: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>
                          Signature #{index + 1}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                          {signature.created_at ? new Date(signature.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                        {signature.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                            Notes: {signature.notes}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleDeleteClick(signature.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #ff4d4d',
                          color: '#ff4d4d',
                          borderRadius: '4px',
                          width: '35px',
                          height: '35px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '30px',
                backgroundColor: 'rgba(31, 41, 55, 0.4)',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '48px', height: '48px', margin: '0 auto 15px', color: '#4b5563' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No signatures found</p>
                <p style={{ fontSize: '0.9rem' }}>Upload a signature above to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!selectedProfile && (
        <div style={{
          backgroundColor: 'rgba(31, 41, 55, 0.6)',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '64px', height: '64px', margin: '0 auto 20px', color: '#4b5563' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '1.2rem' }}>Select a User Profile</h3>
          <p style={{ fontSize: '1rem' }}>Choose a user profile from the dropdown above to manage their signatures.</p>
        </div>
      )}
      
      {/* Camera capture modal */}
      {showCameraModal && (
        <SignatureCaptureModal
          onImageCaptured={handleCapturedImage}
          onCancel={() => setShowCameraModal(false)}
          type="reference"
        />
      )}
      
      {/* Confirmation dialog for signature deletion */}
      {showConfirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '450px',
            padding: '25px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            border: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ff4d4d" style={{ width: '24px', height: '24px', marginRight: '10px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 style={{ color: '#ff4d4d', margin: 0, fontSize: '1.1rem' }}>Confirm Deletion</h3>
            </div>
            
            <p style={{ marginBottom: '20px', color: '#e5e7eb', lineHeight: '1.5' }}>
              Are you sure you want to delete this signature? This action cannot be undone and may affect future verification accuracy.
            </p>
            
            {deleteError && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                backgroundColor: 'rgba(255, 0, 0, 0.1)', 
                borderRadius: '4px',
                color: '#ff4d4d',
                border: '1px solid rgba(255, 77, 77, 0.3)'
              }}>
                {deleteError}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                style={{
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #4b5563',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  backgroundColor: '#ff4d4d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete Signature'}
              </button>
            </div>
          </div>
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

export default ManageSignatures;
// src/api.js - API Service for Signature Verification System

// Base API URL - adjust this to match your Django server
const API_BASE_URL = 'https://069e-111-88-37-209.ngrok-free.app/api';
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

// Helper for handling token storage
const TOKEN_KEY = 'svs_auth_token';

// Token management
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Headers configuration
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
};

// API request helper
const apiRequest = async (endpoint, method = 'GET', data = null, includeToken = true) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint}`;
  
  const options = {
    method,
    headers: includeToken ? getHeaders() : { 'Content-Type': 'application/json' },
  };
  
  if (data) {
    if (data instanceof FormData) {
      // For file uploads, remove Content-Type to let the browser set it
      delete options.headers['Content-Type'];
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
  }
  
  try {
    const response = await fetch(url, options);
    
    // Handle 401 unauthorized errors (token expired)
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      return { error: 'Authentication failed. Please log in again.' };
    }
    
    const result = await response.json();
    
    if (!response.ok) {
      return { error: result.detail || 'An error occurred', details: result };
    }
    
    return result;
  } catch (error) {
    console.error('API Request error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
};

// Auth API functions
export const authAPI = {
  login: async (username, password) => {
    const data = { username, password };
    const result = await apiRequest(`${AUTH_BASE_URL}/token/`, 'POST', data, false);
    
    if (result.token) {
      setToken(result.token);
      return { success: true, token: result.token };
    }
    
    return { success: false, error: result.error || 'Login failed' };
  },
  
  logout: async () => {
    await apiRequest(`${AUTH_BASE_URL}/logout/`, 'POST');
    removeToken();
    return { success: true };
  },
  
  getCurrentUser: async () => {
    return await apiRequest(`${AUTH_BASE_URL}/user/`);
  }
};

// User Profiles API
export const profilesAPI = {
  getAll: async () => {
    return await apiRequest('profiles/');
  },
  
  getById: async (id) => {
    return await apiRequest(`profiles/${id}/`);
  },
  
  create: async (profileData) => {
    return await apiRequest('profiles/', 'POST', profileData);
  },
  
  update: async (id, profileData) => {
    return await apiRequest(`profiles/${id}/`, 'PUT', profileData);
  },
  
  delete: async (id) => {
    return await apiRequest(`profiles/${id}/`, 'DELETE');
  },
  
  getSignatures: async (id) => {
    return await apiRequest(`profiles/${id}/signatures/`);
  },
  
  getVerifications: async (id) => {
    return await apiRequest(`profiles/${id}/verifications/`);
  }
};

// Signatures API
export const signaturesAPI = {
  getAll: async () => {
    return await apiRequest('signatures/');
  },
  
  getById: async (id) => {
    return await apiRequest(`signatures/${id}/`);
  },
  
  upload: async (profileId, imageFile, notes = '') => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('user_profile', profileId);
    
    if (notes) {
      formData.append('notes', notes);
    }
    
    return await apiRequest('signatures/', 'POST', formData);
  },
  
  delete: async (id) => {
    return await apiRequest(`signatures/${id}/`, 'DELETE');
  }
};

// Verification API
export const verificationAPI = {
  verify: async (profileId, signatureFile, saveToReferences = false, notes = '') => {
    const formData = new FormData();
    formData.append('user_profile_id', profileId);
    formData.append('test_signature', signatureFile);
    formData.append('save_to_references', saveToReferences);
    
    if (notes) {
      formData.append('notes', notes);
    }
    
    return await apiRequest('verify/', 'POST', formData);
  },
  
  getHistory: async () => {
    return await apiRequest('verification-records/');
  },
  
  getById: async (id) => {
    return await apiRequest(`verification-records/${id}/`);
  },
  
  addToReferences: async (id, notes = '') => {
    return await apiRequest(`verification-records/${id}/add_to_references/`, 'POST', { notes });
  }
};

export default {
  auth: authAPI,
  profiles: profilesAPI,
  signatures: signaturesAPI,
  verification: verificationAPI
};
// api.js
const API_BASE_URL = 'http://127.0.0.1:8000/api';
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

// Helper for handling token storage
const TOKEN_KEY = 'svs_auth_token';

// Token management
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Headers configuration with better CORS handling
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  
  return headers;
};

// Enhanced API request helper with better error handling
const apiRequest = async (endpoint, method = 'GET', data = null, includeToken = true) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint}`;
  
  const options = {
    method,
    headers: includeToken ? getHeaders() : { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include', // Important for CORS with credentials
  };
  
  if (data) {
    if (data instanceof FormData) {
      // For file uploads, remove Content-Type to let the browser set it
      delete options.headers['Content-Type'];
      
      // Log FormData contents for debugging (without file contents)
      console.log(`API Request: ${method} ${url} with FormData`);
      for (let [key, value] of data.entries()) {
        console.log(`- FormData field: ${key} = ${value instanceof File ? value.name : value}`);
      }
      
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
      console.log(`API Request: ${method} ${url}`, data);
    }
  } else {
    console.log(`API Request: ${method} ${url}`);
  }
  
  try {
    const response = await fetch(url, options);
    console.log(`API Response status: ${response.status} ${response.statusText}`);
    
    // Handle 401 unauthorized errors (token expired)
    if (response.status === 401) {
      console.log('Authentication error - clearing token');
      removeToken();
      return { error: 'Authentication failed. Please log in again.' };
    }
    
    // Get response text first
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    // Try to parse as JSON
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.warn('Response is not valid JSON');
      
      // For successful non-JSON responses (like 204 No Content)
      if (response.ok) {
        return { success: true };
      }
      
      return { 
        error: `Server returned status ${response.status} with non-JSON response`,
        rawResponse: responseText
      };
    }
    
    if (!response.ok) {
      console.error('API Error:', result);
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
    console.log('Uploading signature for profile:', profileId);
    console.log('File information:', {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size
    });
    
    const formData = new FormData();
    
    // Add image file - name must match Django model field
    formData.append('image', imageFile);
    
    // Match the exact field name from SignatureSerializer and models.py
    formData.append('user_profile', String(profileId));
    
    // Add notes if provided
    if (notes) {
      formData.append('notes', notes);
    }
    
    try {
      console.log(`Sending signature to API: ${imageFile.name} for profile ${profileId}`);
      const result = await apiRequest('signatures/', 'POST', formData);
      
      if (result.error) {
        console.error('Signature upload failed:', result.error);
        return { success: false, error: result.error };
      }
      
      console.log('Signature upload successful:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Exception during signature upload:', error);
      return { success: false, error: 'Upload failed - see console for details' };
    }
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
    
    try {
      console.log(`Sending verification request for profile ${profileId}`);
      const result = await apiRequest('verify/', 'POST', formData);
      
      if (result.error) {
        console.error('Verification request failed:', result.error);
        return { error: result.error || 'Verification failed' };
      }
      
      console.log('Verification completed successfully');
      return result;
    } catch (error) {
      console.error('Exception during verification request:', error);
      return { 
        error: 'Verification failed - server error', 
        details: error.message || 'Unknown error'
      };
    }
  },
  
  // Keep other methods unchanged
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
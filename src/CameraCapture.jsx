import React, { useState, useRef, useEffect } from 'react';
import './CameraCapture.css';

const CameraCapture = ({ onImageCaptured, onCancel }) => {
  // State variables
  const [cameraConnected, setCameraConnected] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [currentStream, setCurrentStream] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  
  // Cropping state
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [hasMoved, setHasMoved] = useState(false); // Track if user has dragged

  // Get available camera devices
  useEffect(() => {
    const getAvailableCameras = async () => {
      try {
        // First request general media permissions
        await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Available cameras:', videoDevices);
        setCameras(videoDevices);
        
        // Select the first camera by default
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting camera devices:', error);
        setError('Could not access cameras. Please check permissions.');
      }
    };
    
    getAvailableCameras();
  }, []);

  // Connect to selected camera
  useEffect(() => {
    const connectCamera = async () => {
      if (!selectedCamera) return;
      
      try {
        setError('');
        
        // Stop any existing stream
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }
        
        // Request new stream with selected device
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            deviceId: { exact: selectedCamera }
          },
          audio: false 
        });
        
        // Connect stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraConnected(true);
          setCurrentStream(stream);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Could not access the selected camera. Please try another or check permissions.");
        setCameraConnected(false);
      }
    };
    
    connectCamera();
    
    // Cleanup function
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedCamera]);

  // Count frames for animation purposes
  useEffect(() => {
    let frameTimer;
    if (cameraConnected) {
      frameTimer = setInterval(() => {
        setFrameCount(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(frameTimer);
  }, [cameraConnected]);

  // Handle camera selection change
  const handleCameraChange = (e) => {
    setSelectedCamera(e.target.value);
  };

  // Capture current frame from webcam
  const captureFrame = () => {
    if (!videoRef.current || !cameraConnected) {
      setError("Camera not connected");
      return;
    }
    
    try {
      const video = videoRef.current;
      
      // Create canvas if not exists
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageSrc = canvas.toDataURL('image/png');
      setCapturedImage(imageSrc);
      
      // Switch to cropping mode
      setShowCropper(true);
    } catch (err) {
      console.error("Error capturing frame:", err);
      setError("Error capturing image: " + err.message);
    }
  };
  
  // Initialize crop canvas when showing cropper
  useEffect(() => {
    if (showCropper && capturedImage && cropCanvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = cropCanvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
      };
      img.src = capturedImage;
    }
  }, [showCropper, capturedImage]);
  
  // Helper function to get coordinates from mouse or touch event
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Helper function to get accurate canvas coordinates accounting for objectFit: contain
  const getCanvasCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const coords = getEventCoordinates(e);
    
    // Get position relative to the displayed canvas element
    const displayX = coords.clientX - rect.left;
    const displayY = coords.clientY - rect.top;
    
    // Calculate how the image is actually displayed within the canvas with objectFit: contain
    const canvasAspectRatio = canvas.width / canvas.height;
    const displayAspectRatio = rect.width / rect.height;
    
    let imageDisplayWidth, imageDisplayHeight, imageOffsetX, imageOffsetY;
    
    if (canvasAspectRatio > displayAspectRatio) {
      // Image is wider than display area - letterboxed vertically
      imageDisplayWidth = rect.width;
      imageDisplayHeight = rect.width / canvasAspectRatio;
      imageOffsetX = 0;
      imageOffsetY = (rect.height - imageDisplayHeight) / 2;
    } else {
      // Image is taller than display area - pillarboxed horizontally  
      imageDisplayWidth = rect.height * canvasAspectRatio;
      imageDisplayHeight = rect.height;
      imageOffsetX = (rect.width - imageDisplayWidth) / 2;
      imageOffsetY = 0;
    }
    
    // Adjust coordinates to account for image offset
    const adjustedX = displayX - imageOffsetX;
    const adjustedY = displayY - imageOffsetY;
    
    // Check if click is within the actual image area
    if (adjustedX < 0 || adjustedY < 0 || adjustedX > imageDisplayWidth || adjustedY > imageDisplayHeight) {
      return null; // Click outside image area
    }
    
    // Calculate scale factors between actual canvas size and displayed image size
    const scaleX = canvas.width / imageDisplayWidth;
    const scaleY = canvas.height / imageDisplayHeight;
    
    // Convert to actual canvas coordinates
    const canvasX = adjustedX * scaleX;
    const canvasY = adjustedY * scaleY;
    
    return { x: canvasX, y: canvasY };
  };

  // Cropping handlers (work for both mouse and touch)
  const handleCropStart = (e) => {
    if (!cropCanvasRef.current) return;
    e.preventDefault(); // Prevent scrolling on touch
    
    const canvas = cropCanvasRef.current;
    const coords = getCanvasCoordinates(e, canvas);
    
    // Only start cropping if click is within image area
    if (coords) {
      // Check if there's an existing selection and user clicked outside it
      const hasExistingSelection = Math.abs(cropEnd.x - cropStart.x) > 5 && Math.abs(cropEnd.y - cropStart.y) > 5;
      
      if (hasExistingSelection) {
        // Check if click is inside existing selection
        const minX = Math.min(cropStart.x, cropEnd.x);
        const maxX = Math.max(cropStart.x, cropEnd.x);
        const minY = Math.min(cropStart.y, cropEnd.y);
        const maxY = Math.max(cropStart.y, cropEnd.y);
        
        const clickedInsideSelection = coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY;
        
        if (!clickedInsideSelection) {
          // Reset and start new selection
          setCropStart(coords);
          setCropEnd(coords);
          setIsCropping(true);
          setHasMoved(false);
          return;
        }
      }
      
      setCropStart(coords);
      setCropEnd(coords);
      setIsCropping(true);
      setHasMoved(false);
    }
  };
  
  const handleCropMove = (e) => {
    if (!isCropping || !cropCanvasRef.current) return;
    e.preventDefault(); // Prevent scrolling on touch
    
    const canvas = cropCanvasRef.current;
    const coords = getCanvasCoordinates(e, canvas);
    
    // Mark that user has moved (dragged)
    setHasMoved(true);
    
    // Continue cropping even if mouse moves outside image area, but clamp coordinates
    if (coords) {
      setCropEnd(coords);
    } else {
      // Clamp to image boundaries
      const clampedX = Math.max(0, Math.min(canvas.width, cropEnd.x));
      const clampedY = Math.max(0, Math.min(canvas.height, cropEnd.y));
      
      setCropEnd({ x: clampedX, y: clampedY });
    }
    redrawCropCanvas();
  };
  
  const handleCropEnd = (e) => {
    if (!isCropping) return;
    e.preventDefault(); // Prevent scrolling on touch
    
    // If user didn't drag (just clicked), reset selection
    if (!hasMoved) {
      const hasExistingSelection = Math.abs(cropEnd.x - cropStart.x) > 5 && Math.abs(cropEnd.y - cropStart.y) > 5;
      
      if (hasExistingSelection) {
        // Reset the selection
        setCropStart({ x: 0, y: 0 });
        setCropEnd({ x: 0, y: 0 });
        // Redraw canvas to clear selection
        if (cropCanvasRef.current && capturedImage) {
          const canvas = cropCanvasRef.current;
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = capturedImage;
        }
      }
    }
    
    setIsCropping(false);
    setHasMoved(false);
    redrawCropCanvas();
  };
  
  // Reset crop selection
  const handleResetCrop = () => {
    setCropStart({ x: 0, y: 0 });
    setCropEnd({ x: 0, y: 0 });
    setIsCropping(false);
    setHasMoved(false);
    
    // Redraw canvas to clear selection
    if (cropCanvasRef.current && capturedImage) {
      const canvas = cropCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = capturedImage;
    }
  };
  
  const redrawCropCanvas = () => {
    if (!cropCanvasRef.current || !capturedImage) return;
    
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear and redraw
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Draw selection rectangle
      if (cropStart.x !== cropEnd.x || cropStart.y !== cropEnd.y) {
        ctx.strokeStyle = '#0dd3c5';
        ctx.lineWidth = Math.max(2, canvas.width / 400); // Scale line width with canvas size
        
        const width = cropEnd.x - cropStart.x;
        const height = cropEnd.y - cropStart.y;
        
        ctx.strokeRect(cropStart.x, cropStart.y, width, height);
        
        // Draw size indicator with proper scaling
        ctx.fillStyle = 'rgba(13, 211, 197, 0.9)';
        ctx.fillRect(cropStart.x, cropStart.y - 25, Math.abs(width), 20);
        
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(12, canvas.width / 80)}px Arial`;
        const text = `${Math.abs(Math.round(width))} × ${Math.abs(Math.round(height))}`;
        const textWidth = ctx.measureText(text).width;
        const textX = cropStart.x + Math.abs(width)/2 - textWidth/2;
        const textY = cropStart.y - 8;
        ctx.fillText(text, textX, textY);
      }
    };
    img.src = capturedImage;
  };
  
  // Process crop selection
  const handleCrop = () => {
    if (!cropCanvasRef.current) return;
    setProcessing(true);
    
    const canvas = cropCanvasRef.current;
    
    // Get crop dimensions
    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    
    // Validate crop area
    if (width < 10 || height < 10) {
      setError('Crop area too small, please select a larger area.');
      setProcessing(false);
      return;
    }
    
    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width;
    cropCanvas.height = height;
    
    // Draw cropped area to new canvas
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    
    // Return the original cropped image without additional processing
    // The server will handle appropriate preprocessing
    const processedImage = cropCanvas.toDataURL('image/png');
    
    // Convert data URL to file
    fetch(processedImage)
      .then(res => res.blob())
      .then(blob => {
        const filename = `signature_cropped_${Date.now()}.png`;
        const file = new File([blob], filename, { type: 'image/png' });
        
        if (onImageCaptured) {
          onImageCaptured(file);
        }
        
        setProcessing(false);
      })
      .catch(err => {
        console.error("Error creating file from canvas:", err);
        setError("Error processing image: " + err.message);
        setProcessing(false);
      });
  };

  // Skip cropping
  const handleSkipCrop = () => {
    if (!capturedImage) {
      setError("No image captured");
      return;
    }
    
    setProcessing(true);
    
    // Convert data URL to file
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const filename = `signature_full_${Date.now()}.png`;
        const file = new File([blob], filename, { type: 'image/png' });
        
        if (onImageCaptured) {
          onImageCaptured(file);
        }
        
        setProcessing(false);
      })
      .catch(err => {
        console.error("Error creating file from image:", err);
        setError("Error processing image: " + err.message);
        setProcessing(false);
      });
  };

  // Handle file upload as fallback
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        setShowCropper(true);
      };
      
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="camera-capture-container" style={{
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderRadius: '8px',
      color: 'white',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!showCropper ? (
        <div className="camera-view-container" style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5px 10px',
            backgroundColor: 'rgba(13, 211, 197, 0.1)',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#0dd3c5' }}>Live Stream - Click "Capture" when ready</span>
            {cameraConnected && (
              <span style={{
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '2px 6px',
                borderRadius: '10px',
                color: '#0dd3c5'
              }}>
                {frameCount}s
              </span>
            )}
          </div>
          
          {/* Camera selection dropdown */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '5px', 
              color: '#0dd3c5', 
              fontSize: '0.9rem' 
            }}>
              Select Camera:
            </label>
            <select 
              value={selectedCamera} 
              onChange={handleCameraChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(31, 41, 55, 0.6)',
                border: '1px solid #374151',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.9rem'
              }}
            >
              {cameras.length === 0 && (
                <option value="">No cameras found</option>
              )}
              {cameras.map(camera => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '300px',
            backgroundColor: '#000',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <button 
              onClick={captureFrame}
              style={{
                backgroundColor: '#0dd3c5',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture
            </button>
            
            <button 
              onClick={onCancel}
              style={{
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Cancel
            </button>
          </div>
          
          {/* File upload fallback */}
          {error && (
            <div style={{
              marginTop: '10px',
              padding: '15px',
              backgroundColor: 'rgba(31, 41, 55, 0.8)',
              border: '1px dashed #4b5563',
              borderRadius: '4px'
            }}>
              <div style={{
                padding: '10px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderRadius: '4px',
                color: '#ff4d4d',
                marginBottom: '10px'
              }}>
                {error}
              </div>
              
              <p style={{ marginTop: '10px', color: '#9ca3af' }}>
                You can upload an image from your device instead:
              </p>
              
              <div style={{
                padding: '15px 10px',
                backgroundColor: 'rgba(13, 211, 197, 0.1)',
                borderRadius: '4px',
                textAlign: 'center',
                cursor: 'pointer',
                marginTop: '10px',
                border: '1px dashed rgba(13, 211, 197, 0.5)'
              }}
              onClick={() => document.getElementById('file-upload-fallback').click()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#0dd3c5" style={{ width: '24px', height: '24px', margin: '0 auto 10px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                </svg>
                <div style={{ color: '#0dd3c5' }}>Click to browse files</div>
                <input 
                  id="file-upload-fallback"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '10px',
            backgroundColor: 'rgba(13, 211, 197, 0.1)',
            borderRadius: '4px',
            textAlign: 'center',
            marginBottom: '10px',
            color: '#0dd3c5',
            fontWeight: 'bold'
          }}>
            Draw a rectangle around the signature • Click anywhere to reset selection
          </div>
          
          <div style={{ flex: 1, position: 'relative', minHeight: '250px', marginBottom: '10px' }}>
            <canvas 
              ref={cropCanvasRef} 
              style={{
                width: '100%',
                borderRadius: '4px',
                backgroundColor: '#000',
                cursor: isCropping ? 'crosshair' : 'crosshair',
                maxHeight: '350px',
                objectFit: 'contain',
                touchAction: 'none', // Prevent default touch behaviors
                border: '2px solid rgba(13, 211, 197, 0.3)' // Add border to show canvas boundaries
              }}
              onMouseDown={handleCropStart}
              onMouseMove={handleCropMove}
              onMouseUp={handleCropEnd}
              onMouseLeave={handleCropEnd}
              onTouchStart={handleCropStart}
              onTouchMove={handleCropMove}
              onTouchEnd={handleCropEnd}
            />
            
            {/* Show crop dimensions overlay */}
            {(Math.abs(cropEnd.x - cropStart.x) > 5 && Math.abs(cropEnd.y - cropStart.y) > 5) && (
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#0dd3c5',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                pointerEvents: 'none',
                border: '1px solid rgba(13, 211, 197, 0.3)'
              }}>
                Selection: {Math.abs(Math.round(cropEnd.x - cropStart.x))} × {Math.abs(Math.round(cropEnd.y - cropStart.y))} px
              </div>
            )}
            
            {/* Instructions overlay */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#0dd3c5',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              pointerEvents: 'none',
              border: '1px solid rgba(13, 211, 197, 0.3)',
              maxWidth: '200px'
            }}>
              {(Math.abs(cropEnd.x - cropStart.x) > 5 && Math.abs(cropEnd.y - cropStart.y) > 5) ? 
                'Click anywhere to reset selection' : 
                'Click and drag to select area'
              }
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginBottom: '15px',
            position: 'relative',
            zIndex: 5
          }}>
            <button 
              onClick={handleCrop} 
              disabled={processing}
              style={{
                backgroundColor: processing ? 'rgba(13, 211, 197, 0.5)' : '#0dd3c5',
                color: processing ? 'rgba(0, 0, 0, 0.7)' : '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              {processing ? (
                <>
                  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Crop & Use
                </>
              )}
            </button>
            
            <button 
              onClick={handleResetCrop} 
              disabled={processing}
              style={{
                backgroundColor: 'transparent',
                color: '#0dd3c5',
                border: '1px solid rgba(13, 211, 197, 0.5)',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                opacity: processing ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
            
            <button 
              onClick={handleSkipCrop} 
              disabled={processing}
              style={{
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                opacity: processing ? 0.7 : 1
              }}
            >
              Use Without Cropping
            </button>
            
            <button 
              onClick={onCancel} 
              disabled={processing}
              style={{
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #4b5563',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                opacity: processing ? 0.7 : 1
              }}
            >
              Cancel
            </button>
          </div>
          
          {processing && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: 'rgba(13, 211, 197, 0.1)', 
              color: '#0dd3c5',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing signature image...
            </div>
          )}
          
          <div style={{ 
            marginTop: 'auto',
            padding: '10px', 
            backgroundColor: 'rgba(13, 211, 197, 0.1)', 
            color: '#9ca3af',
            borderRadius: '4px',
            fontSize: '0.85rem' 
          }}>
            <p style={{ color: '#0dd3c5', marginBottom: '5px', fontWeight: 'bold' }}>Note:</p>
            <p>The image will be automatically converted to black and white by the server 
              during verification. You'll see both the original and processed versions in the results.</p>
          </div>
          
          {error && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              borderRadius: '4px',
              color: '#ff4d4d'
            }}>
              {error}
            </div>
          )}
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

export default CameraCapture;
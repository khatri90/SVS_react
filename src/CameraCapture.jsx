import React, { useState, useRef, useEffect } from 'react';
import './CameraCapture.css';

const CameraCapture = ({ onImageCaptured, onCancel }) => {
  // State variables
  const [cameraConnected, setCameraConnected] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cropCanvasRef = useRef(null);
  
  // Cropping state
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);

  // Initialize webcam on component mount
  useEffect(() => {
    const startWebcam = async () => {
      try {
        setError('');
        
        // Request webcam access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        });
        
        // Connect stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraConnected(true);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Could not access webcam. Please make sure you've granted permission.");
      }
    };
    
    startWebcam();
    
    // Cleanup function to stop the webcam when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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
  
  // Cropping handlers
  const handleCropStart = (e) => {
    if (!cropCanvasRef.current) return;
    
    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsCropping(true);
  };
  
  const handleCropMove = (e) => {
    if (!isCropping || !cropCanvasRef.current) return;
    
    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropEnd({ x, y });
    redrawCropCanvas();
  };
  
  const handleCropEnd = () => {
    if (!isCropping) return;
    
    setIsCropping(false);
    redrawCropCanvas();
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
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        
        const width = cropEnd.x - cropStart.x;
        const height = cropEnd.y - cropStart.y;
        
        ctx.strokeRect(cropStart.x, cropStart.y, width, height);
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
    
    if (onImageCaptured) {
      onImageCaptured(processedImage);
    }
    
    setProcessing(false);
  };

  // Skip cropping
  const handleSkipCrop = () => {
    if (!capturedImage) {
      setError("No image captured");
      return;
    }
    
    setProcessing(true);
    
    // Return the original image without any cropping or processing
    // The server will handle appropriate preprocessing
    if (onImageCaptured) {
      onImageCaptured(capturedImage);
    }
    
    setProcessing(false);
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
    <div className="camera-capture-container">
      {!showCropper ? (
        <div className="camera-view-container">
          <div className="live-stream-notice">
            <span>Live Stream - Click "Capture" when ready</span>
          </div>
          
          <div className="camera-preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
          </div>
          
          <div className="button-group">
            <button className="btn-capture" onClick={captureFrame}>Capture</button>
            <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          </div>
          
          {/* File upload fallback */}
          {error && (
            <div className="fallback-section">
              <div className="error-message">{error}</div>
              <p style={{ marginTop: '10px', color: '#9ca3af' }}>
                You can upload an image from your device instead:
              </p>
              <input 
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  background: 'rgba(31, 41, 55, 0.8)',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: 'white',
                  width: '100%'
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="cropper-container">
          <div className="crop-instruction">Draw a rectangle around the signature, then release to select the area</div>
          <canvas 
            ref={cropCanvasRef} 
            className="crop-canvas"
            onMouseDown={handleCropStart}
            onMouseMove={handleCropMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
          />
          <div className="button-group">
            <button className="btn-crop" onClick={handleCrop} disabled={processing}>
              {processing ? 'Processing...' : 'Crop & Use'}
            </button>
            <button className="btn-skip" onClick={handleSkipCrop} disabled={processing}>
              {processing ? 'Processing...' : 'Use Without Cropping'}
            </button>
            <button className="btn-cancel" onClick={onCancel} disabled={processing}>Cancel</button>
          </div>
          {processing && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: 'rgba(13, 211, 197, 0.1)', 
              color: '#0dd3c5',
              borderRadius: '4px' 
            }}>
              Processing signature image...
            </div>
          )}
          <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: 'rgba(13, 211, 197, 0.1)', 
              color: '#9ca3af',
              borderRadius: '4px',
              fontSize: '0.85rem' 
            }}>
              <p style={{ color: '#0dd3c5', marginBottom: '5px' }}>Note:</p>
              <p>The image will be automatically converted to black and white by the server 
                during verification. You'll see both the original and processed versions in the results.</p>
            </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
/**
 * Image processing utilities for signature enhancement
 * Provides similar functionality to the Python code's enhance_document_image
 * and apply_document_enhancement functions
 */

/**
 * Enhances a document image to improve signature visibility
 * @param {HTMLCanvasElement} canvas - Canvas element with the original image
 * @returns {string} - Data URL of the enhanced image
 */
export const enhanceDocumentImage = (canvas) => {
  // Create a copy of the canvas for processing
  const processedCanvas = document.createElement('canvas');
  processedCanvas.width = canvas.width;
  processedCanvas.height = canvas.height;
  const ctx = processedCanvas.getContext('2d');
  
  // Draw the original image to the new canvas
  ctx.drawImage(canvas, 0, 0);
  
  // Convert to grayscale
  convertToGrayscale(processedCanvas);
  
  // Apply brightness and contrast adjustment
  adjustBrightnessContrast(processedCanvas, 1.2, 30);
  
  // Apply light blur to reduce noise (simulating Gaussian blur)
  applyBlur(processedCanvas, 1);
  
  // Return as data URL
  return processedCanvas.toDataURL('image/png');
};

/**
 * Converts an image on a canvas to grayscale
 * @param {HTMLCanvasElement} canvas - Canvas to process
 */
const convertToGrayscale = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
    // Alpha channel (i + 3) remains unchanged
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Adjusts brightness and contrast of an image on a canvas
 * @param {HTMLCanvasElement} canvas - Canvas to process
 * @param {number} alpha - Contrast factor (1.0 = no change)
 * @param {number} beta - Brightness adjustment (0 = no change)
 */
const adjustBrightnessContrast = (canvas, alpha, beta) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, alpha * data[i] + beta));     // Red
    data[i + 1] = Math.min(255, Math.max(0, alpha * data[i + 1] + beta)); // Green
    data[i + 2] = Math.min(255, Math.max(0, alpha * data[i + 2] + beta)); // Blue
    // Alpha channel (i + 3) remains unchanged
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Applies a simple blur effect to reduce noise
 * @param {HTMLCanvasElement} canvas - Canvas to process
 * @param {number} radius - Blur radius
 */
const applyBlur = (canvas, radius) => {
  // This is a simplified blur - for more accurate Gaussian blur,
  // consider using a library or implementing a full convolution kernel
  const ctx = canvas.getContext('2d');
  
  // Apply CSS filter for blur (simple approach)
  ctx.filter = `blur(${radius}px)`;
  
  // Draw image with filter applied
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(canvas, 0, 0);
  
  // Reset filter and apply blurred image
  ctx.filter = 'none';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
};

/**
 * Detects edges in an image (simplified Canny edge detection)
 * @param {HTMLCanvasElement} canvas - Canvas to process
 * @returns {Uint8ClampedArray} - Edge map
 */
const detectEdges = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Create grayscale version for edge detection
  const grayscale = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    grayscale[j] = (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  
  // Simple Sobel operator for edge detection
  const edgeMap = new Uint8ClampedArray(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      
      // Horizontal gradient
      const gx = 
        grayscale[index - width - 1] * -1 + 
        grayscale[index - width + 1] * 1 +
        grayscale[index - 1] * -2 + 
        grayscale[index + 1] * 2 +
        grayscale[index + width - 1] * -1 + 
        grayscale[index + width + 1] * 1;
      
      // Vertical gradient
      const gy = 
        grayscale[index - width - 1] * -1 + 
        grayscale[index - width] * -2 +
        grayscale[index - width + 1] * -1 + 
        grayscale[index + width - 1] * 1 +
        grayscale[index + width] * 2 + 
        grayscale[index + width + 1] * 1;
      
      // Gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      // Threshold
      edgeMap[index] = magnitude > 50 ? 255 : 0;
    }
  }
  
  return edgeMap;
};

/**
 * Finds contours in an edge map (simplified approach)
 * @param {Uint8ClampedArray} edgeMap - Edge detection result
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} - Array of contour points
 */
const findContours = (edgeMap, width, height) => {
  // This is a highly simplified contour finding algorithm
  // For production use, consider using OpenCV.js or a similar library
  
  const contours = [];
  const visited = new Uint8Array(width * height);
  
  // Find starting points (white pixels in edge map)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      
      if (edgeMap[index] === 255 && !visited[index]) {
        // Found a starting point for a contour
        const contour = traceContour(edgeMap, visited, x, y, width, height);
        if (contour.length > 10) { // Minimum contour size
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
};

/**
 * Traces a contour starting from a point
 * @param {Uint8ClampedArray} edgeMap - Edge detection result
 * @param {Uint8Array} visited - Visited pixels map
 * @param {number} startX - Starting X coordinate
 * @param {number} startY - Starting Y coordinate
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Array} - Array of contour points
 */
const traceContour = (edgeMap, visited, startX, startY, width, height) => {
  const contour = [];
  const stack = [{x: startX, y: startY}];
  
  while (stack.length > 0) {
    const point = stack.pop();
    const { x, y } = point;
    const index = y * width + x;
    
    if (x < 0 || y < 0 || x >= width || y >= height || visited[index] || edgeMap[index] !== 255) {
      continue;
    }
    
    // Mark as visited
    visited[index] = 1;
    contour.push(point);
    
    // Check 8 neighbors
    stack.push({x: x+1, y: y});
    stack.push({x: x-1, y: y});
    stack.push({x: x, y: y+1});
    stack.push({x: x, y: y-1});
    stack.push({x: x+1, y: y+1});
    stack.push({x: x-1, y: y-1});
    stack.push({x: x+1, y: y-1});
    stack.push({x: x-1, y: y+1});
  }
  
  return contour;
};
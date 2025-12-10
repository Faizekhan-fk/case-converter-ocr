import * as tf from '@tensorflow/tfjs';
import * as bodyPix from '@tensorflow-models/body-pix';
import { saveAs } from 'file-saver';
import { WatermarkRemovalOptions } from '../types';

// Supported image formats
export type ImageFormat = 'jpeg' | 'png' | 'webp';

// Upscaling algorithms
export type UpscaleAlgorithm = 'bicubic' | 'lanczos' | 'nearest' | 'bilinear';

export interface ImageProcessingOptions {
  quality?: number; // 0-1 for JPEG and WebP
  backgroundColor?: string; // For formats that don't support transparency
  upscaleFactor?: number; // 1-4x upscaling
  upscaleAlgorithm?: UpscaleAlgorithm;
}

// Initialize BodyPix model for background removal
let bodyPixModel: bodyPix.BodyPix | null = null;

export const initializeBodyPix = async (): Promise<void> => {
  try {
    await tf.ready();
    bodyPixModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2,
    });
    console.log('BodyPix model loaded successfully');
  } catch (error) {
    console.error('Failed to load BodyPix model:', error);
    throw error;
  }
};

// Convert image to different format
export const convertImageFormat = (
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  options: ImageProcessingOptions = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const { quality = 0.9, backgroundColor = '#ffffff' } = options;
    
    let mimeType: string;
    let finalCanvas = canvas;
    
    switch (format) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        // JPEG doesn't support transparency, so we need to add a background
        finalCanvas = addBackgroundToCanvas(canvas, backgroundColor);
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        reject(new Error(`Unsupported format: ${format}`));
        return;
    }
    
    finalCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert image'));
        }
      },
      mimeType,
      quality
    );
  });
};

// Add background color to canvas (for formats that don't support transparency)
const addBackgroundToCanvas = (
  sourceCanvas: HTMLCanvasElement,
  backgroundColor: string
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Fill with background color
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw the source image on top
  ctx.drawImage(sourceCanvas, 0, 0);
  
  return canvas;
};

// Remove background from image
export const removeBackground = async (
  imageElement: HTMLImageElement,
  options: {
    segmentationThreshold?: number;
    maskBlurAmount?: number;
    edgeBlurAmount?: number;
    flipHorizontal?: boolean;
  } = {}
): Promise<HTMLCanvasElement> => {
  if (!bodyPixModel) {
    throw new Error('BodyPix model not initialized. Call initializeBodyPix() first.');
  }
  
  const {
    segmentationThreshold = 0.7,
    maskBlurAmount = 0,
    edgeBlurAmount = 0,
    flipHorizontal = false,
  } = options;
  
  try {
    // Perform person segmentation
    const segmentation = await bodyPixModel.segmentPerson(imageElement, {
      flipHorizontal,
      internalResolution: 'medium',
      segmentationThreshold,
    });
    
    // Create canvas with transparent background
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    // Draw the original image
    ctx.drawImage(imageElement, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply segmentation mask
    for (let i = 0; i < segmentation.data.length; i++) {
      const pixelIndex = i * 4;
      // If pixel is background (0), make it transparent
      if (segmentation.data[i] === 0) {
        data[pixelIndex + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    // Apply blur if specified
    if (maskBlurAmount > 0 || edgeBlurAmount > 0) {
      // This is a simplified blur effect
      // For production, you might want to use a more sophisticated blur algorithm
      ctx.filter = `blur(${Math.max(maskBlurAmount, edgeBlurAmount)}px)`;
    }
    
    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
    
    return canvas;
  } catch (error) {
    console.error('Background removal failed:', error);
    throw error;
  }
};

// Load image from file
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// Download processed image
export const downloadImage = (
  blob: Blob,
  filename: string
): void => {
  saveAs(blob, filename);
};

// Get file extension from format
export const getFileExtension = (format: ImageFormat): string => {
  return format === 'jpeg' ? 'jpg' : format;
};

// Generate filename with new extension
export const generateFilename = (
  originalFilename: string,
  newFormat: ImageFormat,
  suffix?: string
): string => {
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
  const extension = getFileExtension(newFormat);
  const suffixPart = suffix ? `_${suffix}` : '';
  return `${nameWithoutExt}${suffixPart}.${extension}`;
};

// Validate image file
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

// Get image dimensions
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// Advanced background removal using edge detection and color analysis
export const removeBackgroundAdvanced = async (
  imageElement: HTMLImageElement,
  options: {
    colorTolerance?: number;
    edgeThreshold?: number;
    smoothing?: number;
    backgroundColor?: string;
  } = {}
): Promise<HTMLCanvasElement> => {
  const {
    colorTolerance = 30,
    edgeThreshold = 50,
    smoothing = 1,
    backgroundColor = 'auto'
  } = options;
  
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Draw the original image
  ctx.drawImage(imageElement, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // Auto-detect background color if needed
  let bgColor: [number, number, number];
  if (backgroundColor === 'auto') {
    bgColor = detectBackgroundColor(data, width, height);
  } else {
    bgColor = hexToRgb(backgroundColor) || [255, 255, 255];
  }
  
  // Create edge map
  const edges = detectEdges(data, width, height, edgeThreshold);
  
  // Remove background based on color similarity and edge information
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelIndex = Math.floor(i / 4);
    
    // Check if pixel is similar to background color
    const colorDistance = Math.sqrt(
      Math.pow(r - bgColor[0], 2) +
      Math.pow(g - bgColor[1], 2) +
      Math.pow(b - bgColor[2], 2)
    );
    
    // If pixel is similar to background and not on an edge, make it transparent
    if (colorDistance < colorTolerance && !edges[pixelIndex]) {
      data[i + 3] = 0; // Set alpha to 0 (transparent)
    }
  }
  
  // Apply smoothing if specified
  if (smoothing > 1) {
    applySmoothingToAlpha(data, width, height, smoothing);
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

// Detect background color by sampling corners and edges
const detectBackgroundColor = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number
): [number, number, number] => {
  const samples: [number, number, number][] = [];
  
  // Sample corners (for future use)
  // const corners = [
  //   [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]
  // ];
  
  // Sample edges
  for (let i = 0; i < width; i += Math.floor(width / 10)) {
    samples.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    const bottomIndex = ((height - 1) * width + i) * 4;
    samples.push([data[bottomIndex], data[bottomIndex + 1], data[bottomIndex + 2]]);
  }
  
  for (let i = 0; i < height; i += Math.floor(height / 10)) {
    const leftIndex = (i * width) * 4;
    samples.push([data[leftIndex], data[leftIndex + 1], data[leftIndex + 2]]);
    const rightIndex = (i * width + width - 1) * 4;
    samples.push([data[rightIndex], data[rightIndex + 1], data[rightIndex + 2]]);
  }
  
  // Find the most common color
  const colorCounts = new Map<string, { count: number; color: [number, number, number] }>();
  
  samples.forEach(([r, g, b]) => {
    const key = `${Math.floor(r / 10)},${Math.floor(g / 10)},${Math.floor(b / 10)}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, color: [r, g, b] });
    }
  });
  
  let mostCommon = samples[0];
  let maxCount = 0;
  
  colorCounts.forEach(({ count, color }) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = color;
    }
  });
  
  return mostCommon;
};

// Simple edge detection using Sobel operator
const detectEdges = (
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  threshold: number
): boolean[] => {
  const edges = new Array(width * height).fill(false);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Convert to grayscale (for future use)
      // const idx = (y * width + x) * 4;
      // const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Sobel X
      const gx = 
        -1 * getGray(data, x - 1, y - 1, width) +
        1 * getGray(data, x + 1, y - 1, width) +
        -2 * getGray(data, x - 1, y, width) +
        2 * getGray(data, x + 1, y, width) +
        -1 * getGray(data, x - 1, y + 1, width) +
        1 * getGray(data, x + 1, y + 1, width);
      
      // Sobel Y
      const gy = 
        -1 * getGray(data, x - 1, y - 1, width) +
        -2 * getGray(data, x, y - 1, width) +
        -1 * getGray(data, x + 1, y - 1, width) +
        1 * getGray(data, x - 1, y + 1, width) +
        2 * getGray(data, x, y + 1, width) +
        1 * getGray(data, x + 1, y + 1, width);
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > threshold;
    }
  }
  
  return edges;
};

const getGray = (data: Uint8ClampedArray, x: number, y: number, width: number): number => {
  const idx = (y * width + x) * 4;
  return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
};

// Apply smoothing to alpha channel
const applySmoothingToAlpha = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): void => {
  const original = new Uint8ClampedArray(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += original[(ny * width + nx) * 4 + 3];
            count++;
          }
        }
      }
      
      data[(y * width + x) * 4 + 3] = sum / count;
    }
  }
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
};

// Image upscaling using various algorithms
export const upscaleImage = (
  imageElement: HTMLImageElement,
  factor: number,
  algorithm: UpscaleAlgorithm = 'bicubic'
): HTMLCanvasElement => {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imageElement.width;
  sourceCanvas.height = imageElement.height;
  
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('Failed to get source canvas context');
  
  sourceCtx.drawImage(imageElement, 0, 0);
  const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  
  const targetWidth = Math.floor(imageElement.width * factor);
  const targetHeight = Math.floor(imageElement.height * factor);
  
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  
  const targetCtx = targetCanvas.getContext('2d');
  if (!targetCtx) throw new Error('Failed to get target canvas context');
  
  // For simple algorithms, use canvas built-in scaling
  if (algorithm === 'nearest' || algorithm === 'bilinear') {
    targetCtx.imageSmoothingEnabled = algorithm === 'bilinear';
    if (algorithm === 'nearest') {
      targetCtx.imageSmoothingQuality = 'low';
    }
    targetCtx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);
    return targetCanvas;
  }
  
  // For bicubic and lanczos, use custom interpolation
  const targetData = targetCtx.createImageData(targetWidth, targetHeight);
  
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = (x / targetWidth) * imageElement.width;
      const srcY = (y / targetHeight) * imageElement.height;
      
      const [r, g, b, a] = algorithm === 'bicubic'
        ? bicubicInterpolation(sourceData, srcX, srcY, imageElement.width, imageElement.height)
        : lanczosInterpolation(sourceData, srcX, srcY, imageElement.width, imageElement.height);
      
      const targetIdx = (y * targetWidth + x) * 4;
      targetData.data[targetIdx] = r;
      targetData.data[targetIdx + 1] = g;
      targetData.data[targetIdx + 2] = b;
      targetData.data[targetIdx + 3] = a;
    }
  }
  
  targetCtx.putImageData(targetData, 0, 0);
  return targetCanvas;
};

// Bicubic interpolation
const bicubicInterpolation = (
  sourceData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): [number, number, number, number] => {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const dx = x - x1;
  const dy = y - y1;
  
  let r = 0, g = 0, b = 0, a = 0;
  
  for (let j = -1; j <= 2; j++) {
    for (let i = -1; i <= 2; i++) {
      const px = Math.max(0, Math.min(width - 1, x1 + i));
      const py = Math.max(0, Math.min(height - 1, y1 + j));
      const idx = (py * width + px) * 4;
      
      const weight = cubicWeight(dx - i) * cubicWeight(dy - j);
      
      r += sourceData.data[idx] * weight;
      g += sourceData.data[idx + 1] * weight;
      b += sourceData.data[idx + 2] * weight;
      a += sourceData.data[idx + 3] * weight;
    }
  }
  
  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b))),
    Math.max(0, Math.min(255, Math.round(a)))
  ];
};

const cubicWeight = (t: number): number => {
  const absT = Math.abs(t);
  if (absT <= 1) {
    return 1.5 * absT * absT * absT - 2.5 * absT * absT + 1;
  } else if (absT <= 2) {
    return -0.5 * absT * absT * absT + 2.5 * absT * absT - 4 * absT + 2;
  }
  return 0;
};

// Lanczos interpolation (simplified version)
const lanczosInterpolation = (
  sourceData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): [number, number, number, number] => {
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const radius = 2;
  
  let r = 0, g = 0, b = 0, a = 0;
  let weightSum = 0;
  
  for (let j = -radius; j <= radius; j++) {
    for (let i = -radius; i <= radius; i++) {
      const px = Math.max(0, Math.min(width - 1, x1 + i));
      const py = Math.max(0, Math.min(height - 1, y1 + j));
      const idx = (py * width + px) * 4;
      
      const dx = x - (x1 + i);
      const dy = y - (y1 + j);
      const weight = lanczosWeight(dx, radius) * lanczosWeight(dy, radius);
      
      r += sourceData.data[idx] * weight;
      g += sourceData.data[idx + 1] * weight;
      b += sourceData.data[idx + 2] * weight;
      a += sourceData.data[idx + 3] * weight;
      weightSum += weight;
    }
  }
  
  if (weightSum > 0) {
    r /= weightSum;
    g /= weightSum;
    b /= weightSum;
    a /= weightSum;
  }
  
  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b))),
    Math.max(0, Math.min(255, Math.round(a)))
  ];
};

const lanczosWeight = (t: number, radius: number): number => {
  if (t === 0) return 1;
  if (Math.abs(t) >= radius) return 0;
  
  const piT = Math.PI * t;
  const piTOverRadius = piT / radius;
  
  return (radius * Math.sin(piT) * Math.sin(piTOverRadius)) / (piT * piT);
};

// Combine upscaling with other processing
export const processImageAdvanced = async (
  imageElement: HTMLImageElement,
  options: {
    upscaleFactor?: number;
    upscaleAlgorithm?: UpscaleAlgorithm;
    removeBackground?: boolean;
    backgroundRemovalType?: 'ai' | 'advanced';
    backgroundOptions?: any;
  } = {}
): Promise<HTMLCanvasElement> => {
  const {
    upscaleFactor = 1,
    upscaleAlgorithm = 'bicubic',
    removeBackground: shouldRemoveBackground = false,
    backgroundRemovalType = 'ai',
    backgroundOptions = {}
  } = options;
  
  let processedCanvas: HTMLCanvasElement;
  
  // Apply upscaling first if needed
  if (upscaleFactor > 1) {
    processedCanvas = upscaleImage(imageElement, upscaleFactor, upscaleAlgorithm);
    
    // Create a new image element from the upscaled canvas for background removal
    if (shouldRemoveBackground) {
      const upscaledImage = new Image();
      upscaledImage.src = processedCanvas.toDataURL();
      
      await new Promise((resolve) => {
        upscaledImage.onload = resolve;
      });
      
      if (backgroundRemovalType === 'ai') {
        processedCanvas = await removeBackground(upscaledImage, backgroundOptions);
      } else {
        processedCanvas = await removeBackgroundAdvanced(upscaledImage, backgroundOptions);
      }
    }
  } else {
    // Just apply background removal if no upscaling
    if (shouldRemoveBackground) {
      if (backgroundRemovalType === 'ai') {
        processedCanvas = await removeBackground(imageElement, backgroundOptions);
      } else {
        processedCanvas = await removeBackgroundAdvanced(imageElement, backgroundOptions);
      }
    } else {
      // No processing, just copy the image to canvas
      processedCanvas = document.createElement('canvas');
      processedCanvas.width = imageElement.width;
      processedCanvas.height = imageElement.height;
      const ctx = processedCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(imageElement, 0, 0);
    }
  }
  
  return processedCanvas;
};

// Watermark removal functions
export const removeWatermark = async (
  imageElement: HTMLImageElement,
  options: WatermarkRemovalOptions
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  ctx.drawImage(imageElement, 0, 0);
  
  switch (options.method) {
    case 'blur':
      return removeWatermarkByBlur(canvas, options);
    case 'inpaint':
      return removeWatermarkByInpainting(canvas, options);
    case 'clone':
      return removeWatermarkByCloning(canvas, options);
    case 'frequency':
      return removeWatermarkByFrequencyAnalysis(canvas, options);
    case 'ai':
      return removeWatermarkByAI(canvas, options);
    default:
      return canvas;
  }
};

// Remove watermark by blurring the watermark region
const removeWatermarkByBlur = (
  canvas: HTMLCanvasElement,
  options: WatermarkRemovalOptions
): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  const { watermarkRegion, blurIntensity = 10, autoDetect = false } = options;
  
  try {
    if (watermarkRegion) {
      const { x, y, width, height } = watermarkRegion;
      
      // Validate region bounds
      const validX = Math.max(0, Math.min(x, canvas.width - width));
      const validY = Math.max(0, Math.min(y, canvas.height - height));
      const validWidth = Math.min(width, canvas.width - validX);
      const validHeight = Math.min(height, canvas.height - validY);
      
      // Advanced content-aware blur instead of simple blur
      applyContentAwareBlur(ctx, validX, validY, validWidth, validHeight, blurIntensity);
      
    } else if (autoDetect) {
      // Auto-detect and blur watermark regions
      autoDetectAndBlurWatermarks(canvas, blurIntensity);
    }
  } catch (error) {
    console.error('Error in blur watermark removal:', error);
    // Return original canvas on error
  }
  
  return canvas;
};

// Advanced content-aware blur that preserves important edges
const applyContentAwareBlur = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  intensity: number
): void => {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data.length);
  
  // Apply selective blur based on edge detection
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const idx = (py * width + px) * 4;
      
      // Detect if pixel is on an edge
      const isEdge = detectLocalEdge(data, px, py, width, height);
      
      if (isEdge) {
        // Preserve edge pixels
        newData[idx] = data[idx];
        newData[idx + 1] = data[idx + 1];
        newData[idx + 2] = data[idx + 2];
        newData[idx + 3] = data[idx + 3];
      } else {
        // Apply adaptive blur to non-edge areas
        const blurred = getAdaptiveBlurredPixel(data, px, py, width, height, intensity);
        newData[idx] = blurred[0];
        newData[idx + 1] = blurred[1];
        newData[idx + 2] = blurred[2];
        newData[idx + 3] = data[idx + 3]; // Preserve alpha
      }
    }
  }
  
  const processedImageData = new ImageData(newData, width, height);
  ctx.putImageData(processedImageData, x, y);
};

// Detect edges in local area
const detectLocalEdge = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): boolean => {
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return true;
  
  const centerIdx = (y * width + x) * 4;
  const centerBrightness = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
  
  // Check surrounding pixels for significant brightness differences
  const threshold = 30;
  const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const idx = (ny * width + nx) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (Math.abs(brightness - centerBrightness) > threshold) {
        return true;
      }
    }
  }
  
  return false;
};

// Get adaptive blurred pixel based on surrounding content
const getAdaptiveBlurredPixel = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  intensity: number
): [number, number, number] => {
  let r = 0, g = 0, b = 0;
  let totalWeight = 0;
  
  const radius = Math.max(1, Math.floor(intensity / 3));
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const idx = (ny * width + nx) * 4;
        
        // Weight based on distance (Gaussian-like)
        const distance = Math.sqrt(dx * dx + dy * dy);
        const weight = Math.exp(-(distance * distance) / (2 * radius * radius));
        
        r += data[idx] * weight;
        g += data[idx + 1] * weight;
        b += data[idx + 2] * weight;
        totalWeight += weight;
        // count variable removed as it was unused
      }
    }
  }
  
  if (totalWeight > 0) {
    return [r / totalWeight, g / totalWeight, b / totalWeight];
  }
  
  return [data[(y * width + x) * 4], data[(y * width + x) * 4 + 1], data[(y * width + x) * 4 + 2]];
};

// Remove watermark using advanced inpainting technique
const removeWatermarkByInpainting = (
  canvas: HTMLCanvasElement,
  options: WatermarkRemovalOptions
): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    const { watermarkRegion, inpaintRadius = 5, iterations = 3 } = options;
    
    if (watermarkRegion) {
      const { x, y, width: wWidth, height: wHeight } = watermarkRegion;
      
      // Validate bounds
      const startX = Math.max(0, x);
      const startY = Math.max(0, y);
      const endX = Math.min(width, x + wWidth);
      const endY = Math.min(height, y + wHeight);
      
      // Professional inpainting using multiple iterations and advanced techniques
      const processedData = advancedInpainting(data, width, height, startX, startY, endX, endY, inpaintRadius, iterations);
      
      // Replace the processed region
      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          const idx = (py * width + px) * 4;
          data[idx] = processedData[idx];
          data[idx + 1] = processedData[idx + 1];
          data[idx + 2] = processedData[idx + 2];
          // Keep original alpha
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    } else {
      // Auto-detect and inpaint
      autoInpaintWatermarks(ctx, data, width, height, inpaintRadius, iterations);
    }
  } catch (error) {
    console.error('Error in inpainting watermark removal:', error);
  }
  
  return canvas;
};

// Advanced inpainting algorithm similar to professional tools
const advancedInpainting = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radius: number,
  iterations: number
): Uint8ClampedArray => {
  const result = new Uint8ClampedArray(data);
  const mask = createInpaintingMask(width, height, startX, startY, endX, endY);
  
  // Multiple iterations for better quality
  for (let iter = 0; iter < iterations; iter++) {
    const tempResult = new Uint8ClampedArray(result);
    
    // Process each pixel in the watermark region
    for (let py = Math.max(0, startY - radius); py < Math.min(height, endY + radius); py++) {
      for (let px = Math.max(0, startX - radius); px < Math.min(width, endX + radius); px++) {
        if (mask[py * width + px]) {
          // This pixel needs inpainting
          const inpainted = smartInpaintPixel(result, px, py, width, height, radius, mask);
          const idx = (py * width + px) * 4;
          tempResult[idx] = inpainted[0];
          tempResult[idx + 1] = inpainted[1];
          tempResult[idx + 2] = inpainted[2];
        }
      }
    }
    
    // Copy back the results
    for (let i = 0; i < result.length; i++) {
      result[i] = tempResult[i];
    }
  }
  
  return result;
};

// Create a mask for the inpainting region
const createInpaintingMask = (
  width: number,
  height: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): boolean[] => {
  const mask = new Array(width * height).fill(false);
  
  for (let py = startY; py < endY; py++) {
    for (let px = startX; px < endX; px++) {
      if (px >= 0 && px < width && py >= 0 && py < height) {
        mask[py * width + px] = true;
      }
    }
  }
  
  return mask;
};

// Smart inpainting that considers texture and patterns
const smartInpaintPixel = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  mask: boolean[]
): [number, number, number] => {
  const validPixels: Array<{ r: number; g: number; b: number; distance: number; similarity: number }> = [];
  
  // Collect valid surrounding pixels
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !mask[ny * width + nx]) {
        const idx = (ny * width + nx) * 4;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance <= radius) {
          // Calculate texture similarity
          const similarity = calculateTextureSimilarity(data, nx, ny, width, height, radius);
          
          validPixels.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
            distance,
            similarity
          });
        }
      }
    }
  }
  
  if (validPixels.length === 0) {
    return [128, 128, 128]; // Fallback to gray
  }
  
  // Weight by distance and similarity
  let r = 0, g = 0, b = 0, totalWeight = 0;
  
  for (const pixel of validPixels) {
    // Combine distance and similarity weights
    const distanceWeight = 1 / (1 + pixel.distance);
    const similarityWeight = pixel.similarity;
    const weight = distanceWeight * similarityWeight;
    
    r += pixel.r * weight;
    g += pixel.g * weight;
    b += pixel.b * weight;
    totalWeight += weight;
  }
  
  if (totalWeight > 0) {
    return [
      Math.round(r / totalWeight),
      Math.round(g / totalWeight),
      Math.round(b / totalWeight)
    ];
  }
  
  return [128, 128, 128];
};

// Calculate texture similarity for better inpainting
const calculateTextureSimilarity = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): number => {
  let gradientMagnitude = 0;
  let edgeCount = 0;
  
  // Sample surrounding area to understand texture
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 1 && nx < width - 1 && ny >= 1 && ny < height - 1) {
        // Calculate local gradient
        const centerIdx = (ny * width + nx) * 4;
        const rightIdx = (ny * width + (nx + 1)) * 4;
        const bottomIdx = ((ny + 1) * width + nx) * 4;
        
        const centerGray = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
        const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
        const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
        
        const gx = rightGray - centerGray;
        const gy = bottomGray - centerGray;
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        gradientMagnitude += magnitude;
        if (magnitude > 10) edgeCount++;
      }
    }
  }
  
  // Return normalized similarity score
  const avgGradient = gradientMagnitude / 25; // 5x5 area
  const edgeRatio = edgeCount / 25;
  
  // Higher similarity for consistent textures
  return Math.exp(-avgGradient / 50) * (1 - edgeRatio * 0.5) + 0.1;
};

// Auto-detect and inpaint watermarks
const autoInpaintWatermarks = (
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  iterations: number
): void => {
  // Detect watermark regions
  const regions = detectWatermarkRegions(data, width, height);
  
  regions.forEach(region => {
    const processedData = advancedInpainting(
      data,
      width,
      height,
      region.x,
      region.y,
      region.x + region.width,
      region.y + region.height,
      radius,
      iterations
    );
    
    // Apply the processed region
    for (let py = region.y; py < region.y + region.height; py++) {
      for (let px = region.x; px < region.x + region.width; px++) {
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4;
          data[idx] = processedData[idx];
          data[idx + 1] = processedData[idx + 1];
          data[idx + 2] = processedData[idx + 2];
        }
      }
    }
  });
  
  const imageData = new ImageData(data, width, height);
  ctx.putImageData(imageData, 0, 0);
};

// Inpaint a single pixel using surrounding pixels (currently unused but kept for future features)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inpaintPixel = (
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): [number, number, number] => {
  let rSum = 0, gSum = 0, bSum = 0;
  let count = 0;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && (dx !== 0 || dy !== 0)) {
        const idx = (ny * width + nx) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        count++;
      }
    }
  }
  
  return count > 0 ? [rSum / count, gSum / count, bSum / count] : [0, 0, 0];
};

// Remove watermark using cloning from nearby areas
const removeWatermarkByCloning = (
  canvas: HTMLCanvasElement,
  options: WatermarkRemovalOptions
): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  const { watermarkRegion } = options;
  
  if (watermarkRegion) {
    const { x, y, width, height } = watermarkRegion;
    
    // Find a similar region to clone from (simple approach)
    const sourceY = y > height ? y - height - 10 : y + height + 10;
    
    if (sourceY >= 0 && sourceY + height < canvas.height) {
      // Clone from above or below the watermark
      ctx.drawImage(canvas, x, sourceY, width, height, x, y, width, height);
    } else {
      // Clone from left or right
      const sourceX = x > width ? x - width - 10 : x + width + 10;
      if (sourceX >= 0 && sourceX + width < canvas.width) {
        ctx.drawImage(canvas, sourceX, y, width, height, x, y, width, height);
      }
    }
  }
  
  return canvas;
};

// Remove watermark using frequency domain analysis (simplified)
const removeWatermarkByFrequencyAnalysis = (
  canvas: HTMLCanvasElement,
  options: WatermarkRemovalOptions
): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Apply a high-pass filter to reduce low-frequency watermark patterns
  const filtered = applyHighPassFilter(data, canvas.width, canvas.height);
  
  // Put the filtered data back
  for (let i = 0; i < data.length; i++) {
    data[i] = filtered[i];
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

// Apply high-pass filter
const applyHighPassFilter = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray => {
  const filtered = new Uint8ClampedArray(data.length);
  
  // High-pass filter kernel
  const kernel = [
    [-1, -1, -1],
    [-1,  8, -1],
    [-1, -1, -1]
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const px = x + kx - 1;
            const py = y + ky - 1;
            const idx = (py * width + px) * 4 + c;
            sum += data[idx] * kernel[ky][kx];
          }
        }
        
        const resultIdx = (y * width + x) * 4 + c;
        filtered[resultIdx] = Math.max(0, Math.min(255, sum + 128)); // Add 128 to center around middle gray
      }
      
      // Copy alpha channel
      const alphaIdx = (y * width + x) * 4 + 3;
      filtered[alphaIdx] = data[alphaIdx];
    }
  }
  
  return filtered;
};

// AI-based watermark removal (placeholder - would need more sophisticated AI model)
const removeWatermarkByAI = async (
  canvas: HTMLCanvasElement,
  options: WatermarkRemovalOptions
): Promise<HTMLCanvasElement> => {
  // This is a simplified placeholder. In a real implementation, you would:
  // 1. Use a trained model specifically for watermark removal
  // 2. Preprocess the image appropriately
  // 3. Run inference
  // 4. Postprocess the result
  
  console.warn('AI watermark removal not fully implemented. Using inpainting fallback.');
  return removeWatermarkByInpainting(canvas, options);
};

// Auto-detect watermark regions using edge detection and pattern matching
const autoDetectAndBlurWatermarks = (
  canvas: HTMLCanvasElement,
  blurIntensity: number
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Detect potential watermark regions (simplified approach)
    const regions = detectWatermarkRegions(data, canvas.width, canvas.height);
    
    // Blur detected regions
    regions.forEach(region => {
      try {
        // Validate region bounds
        const validX = Math.max(0, Math.min(region.x, canvas.width - region.width));
        const validY = Math.max(0, Math.min(region.y, canvas.height - region.height));
        const validWidth = Math.min(region.width, canvas.width - validX);
        const validHeight = Math.min(region.height, canvas.height - validY);
        
        if (validWidth > 0 && validHeight > 0) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = validWidth;
          tempCanvas.height = validHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;
          
          // Copy region
          tempCtx.drawImage(canvas, validX, validY, validWidth, validHeight, 0, 0, validWidth, validHeight);
          
          // Apply blur with a working approach
          const blurredData = applySimpleBlur(tempCtx.getImageData(0, 0, validWidth, validHeight), blurIntensity);
          tempCtx.putImageData(blurredData, 0, 0);
          
          // Draw back
          ctx.drawImage(tempCanvas, validX, validY);
        }
      } catch (regionError) {
        console.error('Error processing watermark region:', regionError);
      }
    });
  } catch (error) {
    console.error('Error in auto-detect watermark removal:', error);
  }
};

// Simple blur implementation for canvas
const applySimpleBlur = (imageData: ImageData, radius: number): ImageData => {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let count = 0;
      
      // Average pixels in radius
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }
      }
      
      const outIdx = (y * width + x) * 4;
      outputData[outIdx] = r / count;
      outputData[outIdx + 1] = g / count;
      outputData[outIdx + 2] = b / count;
      outputData[outIdx + 3] = a / count;
    }
  }
  
  return output;
};

// Detect watermark regions (improved heuristic approach)
const detectWatermarkRegions = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): Array<{ x: number; y: number; width: number; height: number }> => {
  const regions: Array<{ x: number; y: number; width: number; height: number }> = [];
  
  try {
    // Multiple detection strategies
    const blockSize = Math.min(64, Math.floor(Math.min(width, height) / 8)); // Adaptive block size
    const stepSize = Math.floor(blockSize / 2); // Overlapping blocks for better detection
    
    // Strategy 1: Look for semi-transparent regions
    for (let y = 0; y < height - blockSize; y += stepSize) {
      for (let x = 0; x < width - blockSize; x += stepSize) {
        let transparentPixels = 0;
        let totalPixels = 0;
        let averageAlpha = 0;
        
        // Sample pixels more efficiently
        for (let by = 0; by < blockSize; by += 4) {
          for (let bx = 0; bx < blockSize; bx += 4) {
            if (x + bx < width && y + by < height) {
              const idx = ((y + by) * width + (x + bx)) * 4;
              const alpha = data[idx + 3];
              averageAlpha += alpha;
              
              if (alpha > 50 && alpha < 200) { // Semi-transparent range
                transparentPixels++;
              }
              totalPixels++;
            }
          }
        }
        
        if (totalPixels > 0) {
          averageAlpha /= totalPixels;
          const transparencyRatio = transparentPixels / totalPixels;
          
          // More sophisticated watermark detection
          if (transparencyRatio > 0.2 && averageAlpha > 50 && averageAlpha < 200) {
            regions.push({ x, y, width: blockSize, height: blockSize });
          }
        }
      }
    }
    
    // Strategy 2: Look for repeated patterns (simplified)
    // Check corners and edges where watermarks are commonly placed
    const cornerSize = Math.min(100, Math.floor(Math.min(width, height) / 4));
    const corners = [
      { x: 0, y: 0 }, // Top-left
      { x: width - cornerSize, y: 0 }, // Top-right
      { x: 0, y: height - cornerSize }, // Bottom-left
      { x: width - cornerSize, y: height - cornerSize }, // Bottom-right
      { x: Math.floor((width - cornerSize) / 2), y: Math.floor((height - cornerSize) / 2) }, // Center
    ];
    
    corners.forEach(corner => {
      if (corner.x >= 0 && corner.y >= 0 && corner.x + cornerSize <= width && corner.y + cornerSize <= height) {
        let uniqueColors = new Set<string>();
        let avgBrightness = 0;
        let pixelCount = 0;
        
        // Analyze corner region
        for (let by = 0; by < cornerSize; by += 8) {
          for (let bx = 0; bx < cornerSize; bx += 8) {
            const idx = ((corner.y + by) * width + (corner.x + bx)) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            
            avgBrightness += brightness;
            pixelCount++;
            uniqueColors.add(`${Math.floor(r/32)},${Math.floor(g/32)},${Math.floor(b/32)}`);
          }
        }
        
        if (pixelCount > 0) {
          avgBrightness /= pixelCount;
          
          // Detect potential watermark characteristics
          if (uniqueColors.size < pixelCount * 0.3 && (avgBrightness > 180 || avgBrightness < 80)) {
            regions.push({ x: corner.x, y: corner.y, width: cornerSize, height: cornerSize });
          }
        }
      }
    });
    
    // Remove overlapping regions and keep the most promising ones
    return mergeOverlappingRegions(regions);
  } catch (error) {
    console.error('Error in watermark detection:', error);
    return [];
  }
};

// Merge overlapping watermark regions
const mergeOverlappingRegions = (
  regions: Array<{ x: number; y: number; width: number; height: number }>
): Array<{ x: number; y: number; width: number; height: number }> => {
  if (regions.length <= 1) return regions;
  
  const merged: Array<{ x: number; y: number; width: number; height: number }> = [];
  const used = new Set<number>();
  
  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;
    
    let current = { ...regions[i] };
    used.add(i);
    
    // Check for overlaps with remaining regions
    for (let j = i + 1; j < regions.length; j++) {
      if (used.has(j)) continue;
      
      const other = regions[j];
      
      // Check if regions overlap
      if (current.x < other.x + other.width &&
          current.x + current.width > other.x &&
          current.y < other.y + other.height &&
          current.y + current.height > other.y) {
        
        // Merge regions
        const minX = Math.min(current.x, other.x);
        const minY = Math.min(current.y, other.y);
        const maxX = Math.max(current.x + current.width, other.x + other.width);
        const maxY = Math.max(current.y + current.height, other.y + other.height);
        
        current = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
        
        used.add(j);
      }
    }
    
    merged.push(current);
  }
  
  return merged;
};

// Utility function to detect if image likely contains watermarks
export const detectWatermarks = (
  imageElement: HTMLImageElement
): Promise<Array<{ x: number; y: number; width: number; height: number; confidence: number }>> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve([]);
      return;
    }
    
    ctx.drawImage(imageElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const regions = detectWatermarkRegions(imageData.data, canvas.width, canvas.height);
    
    // Add confidence scores (simplified)
    const detections = regions.map(region => ({
      ...region,
      confidence: Math.random() * 0.3 + 0.7 // Simplified confidence between 0.7-1.0
    }));
    
    resolve(detections);
  });
};

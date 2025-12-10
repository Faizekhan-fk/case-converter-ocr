import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon,
  PhotoIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { 
  ImageFormat, 
  ImageProcessingOptions, 
  ImageProcessingProgress,
  ProcessedImage,
  UpscaleAlgorithm,
  BackgroundRemovalType,
  WatermarkRemovalOptions,
  WatermarkRemovalMethod
} from '../types';
import {
  initializeBodyPix,
  removeBackground,
  removeBackgroundAdvanced,
  convertImageFormat,
  loadImageFromFile,
  downloadImage,
  generateFilename,
  isValidImageFile,
  getImageDimensions,
  processImageAdvanced,
  removeWatermark,
  detectWatermarks
} from '../utils/imageUtils';

interface ImageProcessorProps {}

const ImageProcessor: React.FC<ImageProcessorProps> = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<ImageProcessingProgress | null>(null);
  const [options, setOptions] = useState<ImageProcessingOptions>({
    quality: 0.9,
    backgroundColor: '#ffffff',
    segmentationThreshold: 0.7,
    maskBlurAmount: 0,
    edgeBlurAmount: 0,
    flipHorizontal: false,
    upscaleFactor: 1,
    upscaleAlgorithm: 'bicubic' as UpscaleAlgorithm,
    backgroundRemovalType: 'ai' as BackgroundRemovalType,
    colorTolerance: 30,
    edgeThreshold: 50,
    smoothing: 1
  });
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkRemovalOptions>({
    method: 'blur' as WatermarkRemovalMethod,
    blurIntensity: 10,
    inpaintRadius: 3,
    threshold: 128,
    iterations: 3,
    autoDetect: true
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [detectedWatermarks, setDetectedWatermarks] = useState<Array<{ x: number; y: number; width: number; height: number; confidence: number }>>([]);
  const [manualRegion, setManualRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Initialize BodyPix model on component mount
  useEffect(() => {
    const loadModel = async () => {
      if (!isModelLoaded && !isLoadingModel) {
        setIsLoadingModel(true);
        try {
          await initializeBodyPix();
          setIsModelLoaded(true);
        } catch (error) {
          console.error('Failed to load model:', error);
        } finally {
          setIsLoadingModel(false);
        }
      }
    };

    loadModel();
  }, [isModelLoaded, isLoadingModel]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(isValidImageFile);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processImage = async (file: File, processingType: 'format' | 'background' | 'upscale' | 'advanced' | 'watermark' = 'format') => {
    if (!isModelLoaded && (processingType === 'background' || processingType === 'advanced') && options.backgroundRemovalType === 'ai') {
      throw new Error('AI model not loaded yet');
    }

    setProcessingProgress({
      stage: 'loading',
      progress: 10,
      message: 'Loading image...'
    });

    try {
      // Load image
      const img = await loadImageFromFile(file);
      await getImageDimensions(file);

      setProcessingProgress({
        stage: 'processing',
        progress: 30,
        message: getProcessingMessage(processingType)
      });

      let canvas: HTMLCanvasElement;

      if (processingType === 'watermark') {
        // Watermark removal with manual region if set
        const watermarkOptionsWithRegion = {
          ...watermarkOptions,
          watermarkRegion: manualRegion || watermarkOptions.watermarkRegion
        };
        canvas = await removeWatermark(img, watermarkOptionsWithRegion);
      } else if (processingType === 'advanced' || (processingType === 'upscale' && options.upscaleFactor && options.upscaleFactor > 1)) {
        // Use advanced processing pipeline
        canvas = await processImageAdvanced(img, {
          upscaleFactor: options.upscaleFactor,
          upscaleAlgorithm: options.upscaleAlgorithm,
          removeBackground: processingType === 'advanced',
          backgroundRemovalType: options.backgroundRemovalType,
          backgroundOptions: {
            segmentationThreshold: options.segmentationThreshold,
            maskBlurAmount: options.maskBlurAmount,
            edgeBlurAmount: options.edgeBlurAmount,
            flipHorizontal: options.flipHorizontal,
            colorTolerance: options.colorTolerance,
            edgeThreshold: options.edgeThreshold,
            smoothing: options.smoothing,
            backgroundColor: options.backgroundColor
          }
        });
      } else if (processingType === 'background') {
        // Background removal only
        if (options.backgroundRemovalType === 'ai') {
          canvas = await removeBackground(img, {
            segmentationThreshold: options.segmentationThreshold,
            maskBlurAmount: options.maskBlurAmount,
            edgeBlurAmount: options.edgeBlurAmount,
            flipHorizontal: options.flipHorizontal
          });
        } else {
          canvas = await removeBackgroundAdvanced(img, {
            colorTolerance: options.colorTolerance,
            edgeThreshold: options.edgeThreshold,
            smoothing: options.smoothing,
            backgroundColor: options.backgroundColor
          });
        }
      } else {
        // Simple format conversion or upscaling only
        if (options.upscaleFactor && options.upscaleFactor > 1) {
          canvas = await processImageAdvanced(img, {
            upscaleFactor: options.upscaleFactor,
            upscaleAlgorithm: options.upscaleAlgorithm,
            removeBackground: false
          });
        } else {
          canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          ctx.drawImage(img, 0, 0);
        }
      }

      setProcessingProgress({
        stage: 'complete',
        progress: 100,
        message: 'Processing complete!'
      });

      // Calculate final dimensions
      const finalDimensions = {
        width: canvas.width,
        height: canvas.height
      };

      const processedImage: ProcessedImage = {
        original: file,
        canvas,
        dimensions: finalDimensions,
        processedAt: new Date()
      };

      return processedImage;
    } catch (error) {
      console.error('Processing failed:', error);
      throw error;
    }
  };

  const getProcessingMessage = (type: 'format' | 'background' | 'upscale' | 'advanced' | 'watermark'): string => {
    switch (type) {
      case 'background':
        return 'Removing background...';
      case 'upscale':
        return `Upscaling image ${options.upscaleFactor}x...`;
      case 'advanced':
        return 'Advanced processing...';
      case 'watermark':
        return 'Removing watermark...';
      default:
        return 'Processing image...';
    }
  };

  const handleProcessImages = async (processingType: 'format' | 'background' | 'upscale' | 'advanced' | 'watermark' = 'format') => {
    if (selectedFiles.length === 0) return;

    const results: ProcessedImage[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        setProcessingProgress({
          stage: 'processing',
          progress: Math.round((i / selectedFiles.length) * 100),
          message: `Processing ${i + 1} of ${selectedFiles.length}...`
        });
        
        const result = await processImage(selectedFiles[i], processingType);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process ${selectedFiles[i].name}:`, error);
      }
    }

    setProcessedImages(results);
    setProcessingProgress(null);
  };

  const downloadProcessedImage = async (
    processedImage: ProcessedImage,
    format: ImageFormat
  ) => {
    try {
      const blob = await convertImageFormat(processedImage.canvas, format, options);
      const filename = generateFilename(
        processedImage.original.name,
        format,
        'processed'
      );
      downloadImage(blob, filename);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setProcessedImages([]);
    setProcessingProgress(null);
    setDetectedWatermarks([]);
  };

  const detectWatermarksInFile = async (file: File) => {
    try {
      const img = await loadImageFromFile(file);
      const watermarks = await detectWatermarks(img);
      setDetectedWatermarks(watermarks);
    } catch (error) {
      console.error('Failed to detect watermarks:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="flex items-center space-x-3">
            <PhotoIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">Image Processor</h2>
              <p className="text-sm sm:text-base text-purple-100 hidden sm:block">Remove backgrounds and convert image formats</p>
              <p className="text-xs text-purple-100 sm:hidden">Process & convert images</p>
            </div>
          </div>
        </div>

        {/* Model Loading Status */}
        {!isModelLoaded && (
          <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 animate-spin flex-shrink-0" />
              <span className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                {isLoadingModel ? 'Loading AI model for background removal...' : 'AI model not loaded'}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {/* File Upload */}
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}>
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <p className="mt-2 text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
              Drop images here or click to browse
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Supports JPEG, PNG, and WebP formats
            </p>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Selected Files ({selectedFiles.length})
                </h3>
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 self-start sm:self-auto"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid gap-2 sm:gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                    >
                      <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Options */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Processing Options
                </h3>
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 self-start sm:self-auto"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  <span>Advanced Options</span>
                </button>
              </div>

              {/* Basic Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                <button
                  onClick={() => handleProcessImages('format')}
                  disabled={processingProgress !== null}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Format Only</span>
                </button>
                <button
                  onClick={() => handleProcessImages('upscale')}
                  disabled={processingProgress !== null}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span className="truncate">Upscale {options.upscaleFactor}x</span>
                </button>
                <button
                  onClick={() => handleProcessImages('background')}
                  disabled={processingProgress !== null || (options.backgroundRemovalType === 'ai' && !isModelLoaded)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Remove BG</span>
                </button>
                <button
                  onClick={() => handleProcessImages('watermark')}
                  disabled={processingProgress !== null}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Remove WM</span>
                </button>
                <button
                  onClick={() => handleProcessImages('advanced')}
                  disabled={processingProgress !== null || (options.backgroundRemovalType === 'ai' && !isModelLoaded)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Advanced</span>
                </button>
              </div>

              {/* Advanced Options */}
              <AnimatePresence>
                {showAdvancedOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Upscaling Options */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Upscale Factor (1-4x)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          step="0.25"
                          value={options.upscaleFactor}
                          onChange={(e) => setOptions(prev => ({ ...prev, upscaleFactor: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{options.upscaleFactor}x</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Upscaling Algorithm
                        </label>
                        <select
                          value={options.upscaleAlgorithm}
                          onChange={(e) => setOptions(prev => ({ ...prev, upscaleAlgorithm: e.target.value as UpscaleAlgorithm }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="bicubic">Bicubic (Best Quality)</option>
                          <option value="lanczos">Lanczos (High Quality)</option>
                          <option value="bilinear">Bilinear (Fast)</option>
                          <option value="nearest">Nearest (Fastest)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Image Quality Options */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Image Quality (0.1 - 1.0)
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={options.quality}
                          onChange={(e) => setOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                          className="w-full"
                        />
                        <span className="text-sm text-gray-500">{options.quality}</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={options.backgroundColor}
                          onChange={(e) => setOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                    
                    {/* Background Removal Options */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Background Removal Method
                        </label>
                        <select
                          value={options.backgroundRemovalType}
                          onChange={(e) => setOptions(prev => ({ ...prev, backgroundRemovalType: e.target.value as BackgroundRemovalType }))}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="ai">AI (People/Objects)</option>
                          <option value="advanced">Color Analysis (Any Subject)</option>
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center space-x-2 mt-6">
                          <input
                            type="checkbox"
                            checked={options.flipHorizontal}
                            onChange={(e) => setOptions(prev => ({ ...prev, flipHorizontal: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Flip Horizontal</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* AI Background Removal Options */}
                    {options.backgroundRemovalType === 'ai' && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            AI Segmentation Threshold (0.1 - 1.0)
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={options.segmentationThreshold}
                            onChange={(e) => setOptions(prev => ({ ...prev, segmentationThreshold: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                          <span className="text-sm text-gray-500">{options.segmentationThreshold}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Mask Blur Amount (0-10)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={options.maskBlurAmount}
                            onChange={(e) => setOptions(prev => ({ ...prev, maskBlurAmount: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <span className="text-sm text-gray-500">{options.maskBlurAmount}px</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Advanced Background Removal Options */}
                    {options.backgroundRemovalType === 'advanced' && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Color Tolerance (1-100)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={options.colorTolerance}
                            onChange={(e) => setOptions(prev => ({ ...prev, colorTolerance: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <span className="text-sm text-gray-500">{options.colorTolerance}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Edge Threshold (10-200)
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            step="5"
                            value={options.edgeThreshold}
                            onChange={(e) => setOptions(prev => ({ ...prev, edgeThreshold: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <span className="text-sm text-gray-500">{options.edgeThreshold}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Smoothing (1-5)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={options.smoothing}
                            onChange={(e) => setOptions(prev => ({ ...prev, smoothing: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                          <span className="text-sm text-gray-500">{options.smoothing}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Watermark Removal Options */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Watermark Removal Settings</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Removal Method
                          </label>
                          <select
                            value={watermarkOptions.method}
                            onChange={(e) => setWatermarkOptions(prev => ({ ...prev, method: e.target.value as WatermarkRemovalMethod }))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          >
                            <option value="blur">Content-Aware Blur (Fast)</option>
                            <option value="inpaint">Advanced Inpainting (Professional)</option>
                            <option value="clone">Smart Clone (Pattern-based)</option>
                            <option value="frequency">Frequency Analysis (Repetitive WM)</option>
                            <option value="ai">AI-Style Removal (Best Quality)</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center space-x-2 mt-6">
                            <input
                              type="checkbox"
                              checked={watermarkOptions.autoDetect}
                              onChange={(e) => setWatermarkOptions(prev => ({ ...prev, autoDetect: e.target.checked }))}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-detect watermarks</span>
                          </label>
                          {selectedFiles.length > 0 && (
                            <button
                              onClick={() => detectWatermarksInFile(selectedFiles[0])}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Detect Watermarks
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Method-specific options */}
                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        {watermarkOptions.method === 'blur' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Blur Intensity (1-20)
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              step="1"
                              value={watermarkOptions.blurIntensity}
                              onChange={(e) => setWatermarkOptions(prev => ({ ...prev, blurIntensity: parseInt(e.target.value) }))}
                              className="w-full"
                            />
                            <span className="text-sm text-gray-500">{watermarkOptions.blurIntensity}px</span>
                          </div>
                        )}
                        
                        {watermarkOptions.method === 'inpaint' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Inpaint Radius (1-10)
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={watermarkOptions.inpaintRadius}
                              onChange={(e) => setWatermarkOptions(prev => ({ ...prev, inpaintRadius: parseInt(e.target.value) }))}
                              className="w-full"
                            />
                            <span className="text-sm text-gray-500">{watermarkOptions.inpaintRadius}px</span>
                          </div>
                        )}
                        
                        {(watermarkOptions.method === 'frequency' || watermarkOptions.method === 'ai') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Processing Iterations (1-10)
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="1"
                              value={watermarkOptions.iterations}
                              onChange={(e) => setWatermarkOptions(prev => ({ ...prev, iterations: parseInt(e.target.value) }))}
                              className="w-full"
                            />
                            <span className="text-sm text-gray-500">{watermarkOptions.iterations}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Manual Region Selection */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">Manual Watermark Region:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">X Position</label>
                            <input
                              type="number"
                              min="0"
                              value={manualRegion?.x || 0}
                              onChange={(e) => setManualRegion(prev => ({ ...prev, x: parseInt(e.target.value) || 0, y: prev?.y || 0, width: prev?.width || 100, height: prev?.height || 100 }))}
                              className="w-full p-1 text-xs border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Y Position</label>
                            <input
                              type="number"
                              min="0"
                              value={manualRegion?.y || 0}
                              onChange={(e) => setManualRegion(prev => ({ ...prev, y: parseInt(e.target.value) || 0, x: prev?.x || 0, width: prev?.width || 100, height: prev?.height || 100 }))}
                              className="w-full p-1 text-xs border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Width</label>
                            <input
                              type="number"
                              min="1"
                              value={manualRegion?.width || 100}
                              onChange={(e) => setManualRegion(prev => ({ ...prev, width: parseInt(e.target.value) || 100, x: prev?.x || 0, y: prev?.y || 0, height: prev?.height || 100 }))}
                              className="w-full p-1 text-xs border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Height</label>
                            <input
                              type="number"
                              min="1"
                              value={manualRegion?.height || 100}
                              onChange={(e) => setManualRegion(prev => ({ ...prev, height: parseInt(e.target.value) || 100, x: prev?.x || 0, y: prev?.y || 0, width: prev?.width || 100 }))}
                              className="w-full p-1 text-xs border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => setManualRegion({ x: 10, y: 10, width: 100, height: 50 })}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Set Sample Region
                          </button>
                          <button
                            onClick={() => setManualRegion(null)}
                            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Clear Region
                          </button>
                        </div>
                      </div>

                      {/* Detected watermarks display */}
                      {detectedWatermarks.length > 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                            Detected {detectedWatermarks.length} potential watermark region(s):
                          </p>
                          <div className="space-y-1">
                            {detectedWatermarks.map((wm, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-xs text-yellow-700 dark:text-yellow-300">
                                  Region {index + 1}: {wm.width}×{wm.height} at ({wm.x}, {wm.y}) - Confidence: {Math.round(wm.confidence * 100)}%
                                </span>
                                <button
                                  onClick={() => setManualRegion({ x: wm.x, y: wm.y, width: wm.width, height: wm.height })}
                                  className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors ml-2"
                                >
                                  Use This
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Processing Progress */}
          {processingProgress && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {processingProgress.message}
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {processingProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Processed Images */}
          {processedImages.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Processed Images ({processedImages.length})
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {processedImages.map((processedImage, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                    <div className="aspect-square mb-3 sm:mb-4 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                        }}
                      >
                        <img
                          src={processedImage.canvas.toDataURL()}
                          alt={`Processed ${processedImage.original.name}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={processedImage.original.name}>
                        {processedImage.original.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {processedImage.dimensions.width} × {processedImage.dimensions.height}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2">
                        {(['jpeg', 'png', 'webp'] as ImageFormat[]).map((format) => (
                          <button
                            key={format}
                            onClick={() => downloadProcessedImage(processedImage, format)}
                            className="flex items-center space-x-1 px-2 sm:px-3 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs">{format.toUpperCase()}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageProcessor;

import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, PhotoIcon, ClipboardIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { OCRService, validateImageFile, createImagePreview } from '../utils/ocr';
import { OCRProgress } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface OCRComponentProps {
  onTextExtracted: (text: string) => void;
}

const OCRComponent: React.FC<OCRComponentProps> = ({ onTextExtracted }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ocrServiceRef = useRef<OCRService | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    try {
      const preview = await createImagePreview(file);
      setImagePreview(preview);
    } catch (err) {
      setError('Failed to load image preview');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleExtractText = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(null);
    setError(null);
    setExtractedText('');

    try {
      if (!ocrServiceRef.current) {
        ocrServiceRef.current = new OCRService();
      }

      const result = await ocrServiceRef.current.extractText(
        selectedFile,
        (progressData: OCRProgress) => {
          setProgress(progressData);
        }
      );

      setExtractedText(result.text.trim());
      onTextExtracted(result.text.trim());
      setProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text');
      setProgress(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (extractedText) {
      try {
        await navigator.clipboard.writeText(extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setExtractedText('');
    setError(null);
    setProgress(null);
  };

  const formatProgress = (progress: OCRProgress) => {
    const percentage = Math.round(progress.progress * 100);
    const status = progress.status.replace(/([A-Z])/g, ' $1').toLowerCase();
    return `${status} (${percentage}%)`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload Image
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload an image to extract text using OCR (Optical Character Recognition)
          </p>
        </div>
        
        <div className="p-6">
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer ${
                isDragActive
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-25 dark:hover:bg-gray-700'
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <div className="mt-4">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragActive ? 'Drop the image here' : 'Upload an image'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Drag and drop your image here, or click to browse
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Supports JPEG, PNG, GIF, BMP, WebP (max 10MB)
                </p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <button
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-full shadow-sm"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                
                {imagePreview && (
                  <div className="mb-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto max-h-64 mx-auto rounded-md shadow-sm"
                    />
                  </div>
                )}
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              
              <button
                onClick={handleExtractText}
                disabled={isProcessing}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <PhotoIcon className="w-4 h-4 mr-2" />
                {isProcessing ? 'Extracting Text...' : 'Extract Text'}
              </button>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            >
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {progress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {formatProgress(progress)}
                </p>
              </div>
              <div className="w-full bg-primary-200 dark:bg-primary-800 rounded-full h-2">
                <motion.div
                  className="bg-primary-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Extracted Text Section */}
      <AnimatePresence>
        {extractedText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Extracted Text
                </h2>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-md transition-colors duration-200"
                >
                  <ClipboardIcon className="w-4 h-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="w-full max-h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-auto">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {extractedText}
                </pre>
              </div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {extractedText.length} characters extracted
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OCRComponent;

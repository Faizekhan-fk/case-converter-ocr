import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import LoadingSpinner from './components/LoadingSpinner';
import { AppState, CaseType } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load components for better performance
const CaseConverter = lazy(() => import('./components/CaseConverter'));
const OCRComponent = lazy(() => import('./components/OCRComponent'));
const ImageProcessor = lazy(() => import('./components/ImageProcessor'));
const MediaDownloader = lazy(() => import('./components/MediaDownloader'));

function App() {
  const [appState, setAppState] = useState<AppState>({
    inputText: '',
    outputText: '',
    selectedCase: 'lowercase',
    isProcessing: false,
    ocrProgress: null,
    history: [],
    darkMode: false
  });
  
  const [activeTab, setActiveTab] = useState<'converter' | 'ocr' | 'image' | 'downloader'>('converter');

  // Load dark mode preference from localStorage and initialize theme
  useEffect(() => {
    const initializeTheme = () => {
      const savedDarkMode = localStorage.getItem('darkMode');
      let isDark = false;

      if (savedDarkMode !== null) {
        // Use saved preference
        isDark = JSON.parse(savedDarkMode);
      } else {
        // Check system preference (with fallback for test environments)
        try {
          if (window.matchMedia) {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          }
        } catch (e) {
          // Fallback to light mode if matchMedia fails
          isDark = false;
        }
      }

      // Update state
      setAppState(prev => ({ ...prev, darkMode: isDark }));
      
      // Apply theme to document
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    initializeTheme();
  }, []);

  const handleToggleDarkMode = () => {
    setAppState(prev => {
      const newDarkMode = !prev.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return { ...prev, darkMode: newDarkMode };
    });
  };

  const handleInputChange = (text: string) => {
    setAppState(prev => ({ ...prev, inputText: text }));
  };

  const handleOutputChange = (text: string) => {
    setAppState(prev => ({ ...prev, outputText: text }));
  };

  const handleCaseChange = (caseType: CaseType) => {
    setAppState(prev => ({ ...prev, selectedCase: caseType }));
  };

  const handleTextExtracted = (text: string) => {
    setAppState(prev => ({ ...prev, inputText: text }));
    setActiveTab('converter');
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Header
            darkMode={appState.darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <main className="py-4 sm:py-6 lg:py-8">
            <Suspense fallback={
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <LoadingSpinner size="lg" text="Loading component..." className="py-12" />
              </div>
            }>
              <AnimatePresence mode="wait">
                {activeTab === 'converter' && (
                  <motion.div
                    key="converter"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CaseConverter
                      inputText={appState.inputText}
                      outputText={appState.outputText}
                      selectedCase={appState.selectedCase}
                      onInputChange={handleInputChange}
                      onOutputChange={handleOutputChange}
                      onCaseChange={handleCaseChange}
                    />
                  </motion.div>
                )}
                {activeTab === 'ocr' && (
                  <motion.div
                    key="ocr"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <OCRComponent
                      onTextExtracted={handleTextExtracted}
                    />
                  </motion.div>
                )}
                {activeTab === 'image' && (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ImageProcessor />
                  </motion.div>
                )}
                {activeTab === 'downloader' && (
                  <motion.div
                    key="downloader"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MediaDownloader />
                  </motion.div>
                )}
              </AnimatePresence>
            </Suspense>
          </main>
          
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-12">
            <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* App Info */}
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Text Converter & OCR
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Free online tool to convert text cases, extract text from images using OCR, 
                    and process images with AI-powered background removal.
                  </p>
                </div>
                
                {/* Features */}
                <div className="text-center">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                    Features
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>12+ Text Case Formats</li>
                    <li>OCR Text Extraction</li>
                    <li>AI Background Removal</li>
                    <li>Image Format Conversion</li>
                    <li>Offline Processing</li>
                  </ul>
                </div>
                
                {/* Technical Info */}
                <div className="text-center md:text-right">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                    Built With
                  </h4>
                  <div className="flex flex-wrap justify-center md:justify-end gap-2">
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded">
                      React
                    </span>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded">
                      TypeScript
                    </span>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded">
                      Tailwind CSS
                    </span>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded">
                      Tesseract.js
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    © 2024 <span className="font-semibold">Faize Khan</span>. All rights reserved.
                  </p>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Privacy-focused • No data collection • Works offline
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

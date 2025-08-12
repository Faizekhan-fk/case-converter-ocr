import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CaseConverter from './components/CaseConverter';
import OCRComponent from './components/OCRComponent';
import { AppState, CaseType } from './types';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const [activeTab, setActiveTab] = useState<'converter' | 'ocr'>('converter');

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const isDark = JSON.parse(savedDarkMode);
      setAppState(prev => ({ ...prev, darkMode: isDark }));
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setAppState(prev => ({ ...prev, darkMode: prefersDark }));
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header
        darkMode={appState.darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className="py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'converter' ? (
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
          ) : (
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
        </AnimatePresence>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Text Converter & OCR - Convert text cases and extract text from images</p>
            <p className="mt-1">
              Built with React, TypeScript, Tailwind CSS, and Tesseract.js By <b>Faize Khan</b>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

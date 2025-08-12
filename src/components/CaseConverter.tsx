import React, { useState, useEffect } from 'react';
import { ClipboardIcon, ClipboardDocumentCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CaseType } from '../types';
import { convertCase, getCaseTypeLabel, getCaseTypeDescription } from '../utils/caseConverter';
import { motion, AnimatePresence } from 'framer-motion';

interface CaseConverterProps {
  inputText: string;
  outputText: string;
  selectedCase: CaseType;
  onInputChange: (text: string) => void;
  onOutputChange: (text: string) => void;
  onCaseChange: (caseType: CaseType) => void;
}

const CaseConverter: React.FC<CaseConverterProps> = ({
  inputText,
  outputText,
  selectedCase,
  onInputChange,
  onOutputChange,
  onCaseChange
}) => {
  const [copied, setCopied] = useState(false);

  const caseTypes: CaseType[] = [
    'lowercase',
    'uppercase',
    'capitalcase',
    'camelcase',
    'pascalcase',
    'snakecase',
    'kebabcase',
    'constantcase',
    'dotcase',
    'pathcase',
    'sentencecase',
    'titlecase'
  ];

  useEffect(() => {
    if (inputText) {
      const converted = convertCase(inputText, selectedCase);
      onOutputChange(converted);
    } else {
      onOutputChange('');
    }
  }, [inputText, selectedCase, onOutputChange]);

  const handleCopy = async () => {
    if (outputText) {
      try {
        await navigator.clipboard.writeText(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleClear = () => {
    onInputChange('');
    onOutputChange('');
  };

  const handleSwap = () => {
    onInputChange(outputText);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Input Text
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleSwap}
                disabled={!outputText}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                title="Swap input and output"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        <div className="p-4">
          <textarea
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Enter your text here..."
            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            style={{ minHeight: '128px' }}
          />
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {inputText.length} characters
          </div>
        </div>
      </div>

      {/* Case Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Case Type
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {caseTypes.map((caseType) => (
              <motion.button
                key={caseType}
                onClick={() => onCaseChange(caseType)}
                className={`p-4 text-left border rounded-lg transition-all duration-200 ${
                  selectedCase === caseType
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:border-primary-300 hover:bg-primary-25 dark:hover:bg-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-mono text-sm font-medium mb-1">
                  {getCaseTypeLabel(caseType)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {getCaseTypeDescription(caseType)}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Output Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Converted Text
            </h2>
            <button
              onClick={handleCopy}
              disabled={!outputText}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="copied"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center"
                  >
                    <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" />
                    Copied!
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center"
                  >
                    <ClipboardIcon className="w-4 h-4 mr-1" />
                    Copy
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {outputText || (
                <span className="text-gray-500 dark:text-gray-400 font-sans">
                  Converted text will appear here...
                </span>
              )}
            </pre>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {outputText.length} characters
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseConverter;

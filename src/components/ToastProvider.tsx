import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return CheckCircleIcon;
    case 'error':
      return XCircleIcon;
    case 'warning':
      return ExclamationCircleIcon;
    case 'info':
      return InformationCircleIcon;
  }
};

const getToastColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
  }
};

const getIconColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'text-green-400 dark:text-green-400';
    case 'error':
      return 'text-red-400 dark:text-red-400';
    case 'warning':
      return 'text-yellow-400 dark:text-yellow-400';
    case 'info':
      return 'text-blue-400 dark:text-blue-400';
  }
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration (default 5 seconds)
    setTimeout(() => {
      hideToast(id);
    }, toast.duration || 5000);
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = getToastIcon(toast.type);
            const toastColors = getToastColors(toast.type);
            const iconColors = getIconColors(toast.type);
            
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`${toastColors} border rounded-lg shadow-lg p-4 pointer-events-auto`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${iconColors}`} />
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold">
                      {toast.title}
                    </p>
                    {toast.message && (
                      <p className="text-sm opacity-90 mt-1">
                        {toast.message}
                      </p>
                    )}
                    {toast.action && (
                      <div className="mt-3">
                        <button
                          onClick={toast.action.onClick}
                          className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                        >
                          {toast.action.label}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => hideToast(toast.id)}
                    className="flex-shrink-0 ml-4 inline-flex text-current hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
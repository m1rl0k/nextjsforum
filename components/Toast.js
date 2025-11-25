import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Toast Context
const ToastContext = createContext(null);

// Toast types with icons
const TOAST_TYPES = {
  success: { icon: '✓', className: 'toast-success' },
  error: { icon: '✕', className: 'toast-error' },
  warning: { icon: '⚠', className: 'toast-warning' },
  info: { icon: 'ℹ', className: 'toast-info' }
};

// Individual Toast component
function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration || 4000);

      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const type = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  return (
    <div className={`toast ${type.className} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-icon">{type.icon}</div>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Close">
        ×
      </button>

      <style jsx>{`
        .toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
          background: white;
          min-width: 300px;
          max-width: 420px;
          pointer-events: auto;
          position: relative;
          overflow: hidden;
        }

        .toast::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }

        .toast-success { border-left: 4px solid #22c55e; }
        .toast-success::before { background: #22c55e; }
        .toast-success .toast-icon { color: #22c55e; background: #dcfce7; }

        .toast-error { border-left: 4px solid #ef4444; }
        .toast-error::before { background: #ef4444; }
        .toast-error .toast-icon { color: #ef4444; background: #fee2e2; }

        .toast-warning { border-left: 4px solid #f59e0b; }
        .toast-warning::before { background: #f59e0b; }
        .toast-warning .toast-icon { color: #f59e0b; background: #fef3c7; }

        .toast-info { border-left: 4px solid #3b82f6; }
        .toast-info::before { background: #3b82f6; }
        .toast-info .toast-icon { color: #3b82f6; background: #dbeafe; }

        .toast-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-weight: 600;
          font-size: 14px;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .toast-message {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .toast-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #9ca3af;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          flex-shrink: 0;
          transition: color 0.2s;
        }

        .toast-close:hover {
          color: #4b5563;
        }

        .toast-enter {
          animation: slideIn 0.3s ease-out forwards;
        }

        .toast-exit {
          animation: slideOut 0.3s ease-in forwards;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// Toast Container
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}

      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 11000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        @media (max-width: 480px) {
          .toast-container {
            left: 10px;
            right: 10px;
            top: 10px;
          }
        }
      `}</style>
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: options.type || 'info',
      message: options.message || options,
      title: options.title,
      duration: options.duration !== undefined ? options.duration : 4000
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, options = {}) => addToast({ ...options, message, type: 'success' }),
    error: (message, options = {}) => addToast({ ...options, message, type: 'error' }),
    warning: (message, options = {}) => addToast({ ...options, message, type: 'warning' }),
    info: (message, options = {}) => addToast({ ...options, message, type: 'info' }),
    dismiss: removeToast,
    dismissAll: () => setToasts([])
  }, [addToast, removeToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default { ToastProvider, useToast };

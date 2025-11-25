import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

// Modal Context for nested modals and programmatic control
const ModalContext = createContext(null);

// Sizes configuration
const MODAL_SIZES = {
  small: '400px',
  medium: '560px',
  large: '720px',
  xlarge: '900px',
  fullscreen: '100%'
};

// Main Modal Component
export function Modal({
  isOpen,
  onClose,
  size = 'medium',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  preventScroll = true,
  className = '',
  children,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle body scroll lock
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, preventScroll]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      // Focus the modal after it opens
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 200);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Focus trap
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className={`modal-backdrop ${isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}`}
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={`modal-container modal-${size} ${isClosing ? 'modal-exit' : 'modal-enter'} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <ModalContext.Provider value={{ onClose: handleClose, showCloseButton }}>
          {children}
        </ModalContext.Provider>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 10001;
          backdrop-filter: blur(2px);
        }

        .modal-backdrop-enter {
          animation: backdropFadeIn 0.2s ease-out forwards;
        }

        .modal-backdrop-exit {
          animation: backdropFadeOut 0.2s ease-in forwards;
        }

        .modal-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 4px 20px rgba(0, 0, 0, 0.1);
          max-height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 10002;
          outline: none;
        }

        .modal-small { width: 100%; max-width: ${MODAL_SIZES.small}; }
        .modal-medium { width: 100%; max-width: ${MODAL_SIZES.medium}; }
        .modal-large { width: 100%; max-width: ${MODAL_SIZES.large}; }
        .modal-xlarge { width: 100%; max-width: ${MODAL_SIZES.xlarge}; }
        .modal-fullscreen {
          width: calc(100vw - 40px);
          height: calc(100vh - 40px);
          max-width: none;
          max-height: none;
          border-radius: 8px;
        }

        .modal-enter {
          animation: modalSlideIn 0.25s ease-out forwards;
        }

        .modal-exit {
          animation: modalSlideOut 0.2s ease-in forwards;
        }

        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes backdropFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalSlideOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
        }

        @media (max-width: 600px) {
          .modal-backdrop {
            padding: 10px;
          }

          .modal-container {
            max-height: calc(100vh - 20px);
            border-radius: 10px;
          }

          .modal-fullscreen {
            width: 100%;
            height: 100%;
            border-radius: 0;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Modal Header Component
export function ModalHeader({ children, className = '' }) {
  const context = useContext(ModalContext);

  return (
    <div className={`modal-header ${className}`}>
      <div className="modal-title">{children}</div>
      {context?.showCloseButton && (
        <button
          className="modal-close"
          onClick={context.onClose}
          aria-label="Close modal"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      <style jsx>{`
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
        }

        .modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.15s ease;
          margin: -4px -8px -4px 12px;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-close:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 600px) {
          .modal-header {
            padding: 16px 18px;
          }

          .modal-title {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

// Modal Body Component
export function ModalBody({ children, className = '', noPadding = false }) {
  return (
    <div className={`modal-body ${noPadding ? 'no-padding' : ''} ${className}`}>
      {children}

      <style jsx>{`
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }

        .modal-body.no-padding {
          padding: 0;
        }

        @media (max-width: 600px) {
          .modal-body {
            padding: 18px;
          }
        }
      `}</style>
    </div>
  );
}

// Modal Footer Component
export function ModalFooter({ children, className = '', align = 'right' }) {
  return (
    <div className={`modal-footer modal-footer-${align} ${className}`}>
      {children}

      <style jsx>{`
        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 18px 24px;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0;
          background: #fafafa;
        }

        .modal-footer-left {
          justify-content: flex-start;
        }

        .modal-footer-center {
          justify-content: center;
        }

        .modal-footer-right {
          justify-content: flex-end;
        }

        .modal-footer-between {
          justify-content: space-between;
        }

        @media (max-width: 600px) {
          .modal-footer {
            padding: 16px 18px;
            flex-direction: column-reverse;
          }

          .modal-footer :global(.btn) {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Confirm Modal Preset
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  danger = false,
  icon
}) {
  const handleConfirm = async () => {
    await onConfirm?.();
  };

  const variant = danger ? 'danger' : confirmVariant;
  const defaultIcon = danger ? '⚠️' : '❓';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small">
      <ModalBody>
        <div className="confirm-content">
          <div className="confirm-icon">{icon || defaultIcon}</div>
          <h3 className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
        </div>

        <style jsx>{`
          .confirm-content {
            text-align: center;
            padding: 12px 0;
          }

          .confirm-icon {
            font-size: 48px;
            margin-bottom: 16px;
            line-height: 1;
          }

          .confirm-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 8px;
          }

          .confirm-message {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            line-height: 1.5;
          }
        `}</style>
      </ModalBody>
      <ModalFooter align="center">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={handleConfirm} loading={loading}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// Alert Modal Preset
export function AlertModal({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  buttonText = 'OK',
  type = 'info',
  icon
}) {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="small" showCloseButton={false}>
      <ModalBody>
        <div className="alert-content">
          <div className="alert-icon">{icon || icons[type]}</div>
          <h3 className="alert-title">{title}</h3>
          {message && <p className="alert-message">{message}</p>}
        </div>

        <style jsx>{`
          .alert-content {
            text-align: center;
            padding: 12px 0;
          }

          .alert-icon {
            font-size: 48px;
            margin-bottom: 16px;
            line-height: 1;
          }

          .alert-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 8px;
          }

          .alert-message {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            line-height: 1.5;
          }
        `}</style>
      </ModalBody>
      <ModalFooter align="center">
        <Button onClick={onClose}>{buttonText}</Button>
      </ModalFooter>
    </Modal>
  );
}

// useModal Hook for programmatic control
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState(null);

  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData
  };
}

// useConfirm Hook for confirmation dialogs
export function useConfirm() {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    danger: false,
    loading: false,
    resolve: null
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        danger: options.danger || false,
        loading: false,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    state.resolve?.(true);
    setState(prev => ({ ...prev, isOpen: false, loading: false }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const ConfirmDialog = (
    <ConfirmModal
      isOpen={state.isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      danger={state.danger}
      loading={state.loading}
    />
  );

  return { confirm, ConfirmDialog };
}

export default Modal;

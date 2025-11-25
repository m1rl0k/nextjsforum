import { useState } from 'react';

const ALERT_TYPES = {
  error: {
    icon: '✕',
    className: 'alert-error',
    defaultTitle: 'Error'
  },
  success: {
    icon: '✓',
    className: 'alert-success',
    defaultTitle: 'Success'
  },
  warning: {
    icon: '⚠',
    className: 'alert-warning',
    defaultTitle: 'Warning'
  },
  info: {
    icon: 'ℹ',
    className: 'alert-info',
    defaultTitle: 'Info'
  }
};

export default function Alert({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className = ''
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = ALERT_TYPES[type] || ALERT_TYPES.info;

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div className={`alert ${config.className} ${className}`} role="alert">
      <div className="alert-icon">{config.icon}</div>
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{children}</div>
      </div>
      {dismissible && (
        <button
          className="alert-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}

      <style jsx>{`
        .alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 8px;
          border-left: 4px solid;
          margin-bottom: 16px;
        }

        .alert-error {
          background: #fef2f2;
          border-color: #ef4444;
          color: #991b1b;
        }
        .alert-error .alert-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .alert-success {
          background: #f0fdf4;
          border-color: #22c55e;
          color: #166534;
        }
        .alert-success .alert-icon {
          background: #dcfce7;
          color: #16a34a;
        }

        .alert-warning {
          background: #fffbeb;
          border-color: #f59e0b;
          color: #92400e;
        }
        .alert-warning .alert-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .alert-info {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1e40af;
        }
        .alert-info .alert-icon {
          background: #dbeafe;
          color: #2563eb;
        }

        .alert-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .alert-content {
          flex: 1;
          min-width: 0;
        }

        .alert-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .alert-message {
          font-size: 14px;
          line-height: 1.5;
        }

        .alert-dismiss {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.6;
          transition: opacity 0.2s;
          flex-shrink: 0;
          color: inherit;
        }

        .alert-dismiss:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// Inline error message for forms
export function FormError({ children, className = '' }) {
  if (!children) return null;

  return (
    <div className={`form-error ${className}`}>
      <span className="form-error-icon">!</span>
      <span className="form-error-text">{children}</span>

      <style jsx>{`
        .form-error {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #dc2626;
          font-size: 13px;
          margin-top: 6px;
        }

        .form-error-icon {
          width: 16px;
          height: 16px;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .form-error-text {
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}

// Success inline message
export function FormSuccess({ children, className = '' }) {
  if (!children) return null;

  return (
    <div className={`form-success ${className}`}>
      <span className="form-success-icon">✓</span>
      <span>{children}</span>

      <style jsx>{`
        .form-success {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #16a34a;
          font-size: 13px;
          margin-top: 6px;
        }

        .form-success-icon {
          width: 16px;
          height: 16px;
          background: #16a34a;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

import { forwardRef } from 'react';
import { Spinner } from './Loading';

const Button = forwardRef(function Button({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  type = 'button',
  className = '',
  ...props
}, ref) {
  const isDisabled = disabled || loading;

  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    warning: 'btn-warning',
    ghost: 'btn-ghost',
    link: 'btn-link'
  };

  const sizes = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg'
  };

  const classes = [
    'btn',
    variants[variant] || variants.primary,
    sizes[size] || sizes.medium,
    fullWidth ? 'btn-full' : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <span className="btn-spinner">
          <Spinner size="small" color="currentColor" />
        </span>
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn-icon">{icon}</span>
      )}
      <span className="btn-text">{children}</span>
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn-icon">{icon}</span>
      )}

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
          font-family: inherit;
        }

        .btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Sizes */
        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        .btn-md {
          padding: 10px 18px;
          font-size: 14px;
        }

        .btn-lg {
          padding: 14px 24px;
          font-size: 16px;
        }

        .btn-full {
          width: 100%;
        }

        /* Variants */
        .btn-primary {
          background: var(--primary-color, #2563eb);
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, #1d4ed8);
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }
        .btn-danger:hover:not(:disabled) {
          background: #b91c1c;
        }

        .btn-success {
          background: #16a34a;
          color: white;
        }
        .btn-success:hover:not(:disabled) {
          background: #15803d;
        }

        .btn-warning {
          background: #d97706;
          color: white;
        }
        .btn-warning:hover:not(:disabled) {
          background: #b45309;
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-color, #374151);
          border: 1px solid #d1d5db;
        }
        .btn-ghost:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .btn-link {
          background: transparent;
          color: var(--link-color, #2563eb);
          padding: 0;
        }
        .btn-link:hover:not(:disabled) {
          text-decoration: underline;
        }

        .btn-loading {
          position: relative;
        }

        .btn-spinner {
          display: flex;
          align-items: center;
        }

        .btn-icon {
          display: flex;
          align-items: center;
          font-size: 1.1em;
        }

        .btn-text {
          display: inline-block;
        }
      `}</style>
    </button>
  );
});

export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`btn-group ${className}`}>
      {children}

      <style jsx>{`
        .btn-group {
          display: inline-flex;
          gap: 8px;
        }

        .btn-group :global(.btn) {
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'medium',
  ...props
}) {
  const sizes = {
    small: { padding: '6px', fontSize: '14px' },
    medium: { padding: '8px', fontSize: '18px' },
    large: { padding: '10px', fontSize: '22px' }
  };

  return (
    <button
      className={`icon-btn icon-btn-${variant}`}
      aria-label={label}
      title={label}
      style={sizes[size]}
      {...props}
    >
      {icon}

      <style jsx>{`
        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #6b7280;
        }

        .icon-btn:hover:not(:disabled) {
          background: #f3f4f6;
          color: #374151;
        }

        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icon-btn-danger:hover:not(:disabled) {
          background: #fee2e2;
          color: #dc2626;
        }

        .icon-btn-primary:hover:not(:disabled) {
          background: #dbeafe;
          color: #2563eb;
        }
      `}</style>
    </button>
  );
}

export default Button;

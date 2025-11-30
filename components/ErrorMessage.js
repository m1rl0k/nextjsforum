import styles from '../styles/ErrorMessage.module.css';

/**
 * ErrorMessage - A reusable error message component with vBulletin styling
 * @param {string} message - The error message to display
 * @param {string} type - 'error' | 'warning' | 'info' (default: 'error')
 * @param {function} onRetry - Optional retry callback
 * @param {function} onDismiss - Optional dismiss callback
 */
const ErrorMessage = ({ message, type = 'error', onRetry, onDismiss, className }) => {
  if (!message) return null;

  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`${styles.container} ${styles[type]} ${className || ''}`}>
      <span className={styles.icon}>{icons[type]}</span>
      <span className={styles.message}>{message}</span>
      <div className={styles.actions}>
        {onRetry && (
          <button onClick={onRetry} className={styles.retryBtn}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} className={styles.dismissBtn}>
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;


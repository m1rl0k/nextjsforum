import React from 'react';
import styles from '../styles/ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorBox}>
            <div className={styles.errorHeader}>
              <span className={styles.errorIcon}>⚠️</span>
              <h2>Something went wrong</h2>
            </div>
            <p className={styles.errorMessage}>
              {this.props.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error Details</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <div className={styles.errorActions}>
              <button onClick={this.handleRetry} className={styles.retryButton}>
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className={styles.homeButton}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


// Loading spinner and skeleton components

export function Spinner({ size = 'medium', color = 'var(--primary-color)' }) {
  const sizes = {
    small: 16,
    medium: 24,
    large: 40
  };

  const pixelSize = sizes[size] || sizes.medium;

  return (
    <div className="spinner" style={{ width: pixelSize, height: pixelSize }}>
      <style jsx>{`
        .spinner {
          border: 3px solid #e5e7eb;
          border-top-color: ${color};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner size="large" />
        <span className="loading-message">{message}</span>
      </div>

      <style jsx>{`
        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(2px);
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-message {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export function LoadingPage({ message = 'Loading...' }) {
  return (
    <div className="loading-page">
      <Spinner size="large" />
      <span className="loading-message">{message}</span>

      <style jsx>{`
        .loading-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          gap: 16px;
        }

        .loading-message {
          font-size: 14px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

export function LoadingButton({ loading, children, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="button-loading">
          <Spinner size="small" color="currentColor" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}

      <style jsx>{`
        .button-loading {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </button>
  );
}

// Skeleton loaders
export function SkeletonText({ width = '100%', height = 16 }) {
  return (
    <div className="skeleton-text" style={{ width, height }}>
      <style jsx>{`
        .skeleton-text {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }) {
  return (
    <div className="skeleton-avatar" style={{ width: size, height: size }}>
      <style jsx>{`
        .skeleton-avatar {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 50%;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-header">
        <SkeletonAvatar size={40} />
        <div className="skeleton-info">
          <SkeletonText width="60%" height={14} />
          <SkeletonText width="40%" height={12} />
        </div>
      </div>
      <SkeletonText width="100%" height={12} />
      <SkeletonText width="90%" height={12} />
      <SkeletonText width="70%" height={12} />

      <style jsx>{`
        .skeleton-card {
          padding: 16px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .skeleton-header {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .skeleton-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-card > :global(.skeleton-text) {
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}

export function SkeletonThreadList({ count = 5 }) {
  return (
    <div className="skeleton-thread-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-thread-item">
          <div className="skeleton-thread-main">
            <SkeletonText width="70%" height={16} />
            <SkeletonText width="50%" height={12} />
          </div>
          <div className="skeleton-thread-stats">
            <SkeletonText width={40} height={12} />
            <SkeletonText width={40} height={12} />
          </div>
        </div>
      ))}

      <style jsx>{`
        .skeleton-thread-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #e5e7eb;
        }

        .skeleton-thread-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: white;
        }

        .skeleton-thread-main {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .skeleton-thread-stats {
          display: flex;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}

export default {
  Spinner,
  LoadingOverlay,
  LoadingPage,
  LoadingButton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonThreadList
};

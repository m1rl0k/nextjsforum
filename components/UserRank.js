import { useState, useEffect } from 'react';

export default function UserRank({ postCount, showProgress = false, size = 'normal' }) {
  const [rankInfo, setRankInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const res = await fetch(`/api/user-ranks?postCount=${postCount || 0}`);
        if (res.ok) {
          const data = await res.json();
          setRankInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch rank:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, [postCount]);

  if (loading || !rankInfo) {
    return null;
  }

  const { current, next, progress, postsToNextRank } = rankInfo;

  const sizeStyles = {
    small: { fontSize: '11px', padding: '2px 6px' },
    normal: { fontSize: '12px', padding: '3px 8px' },
    large: { fontSize: '14px', padding: '4px 12px' }
  };

  return (
    <div className="user-rank">
      <span
        className="rank-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: current.color + '20',
          color: current.color,
          borderRadius: '4px',
          fontWeight: '500',
          border: `1px solid ${current.color}40`,
          ...sizeStyles[size]
        }}
      >
        <span>{current.icon}</span>
        <span>{current.name}</span>
      </span>

      {showProgress && next && (
        <div className="rank-progress" style={{ marginTop: '8px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#666',
            marginBottom: '4px'
          }}>
            <span>{current.name}</span>
            <span>{next.name}</span>
          </div>
          <div style={{
            height: '6px',
            backgroundColor: '#e0e0e0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: current.color,
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            fontSize: '10px',
            color: '#888',
            marginTop: '4px',
            textAlign: 'center'
          }}>
            {postsToNextRank} more post{postsToNextRank !== 1 ? 's' : ''} to {next.name}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple badge version for use in posts
export function RankBadge({ postCount, size = 'small' }) {
  const [rank, setRank] = useState(null);

  useEffect(() => {
    const fetchRank = async () => {
      try {
        const res = await fetch(`/api/user-ranks?postCount=${postCount || 0}`);
        if (res.ok) {
          const data = await res.json();
          setRank(data.current);
        }
      } catch (err) {
        // Silently fail
      }
    };

    fetchRank();
  }, [postCount]);

  if (!rank) return null;

  const sizeStyles = {
    small: { fontSize: '10px', padding: '1px 4px' },
    normal: { fontSize: '11px', padding: '2px 6px' }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        backgroundColor: rank.color + '20',
        color: rank.color,
        borderRadius: '3px',
        fontWeight: '500',
        ...sizeStyles[size]
      }}
      title={`${rank.name} - ${postCount} posts`}
    >
      <span style={{ fontSize: size === 'small' ? '9px' : '10px' }}>{rank.icon}</span>
      <span>{rank.name}</span>
    </span>
  );
}

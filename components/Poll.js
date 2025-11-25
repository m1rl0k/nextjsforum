import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Poll({ threadId, pollId }) {
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data);
        setShowResults(data.hasVoted || data.hasEnded || data.showResults);
      } else {
        setError('Failed to load poll');
      }
    } catch (err) {
      setError('Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (optionId) => {
    if (poll.allowMultiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      setError('Please select an option');
      return;
    }

    setVoting(true);
    setError('');

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ optionIds: selectedOptions })
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh poll data
        await fetchPoll();
        setShowResults(true);
      } else {
        setError(data.error || 'Failed to vote');
      }
    } catch (err) {
      setError('Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  const handleChangeVote = async () => {
    setVoting(true);
    setError('');

    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        setSelectedOptions([]);
        setShowResults(false);
        await fetchPoll();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove vote');
      }
    } catch (err) {
      setError('Failed to remove vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="poll-container" style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>Loading poll...</div>
      </div>
    );
  }

  if (!poll) {
    return null;
  }

  const canVote = user && !poll.hasVoted && !poll.hasEnded;
  const canChangeVote = user && poll.hasVoted && !poll.hasEnded;

  return (
    <div className="poll-container" style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #ddd'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--primary-color)' }}>
        📊 {poll.question}
      </h3>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {poll.hasEnded && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#fff3e0',
          color: '#e65100',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          This poll has ended
        </div>
      )}

      <div className="poll-options" style={{ marginBottom: '15px' }}>
        {poll.options.map(option => (
          <div key={option.id} style={{ marginBottom: '10px' }}>
            {showResults ? (
              // Show results
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px',
                  fontSize: '14px'
                }}>
                  <span style={{
                    fontWeight: poll.userVotes?.includes(option.id) ? 'bold' : 'normal'
                  }}>
                    {poll.userVotes?.includes(option.id) && '✓ '}
                    {option.text}
                  </span>
                  <span style={{ color: '#666' }}>
                    {option.voteCount} vote{option.voteCount !== 1 ? 's' : ''} ({option.percentage}%)
                  </span>
                </div>
                <div style={{
                  height: '24px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${option.percentage}%`,
                    backgroundColor: poll.userVotes?.includes(option.id) ? 'var(--primary-color)' : '#4caf50',
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ) : (
              // Show voting options
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 15px',
                backgroundColor: selectedOptions.includes(option.id) ? '#e3f2fd' : '#fff',
                border: `1px solid ${selectedOptions.includes(option.id) ? 'var(--primary-color)' : '#ddd'}`,
                borderRadius: '4px',
                cursor: canVote ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}>
                <input
                  type={poll.allowMultiple ? 'checkbox' : 'radio'}
                  name={`poll-${poll.id}`}
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => canVote && handleOptionChange(option.id)}
                  disabled={!canVote}
                  style={{ marginRight: '10px' }}
                />
                <span>{option.text}</span>
              </label>
            )}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #ddd',
        paddingTop: '15px'
      }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          Total votes: {poll.totalVotes}
          {poll.endsAt && !poll.hasEnded && (
            <span> • Ends: {new Date(poll.endsAt).toLocaleDateString()}</span>
          )}
          {poll.allowMultiple && <span> • Multiple choices allowed</span>}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {!showResults && !poll.hasVoted && (
            <button
              onClick={() => setShowResults(true)}
              className="button"
              style={{ backgroundColor: '#666', fontSize: '13px', padding: '6px 12px' }}
            >
              View Results
            </button>
          )}

          {showResults && !poll.hasVoted && !poll.hasEnded && (
            <button
              onClick={() => setShowResults(false)}
              className="button"
              style={{ backgroundColor: '#666', fontSize: '13px', padding: '6px 12px' }}
            >
              Hide Results
            </button>
          )}

          {canVote && !showResults && (
            <button
              onClick={handleVote}
              disabled={voting || selectedOptions.length === 0}
              className="button"
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              {voting ? 'Voting...' : 'Vote'}
            </button>
          )}

          {canChangeVote && (
            <button
              onClick={handleChangeVote}
              disabled={voting}
              className="button"
              style={{ backgroundColor: '#ff9800', fontSize: '13px', padding: '6px 12px' }}
            >
              {voting ? 'Removing...' : 'Change Vote'}
            </button>
          )}

          {!user && !poll.hasEnded && (
            <span style={{ fontSize: '13px', color: '#666' }}>
              <a href="/login">Log in</a> to vote
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

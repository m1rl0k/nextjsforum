import { useState } from 'react';

export default function PollCreator({ onPollChange }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');

  const updatePoll = (updates = {}) => {
    const validOptions = options.filter(opt => opt.trim().length > 0);
    const pollData = {
      question: updates.question !== undefined ? updates.question : question,
      options: updates.options !== undefined ? updates.options.filter(opt => opt.trim().length > 0) : validOptions,
      allowMultiple: updates.allowMultiple !== undefined ? updates.allowMultiple : allowMultiple,
      showResults: updates.showResults !== undefined ? updates.showResults : showResults,
      endsAt: (updates.hasEndDate !== undefined ? updates.hasEndDate : hasEndDate)
        ? (updates.endDate || endDate)
        : null
    };

    // Only send valid poll data
    if (pollData.question.trim() && pollData.options.length >= 2) {
      onPollChange(pollData);
    } else {
      onPollChange(null);
    }
  };

  const handleQuestionChange = (e) => {
    const value = e.target.value;
    setQuestion(value);
    updatePoll({ question: value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    updatePoll({ options: newOptions });
  };

  const addOption = () => {
    if (options.length < 10) {
      const newOptions = [...options, ''];
      setOptions(newOptions);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      updatePoll({ options: newOptions });
    }
  };

  const handleAllowMultipleChange = (e) => {
    const value = e.target.checked;
    setAllowMultiple(value);
    updatePoll({ allowMultiple: value });
  };

  const handleShowResultsChange = (e) => {
    const value = e.target.checked;
    setShowResults(value);
    updatePoll({ showResults: value });
  };

  const handleHasEndDateChange = (e) => {
    const value = e.target.checked;
    setHasEndDate(value);
    updatePoll({ hasEndDate: value });
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setEndDate(value);
    updatePoll({ endDate: value });
  };

  return (
    <div className="poll-creator" style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #ddd',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--primary-color)' }}>
        📊 Create Poll
      </h3>

      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
          Poll Question *
        </label>
        <input
          type="text"
          value={question}
          onChange={handleQuestionChange}
          placeholder="What would you like to ask?"
          className="form-input"
          style={{ width: '100%', padding: '10px' }}
          maxLength={255}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
          Options * (minimum 2, maximum 10)
        </label>
        {options.map((option, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '10px',
            alignItems: 'center'
          }}>
            <span style={{ color: '#666', minWidth: '25px' }}>{index + 1}.</span>
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="form-input"
              style={{ flex: 1, padding: '8px' }}
              maxLength={100}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c62828',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '5px'
                }}
                title="Remove option"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            className="button"
            style={{
              backgroundColor: '#666',
              fontSize: '13px',
              padding: '6px 12px',
              marginTop: '5px'
            }}
          >
            + Add Option
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        borderTop: '1px solid #ddd',
        paddingTop: '15px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={handleAllowMultipleChange}
          />
          <span>Allow multiple choices</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showResults}
            onChange={handleShowResultsChange}
          />
          <span>Show results before voting</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={hasEndDate}
            onChange={handleHasEndDateChange}
          />
          <span>Set end date</span>
        </label>
      </div>

      {hasEndDate && (
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
            Poll ends at:
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={handleEndDateChange}
            className="form-input"
            style={{ padding: '8px' }}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      )}

      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#1565c0'
      }}>
        Fill in the poll question and at least 2 options to create a poll with your thread.
      </div>
    </div>
  );
}

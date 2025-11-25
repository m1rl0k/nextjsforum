import { useState, useEffect, useCallback } from 'react';

export default function Captcha({ onVerify, required = true }) {
  const [captchaId, setCaptchaId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const res = await fetch('/api/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaId(data.captchaId);
        setQuestion(data.question);
        onVerify({ captchaId: data.captchaId, answer: '' });
      } else {
        setError('Failed to load captcha');
      }
    } catch (err) {
      setError('Failed to load captcha');
    } finally {
      setLoading(false);
    }
  }, [onVerify]);

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    onVerify({ captchaId, answer: value });
  };

  const handleRefresh = (e) => {
    e.preventDefault();
    fetchCaptcha();
  };

  if (loading) {
    return (
      <div className="captcha-container" style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <span style={{ color: '#666' }}>Loading captcha...</span>
      </div>
    );
  }

  return (
    <div className="captcha-container" style={{
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #ddd'
    }}>
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: '500' }}>Security Check:</span>
        <span style={{
          padding: '5px 15px',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '16px'
        }}>
          {question}
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '5px'
          }}
          title="Get new question"
        >
          🔄
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="captcha-answer" style={{ fontWeight: '500' }}>Answer:</label>
        <input
          id="captcha-answer"
          type="text"
          value={answer}
          onChange={handleAnswerChange}
          placeholder="Enter the answer"
          required={required}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '100px',
            fontSize: '14px'
          }}
          autoComplete="off"
        />
      </div>

      {error && (
        <div style={{ color: '#c62828', fontSize: '12px', marginTop: '8px' }}>
          {error}
        </div>
      )}

      {/* Hidden honeypot field */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex="-1"
          autoComplete="off"
        />
      </div>
    </div>
  );
}

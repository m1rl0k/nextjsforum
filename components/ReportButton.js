import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ReportButton({ type, targetId, targetTitle }) {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    reason: '',
    description: ''
  });

  const reasons = {
    thread: [
      'Spam or advertising',
      'Inappropriate content',
      'Harassment or abuse',
      'Copyright violation',
      'Off-topic content',
      'Duplicate thread',
      'Other'
    ],
    post: [
      'Spam or advertising',
      'Inappropriate content',
      'Harassment or abuse',
      'Off-topic reply',
      'Personal attack',
      'Misinformation',
      'Other'
    ],
    user: [
      'Harassment or abuse',
      'Spam behavior',
      'Inappropriate profile',
      'Impersonation',
      'Trolling',
      'Other'
    ]
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      setError('Please select a reason for reporting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId,
          reason: formData.reason,
          description: formData.description
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Report submitted successfully. Thank you for helping keep our community safe.');
        setFormData({ reason: '', description: '' });
        setTimeout(() => {
          setShowModal(false);
          setMessage('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isAuthenticated) {
    return null; // Don't show report button to guests
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="report-button"
        title={`Report this ${type}`}
      >
        🚩 Report
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚩 Report {type}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="close-button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {targetTitle && (
                <div className="report-target">
                  <strong>Reporting:</strong> {targetTitle}
                </div>
              )}

              {message && <div className="success">{message}</div>}
              {error && <div className="error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="reason">Reason for reporting *</label>
                  <select
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select a reason...</option>
                    {reasons[type]?.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Additional details (optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Provide additional context about why you're reporting this content..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="button primary"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="report-info">
                <h4>ℹ️ What happens next?</h4>
                <ul>
                  <li>Your report will be reviewed by our moderation team</li>
                  <li>We'll take appropriate action if the content violates our rules</li>
                  <li>You'll be notified of the outcome if necessary</li>
                  <li>False reports may result in account restrictions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .report-button {
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 4px 8px;
          border-radius: 3px;
          transition: background-color 0.2s;
        }

        .report-button:hover {
          background: #f8f9fa;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h3 {
          margin: 0;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 20px;
        }

        .report-target {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-select,
        .form-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .button {
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: white;
          color: #333;
          border-radius: 4px;
          cursor: pointer;
        }

        .button.primary {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .report-info {
          background: #e9ecef;
          padding: 15px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .report-info h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .report-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .report-info li {
          margin-bottom: 5px;
          color: #666;
        }

        .success {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
      `}</style>
    </>
  );
}

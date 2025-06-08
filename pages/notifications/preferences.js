import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        setMessage('Failed to load preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage('Error loading preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage('Preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="preferences-page">
          <div className="loading">Loading preferences...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="preferences-page">
        <div className="page-header">
          <Link href="/notifications" className="back-link">
            ← Back to Notifications
          </Link>
          <h1>🔔 Notification Preferences</h1>
          <p>Control how and when you receive notifications</p>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="preferences-form">
          <div className="preference-section">
            <h2>📧 Email Notifications</h2>
            <p>Receive notifications via email</p>
            
            <div className="preference-group">
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.emailThreadReply || false}
                  onChange={(e) => updatePreference('emailThreadReply', e.target.checked)}
                />
                <span>Thread replies - When someone replies to your thread</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.emailPostReply || false}
                  onChange={(e) => updatePreference('emailPostReply', e.target.checked)}
                />
                <span>Post replies - When someone replies to your post</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.emailMentions || false}
                  onChange={(e) => updatePreference('emailMentions', e.target.checked)}
                />
                <span>Mentions - When someone mentions you in a post</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.emailMessages || false}
                  onChange={(e) => updatePreference('emailMessages', e.target.checked)}
                />
                <span>Private messages - When you receive a private message</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.emailModeration || false}
                  onChange={(e) => updatePreference('emailModeration', e.target.checked)}
                />
                <span>Moderation actions - When moderators take action on your content</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.emailSystem || false}
                  onChange={(e) => updatePreference('emailSystem', e.target.checked)}
                />
                <span>System alerts - Important announcements and updates</span>
              </label>
            </div>

            <div className="email-digest-section">
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.emailDigest || false}
                  onChange={(e) => updatePreference('emailDigest', e.target.checked)}
                />
                <span>Email digest - Receive a summary instead of individual emails</span>
              </label>

              {preferences?.emailDigest && (
                <div className="digest-frequency">
                  <label>
                    Digest frequency:
                    <select
                      value={preferences?.digestFrequency || 'daily'}
                      onChange={(e) => updatePreference('digestFrequency', e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="never">Never</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="preference-section">
            <h2>🔔 Browser Notifications</h2>
            <p>Receive notifications in your browser</p>
            
            <div className="preference-group">
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.browserThreadReply || false}
                  onChange={(e) => updatePreference('browserThreadReply', e.target.checked)}
                />
                <span>Thread replies</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.browserPostReply || false}
                  onChange={(e) => updatePreference('browserPostReply', e.target.checked)}
                />
                <span>Post replies</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.browserMentions || false}
                  onChange={(e) => updatePreference('browserMentions', e.target.checked)}
                />
                <span>Mentions</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.browserMessages || false}
                  onChange={(e) => updatePreference('browserMessages', e.target.checked)}
                />
                <span>Private messages</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.browserModeration || false}
                  onChange={(e) => updatePreference('browserModeration', e.target.checked)}
                />
                <span>Moderation actions</span>
              </label>

              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={preferences?.browserSystem || false}
                  onChange={(e) => updatePreference('browserSystem', e.target.checked)}
                />
                <span>System alerts</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button 
              onClick={savePreferences}
              disabled={saving}
              className="button primary"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .preferences-page {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--border-color);
        }

        .back-link {
          color: var(--primary-color);
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 10px;
          display: inline-block;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .page-header h1 {
          margin: 10px 0;
          color: var(--text-color);
        }

        .page-header p {
          color: #666;
          margin: 0;
        }

        .message {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .preferences-form {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .preference-section {
          padding: 25px;
          border-bottom: 1px solid var(--border-color);
        }

        .preference-section:last-child {
          border-bottom: none;
        }

        .preference-section h2 {
          margin: 0 0 8px 0;
          color: var(--text-color);
          font-size: 1.2rem;
        }

        .preference-section > p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .preference-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .preference-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          padding: 8px 0;
        }

        .preference-item input[type="checkbox"] {
          margin-top: 2px;
          cursor: pointer;
        }

        .preference-item span {
          flex: 1;
          line-height: 1.4;
        }

        .email-digest-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .digest-frequency {
          margin-top: 15px;
          margin-left: 24px;
        }

        .digest-frequency label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          color: #666;
        }

        .digest-frequency select {
          padding: 4px 8px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .form-actions {
          padding: 25px;
          background: #f8f9fa;
          text-align: center;
        }

        .button {
          padding: 12px 24px;
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-color);
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .button:hover {
          background: #f5f5f5;
        }

        .button.primary {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .button.primary:hover {
          background: var(--primary-color-dark);
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .preferences-page {
            padding: 15px;
          }

          .preference-section {
            padding: 20px 15px;
          }

          .form-actions {
            padding: 20px 15px;
          }
        }
      `}</style>
    </Layout>
  );
}

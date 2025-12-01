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
          padding: 10px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          font-size: 11px;
        }

        .page-header {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          padding: 8px 12px;
          border: 1px solid #6B84AA;
          border-bottom: none;
        }

        .back-link {
          color: #FFFFFF;
          text-decoration: none;
          font-size: 10px;
          margin-bottom: 5px;
          display: inline-block;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .page-header h1 {
          margin: 5px 0;
          font-size: 12px;
          font-weight: bold;
        }

        .page-header p {
          color: #D0D0D0;
          margin: 0;
          font-size: 10px;
        }

        .message {
          padding: 8px 12px;
          margin-bottom: 10px;
          font-size: 11px;
          border: 1px solid;
        }

        .message.success {
          background: #D4EDDA;
          color: #155724;
          border-color: #C3E6CB;
        }

        .message.error {
          background: #F8D7DA;
          color: #721C24;
          border-color: #F5C6CB;
        }

        .loading {
          text-align: center;
          padding: 30px;
          color: #666;
        }

        .preferences-form {
          background: #F5F5F5;
          border: 1px solid #6B84AA;
          border-top: none;
        }

        .preference-section {
          padding: 15px;
          border-bottom: 1px solid #C0C0C0;
          background: white;
          margin: 8px;
          border: 1px solid #C0C0C0;
        }

        .preference-section:last-of-type {
          margin-bottom: 0;
        }

        .preference-section h2 {
          margin: 0 0 5px 0;
          color: #22497D;
          font-size: 12px;
          font-weight: bold;
        }

        .preference-section > p {
          margin: 0 0 12px 0;
          color: #666;
          font-size: 10px;
        }

        .preference-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .preference-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          padding: 4px 0;
        }

        .preference-item input[type="checkbox"] {
          margin-top: 1px;
          cursor: pointer;
        }

        .preference-item span {
          flex: 1;
          line-height: 1.4;
        }

        .email-digest-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #E0E0E0;
        }

        .digest-frequency {
          margin-top: 10px;
          margin-left: 20px;
        }

        .digest-frequency label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #666;
        }

        .digest-frequency select {
          padding: 3px 6px;
          border: 1px solid #808080;
          font-size: 11px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }

        .form-actions {
          padding: 12px;
          background: #E5E5E5;
          text-align: center;
          border-top: 1px solid #C0C0C0;
        }

        .button {
          padding: 5px 15px;
          border: 1px solid #808080;
          background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
          color: #333;
          cursor: pointer;
          font-size: 11px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }

        .button:hover {
          background: linear-gradient(to bottom, #E0E0E0 0%, #D0D0D0 100%);
        }

        .button.primary {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          border-color: #2B4F81;
        }

        .button.primary:hover {
          background: linear-gradient(to bottom, #3A6090 0%, #1E3A5F 100%);
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .preferences-page {
            padding: 8px;
          }

          .preference-section {
            padding: 12px;
            margin: 5px;
          }

          .form-actions {
            padding: 10px;
          }
        }
      `}</style>
    </Layout>
  );
}

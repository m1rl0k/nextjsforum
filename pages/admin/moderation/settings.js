import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function ModerationSettings() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    requireApproval: false,
    newUserPostCount: 5,
    autoModeration: false,
    profanityFilter: false,
    spamDetection: false,
    linkModeration: false,
    imageModeration: false,
    reportThreshold: 3,
    autoLockReports: false,
    moderationQueue: true,
    emailNotifications: true,
    bannedWords: '',
    allowedDomains: '',
    trustedUserPostCount: 50,
    autoApproveImages: false,
    maxLinksPerPost: 3,
    minPostLength: 10,
    maxPostLength: 10000
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchSettings();
    }
  }, [isAuthenticated, user, loading, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/moderation/settings');
      
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...settings, ...data.settings });
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load moderation settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/admin/moderation/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (res.ok) {
        setSuccess('Moderation settings saved successfully!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save moderation settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="loading">Loading moderation settings...</div>
      </Layout>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <Layout title="Moderation Settings - Admin">
      <div className="moderation-settings">
        <div className="admin-header">
          <h1>⚙️ Moderation Settings</h1>
          <div className="admin-nav">
            <Link href="/admin/moderation" className="nav-link">← Back to Moderation</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="settings-form">
          <div className="settings-section">
            <h2>🔍 Content Approval</h2>
            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.requireApproval}
                  onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
                />
                Require approval for new content
              </label>
              <p className="setting-description">
                When enabled, all new posts and threads will require moderator approval before being visible.
              </p>
            </div>

            <div className="setting-group">
              <label className="input-label">
                New user post count threshold
                <input
                  type="number"
                  value={settings.newUserPostCount}
                  onChange={(e) => handleInputChange('newUserPostCount', parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="number-input"
                />
              </label>
              <p className="setting-description">
                Users with fewer than this many posts will have their content flagged for approval.
              </p>
            </div>

            <div className="setting-group">
              <label className="input-label">
                Trusted user post count
                <input
                  type="number"
                  value={settings.trustedUserPostCount}
                  onChange={(e) => handleInputChange('trustedUserPostCount', parseInt(e.target.value))}
                  min="0"
                  max="1000"
                  className="number-input"
                />
              </label>
              <p className="setting-description">
                Users with more than this many posts will bypass most moderation checks.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h2>🤖 Automatic Moderation</h2>
            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoModeration}
                  onChange={(e) => handleInputChange('autoModeration', e.target.checked)}
                />
                Enable automatic moderation
              </label>
              <p className="setting-description">
                Automatically flag or remove content based on the rules below.
              </p>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.profanityFilter}
                  onChange={(e) => handleInputChange('profanityFilter', e.target.checked)}
                />
                Profanity filter
              </label>
              <p className="setting-description">
                Automatically flag posts containing banned words.
              </p>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.spamDetection}
                  onChange={(e) => handleInputChange('spamDetection', e.target.checked)}
                />
                Spam detection
              </label>
              <p className="setting-description">
                Detect and flag potential spam content.
              </p>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.linkModeration}
                  onChange={(e) => handleInputChange('linkModeration', e.target.checked)}
                />
                Link moderation
              </label>
              <p className="setting-description">
                Flag posts with external links for review.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h2>📝 Content Rules</h2>
            <div className="setting-group">
              <label className="input-label">
                Minimum post length
                <input
                  type="number"
                  value={settings.minPostLength}
                  onChange={(e) => handleInputChange('minPostLength', parseInt(e.target.value))}
                  min="1"
                  max="1000"
                  className="number-input"
                />
              </label>
              <p className="setting-description">
                Minimum number of characters required for posts.
              </p>
            </div>

            <div className="setting-group">
              <label className="input-label">
                Maximum post length
                <input
                  type="number"
                  value={settings.maxPostLength}
                  onChange={(e) => handleInputChange('maxPostLength', parseInt(e.target.value))}
                  min="100"
                  max="50000"
                  className="number-input"
                />
              </label>
              <p className="setting-description">
                Maximum number of characters allowed for posts.
              </p>
            </div>

            <div className="setting-group">
              <label className="input-label">
                Maximum links per post
                <input
                  type="number"
                  value={settings.maxLinksPerPost}
                  onChange={(e) => handleInputChange('maxLinksPerPost', parseInt(e.target.value))}
                  min="0"
                  max="20"
                  className="number-input"
                />
              </label>
              <p className="setting-description">
                Maximum number of links allowed in a single post.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h2>🚨 Reports & Alerts</h2>
            <div className="setting-group">
              <label className="input-label">
                Report threshold
                <input
                  type="number"
                  value={settings.reportThreshold}
                  onChange={(e) => handleInputChange('reportThreshold', parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="number-input"
                />
              </label>
              <p className="setting-description">
                Number of reports needed to automatically flag content.
              </p>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoLockReports}
                  onChange={(e) => handleInputChange('autoLockReports', e.target.checked)}
                />
                Auto-lock heavily reported content
              </label>
              <p className="setting-description">
                Automatically lock threads that receive many reports.
              </p>
            </div>

            <div className="setting-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                />
                Email notifications for moderators
              </label>
              <p className="setting-description">
                Send email alerts to moderators for new reports and flagged content.
              </p>
            </div>
          </div>

          <div className="settings-section">
            <h2>📋 Word Lists</h2>
            <div className="setting-group">
              <label className="textarea-label">
                Banned words (one per line)
                <textarea
                  value={settings.bannedWords}
                  onChange={(e) => handleInputChange('bannedWords', e.target.value)}
                  rows="6"
                  className="textarea-input"
                  placeholder="Enter banned words, one per line..."
                />
              </label>
              <p className="setting-description">
                Posts containing these words will be flagged for review.
              </p>
            </div>

            <div className="setting-group">
              <label className="textarea-label">
                Allowed domains (one per line)
                <textarea
                  value={settings.allowedDomains}
                  onChange={(e) => handleInputChange('allowedDomains', e.target.value)}
                  rows="6"
                  className="textarea-input"
                  placeholder="example.com&#10;trusted-site.org&#10;..."
                />
              </label>
              <p className="setting-description">
                Links to these domains will bypass link moderation.
              </p>
            </div>
          </div>

          <div className="save-section">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="save-button"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .moderation-settings {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }

          .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }

          .settings-form {
            display: flex;
            flex-direction: column;
            gap: 30px;
          }

          .settings-section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .settings-section h2 {
            margin: 0 0 20px 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
          }

          .setting-group {
            margin-bottom: 25px;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            color: #333;
            cursor: pointer;
          }

          .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
          }

          .input-label {
            display: block;
            font-weight: 500;
            color: #333;
            margin-bottom: 5px;
          }

          .textarea-label {
            display: block;
            font-weight: 500;
            color: #333;
            margin-bottom: 5px;
          }

          .number-input {
            display: block;
            width: 120px;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            margin-top: 5px;
          }

          .textarea-input {
            display: block;
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            font-family: monospace;
            resize: vertical;
            margin-top: 5px;
          }

          .setting-description {
            margin: 8px 0 0 0;
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .save-section {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
          }

          .save-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            min-width: 150px;
          }

          .save-button:hover {
            background: #0056b3;
          }

          .save-button:disabled {
            background: #6c757d;
            cursor: not-allowed;
          }

          .nav-link {
            color: #007bff;
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid #007bff;
            border-radius: 4px;
          }

          .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }

          .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }

          .loading {
            text-align: center;
            padding: 40px;
            color: #666;
          }

          @media (max-width: 768px) {
            .admin-header {
              flex-direction: column;
              gap: 15px;
            }
            
            .settings-section {
              padding: 20px;
            }
            
            .number-input {
              width: 100%;
            }
          }
        `
      }} />
    </Layout>
  );
}

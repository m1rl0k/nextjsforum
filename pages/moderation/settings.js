import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/ModSettings.module.css';

export default function ModerationSettings() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    autoModeration: false,
    requireApproval: false,
    newUserPostThreshold: 5,
    profanityFilter: true,
    spamDetection: true,
    reportThreshold: 3,
    autoLockReports: false,
    emailNotifications: true,
    moderatorNotifications: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchSettings();
    }
  }, [isAuthenticated, user, loading, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/moderation/settings', {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data.settings }));
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

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/moderation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  if (loading || isLoading) {
    return (
      <ModerationLayout>
        <div className={styles.loading}>Loading moderation settings...</div>
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <ModerationLayout>
      <div className={styles.container}>
        {/* Breadcrumbs */}
        <div className={styles.breadcrumbs}>
          <a href="/moderation">Moderation</a>
          <span className={styles.separator}>›</span>
          <span>Settings</span>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <h1>Moderation Settings</h1>
          <p>Configure moderation rules and automation</p>
        </div>

        {/* Alerts */}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSave}>
          {/* Content Moderation Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Content Moderation</h2>
              <p>Configure how content is moderated</p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Auto-moderation</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="autoModeration"
                    checked={settings.autoModeration}
                    onChange={handleInputChange}
                  />
                  Enable automatic content moderation
                </label>
                <span className={styles.help}>Automatically moderate content based on rules</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Require Approval</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="requireApproval"
                    checked={settings.requireApproval}
                    onChange={handleInputChange}
                  />
                  Require approval for new posts
                </label>
                <span className={styles.help}>New posts require moderator approval before being visible</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>New User Post Threshold</label>
                <input
                  type="number"
                  name="newUserPostThreshold"
                  value={settings.newUserPostThreshold}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className={styles.input}
                  style={{ width: '80px' }}
                />
                <span className={styles.help}>Number of posts before new users bypass approval</span>
              </div>
            </div>
          </div>

          {/* Content Filtering Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Content Filtering</h2>
              <p>Configure content filtering options</p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Profanity Filter</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="profanityFilter"
                    checked={settings.profanityFilter}
                    onChange={handleInputChange}
                  />
                  Enable profanity filtering
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Spam Detection</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="spamDetection"
                    checked={settings.spamDetection}
                    onChange={handleInputChange}
                  />
                  Enable spam detection
                </label>
              </div>
            </div>
          </div>

          {/* Reports & Actions Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Reports &amp; Actions</h2>
              <p>Configure how reports are handled</p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Report Threshold</label>
                <input
                  type="number"
                  name="reportThreshold"
                  value={settings.reportThreshold}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  className={styles.input}
                  style={{ width: '80px' }}
                />
                <span className={styles.help}>Number of reports before content is automatically hidden</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Auto-lock Reported Content</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="autoLockReports"
                    checked={settings.autoLockReports}
                    onChange={handleInputChange}
                  />
                  Automatically lock content when report threshold is reached
                </label>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Notifications</h2>
              <p>Configure moderation notifications</p>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Notifications</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleInputChange}
                  />
                  Send email notifications for moderation actions
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Moderator Notifications</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="moderatorNotifications"
                    checked={settings.moderatorNotifications}
                    onChange={handleInputChange}
                  />
                  Notify moderators of new reports
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </ModerationLayout>
  );
}

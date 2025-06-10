import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminFormSection,
  AdminFormGroup,
  AdminLoading,
  AdminButton,
  AdminAlert
} from '../../components/admin/AdminComponents';

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
        <AdminLoading size="large" text="Loading moderation settings..." />
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="Moderation Settings"
        description="Configure moderation rules and automation"
        breadcrumbs={[
          { label: 'Moderation', href: '/moderation' },
          { label: 'Settings' }
        ]}
      />

      {error && <AdminAlert type="error">{error}</AdminAlert>}
      {success && <AdminAlert type="success">{success}</AdminAlert>}

      <form onSubmit={handleSave}>
        <AdminCard>
          <AdminFormSection 
            title="Content Moderation"
            description="Configure how content is moderated"
          >
            <AdminFormGroup 
              label="Auto-moderation"
              help="Automatically moderate content based on rules"
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="autoModeration"
                  checked={settings.autoModeration}
                  onChange={handleInputChange}
                />
                Enable automatic content moderation
              </label>
            </AdminFormGroup>

            <AdminFormGroup 
              label="Require Approval"
              help="New posts require moderator approval before being visible"
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="requireApproval"
                  checked={settings.requireApproval}
                  onChange={handleInputChange}
                />
                Require approval for new posts
              </label>
            </AdminFormGroup>

            <AdminFormGroup 
              label="New User Post Threshold"
              help="Number of posts before new users bypass approval"
            >
              <input
                type="number"
                name="newUserPostThreshold"
                value={settings.newUserPostThreshold}
                onChange={handleInputChange}
                min="0"
                max="100"
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  width: '100px'
                }}
              />
            </AdminFormGroup>
          </AdminFormSection>

          <AdminFormSection 
            title="Content Filtering"
            description="Configure content filtering options"
          >
            <AdminFormGroup label="Profanity Filter">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="profanityFilter"
                  checked={settings.profanityFilter}
                  onChange={handleInputChange}
                />
                Enable profanity filtering
              </label>
            </AdminFormGroup>

            <AdminFormGroup label="Spam Detection">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="spamDetection"
                  checked={settings.spamDetection}
                  onChange={handleInputChange}
                />
                Enable spam detection
              </label>
            </AdminFormGroup>
          </AdminFormSection>

          <AdminFormSection 
            title="Reports & Actions"
            description="Configure how reports are handled"
          >
            <AdminFormGroup 
              label="Report Threshold"
              help="Number of reports before content is automatically hidden"
            >
              <input
                type="number"
                name="reportThreshold"
                value={settings.reportThreshold}
                onChange={handleInputChange}
                min="1"
                max="20"
                style={{
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  width: '100px'
                }}
              />
            </AdminFormGroup>

            <AdminFormGroup label="Auto-lock Reported Content">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="autoLockReports"
                  checked={settings.autoLockReports}
                  onChange={handleInputChange}
                />
                Automatically lock content when report threshold is reached
              </label>
            </AdminFormGroup>
          </AdminFormSection>

          <AdminFormSection 
            title="Notifications"
            description="Configure moderation notifications"
          >
            <AdminFormGroup label="Email Notifications">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleInputChange}
                />
                Send email notifications for moderation actions
              </label>
            </AdminFormGroup>

            <AdminFormGroup label="Moderator Notifications">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="moderatorNotifications"
                  checked={settings.moderatorNotifications}
                  onChange={handleInputChange}
                />
                Notify moderators of new reports
              </label>
            </AdminFormGroup>
          </AdminFormSection>

          <div style={{
            padding: '2rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc'
          }}>
            <AdminButton
              type="submit"
              variant="primary"
              loading={isSaving}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </AdminButton>
          </div>
        </AdminCard>
      </form>
    </ModerationLayout>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function AccountSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    website: '',
    signature: '',
    avatar: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    
    // Load current user data
    setFormData({
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      signature: user.signature || '',
      avatar: user.avatar || '',
      displayName: user.displayName || ''
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.location && formData.location.length > 100) {
      newErrors.location = 'Location must be less than 100 characters';
    }

    if (formData.website && formData.website.trim() && !isValidUrl(formData.website)) {
      newErrors.website = 'Website must be a valid URL';
    }

    if (formData.signature && formData.signature.length > 200) {
      newErrors.signature = 'Signature must be less than 200 characters';
    }

    if (formData.avatar && formData.avatar.trim() && !isValidUrl(formData.avatar)) {
      newErrors.avatar = 'Avatar must be a valid URL';
    }

    if (formData.displayName && formData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess('Profile updated successfully!');
        // Optionally refresh user data in context
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout title="Account Settings">
      <div className="settings-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <Link href={`/profile/${user.username}`}>My Profile</Link> &raquo;
          <span> Settings</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Account Settings
          </div>
          
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            {error && (
              <div style={{ 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                padding: '10px', 
                marginBottom: '20px',
                border: '1px solid #ef5350',
                borderRadius: '3px'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                backgroundColor: '#e8f5e8', 
                color: '#2e7d32', 
                padding: '10px', 
                marginBottom: '20px',
                border: '1px solid #4caf50',
                borderRadius: '3px'
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bio">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className={`form-textarea ${errors.bio ? 'error' : ''}`}
                      placeholder="Tell us about yourself..."
                      rows="4"
                      maxLength="500"
                    />
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      {formData.bio.length}/500 characters
                    </div>
                    {errors.bio && (
                      <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                        {errors.bio}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      className={`form-input ${errors.location ? 'error' : ''}`}
                      placeholder="Where are you from?"
                      maxLength="100"
                    />
                    {errors.location && (
                      <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                        {errors.location}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="website">
                      Website
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      className={`form-input ${errors.website ? 'error' : ''}`}
                      placeholder="https://example.com"
                    />
                    {errors.website && (
                      <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                        {errors.website}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="displayName">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      value={formData.displayName}
                      onChange={handleChange}
                      className={`form-input ${errors.displayName ? 'error' : ''}`}
                      placeholder="Optional display name"
                      maxLength="50"
                    />
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      Leave blank to use your username
                    </div>
                    {errors.displayName && (
                      <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                        {errors.displayName}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signature">
                      Signature
                    </label>
                    <textarea
                      id="signature"
                      name="signature"
                      value={formData.signature}
                      onChange={handleChange}
                      className={`form-textarea ${errors.signature ? 'error' : ''}`}
                      placeholder="Your signature appears at the end of your posts..."
                      rows="4"
                      maxLength="200"
                    />
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                      {formData.signature.length}/200 characters
                    </div>
                    {errors.signature && (
                      <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                        {errors.signature}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="avatar">
                      Avatar URL
                    </label>
                    <input
                      id="avatar"
                      name="avatar"
                      type="url"
                      value={formData.avatar}
                      onChange={handleChange}
                      className={`form-input ${errors.avatar ? 'error' : ''}`}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    {errors.avatar && (
                      <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                        {errors.avatar}
                      </div>
                    )}
                    {formData.avatar && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={formData.avatar} 
                          alt="Avatar preview"
                          style={{ 
                            width: '64px', 
                            height: '64px', 
                            borderRadius: '50%', 
                            border: '1px solid var(--border-color)',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '30px' }}>
                <button 
                  type="submit" 
                  className="button"
                  disabled={loading}
                  style={{ marginRight: '10px' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <Link href={`/profile/${user.username}`} className="button" style={{ backgroundColor: '#666' }}>
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-input.error,
        .form-textarea.error {
          border-color: #c62828;
        }
      `}</style>
    </Layout>
  );
}

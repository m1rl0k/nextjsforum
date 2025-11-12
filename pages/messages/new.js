import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function NewMessage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    recipient: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    // Check if there's a 'to' parameter in the URL
    if (router.query.to) {
      setFormData(prev => ({
        ...prev,
        recipient: router.query.to
      }));
    }
  }, [user, router.query]);

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

    // Show user suggestions when typing recipient
    if (name === 'recipient' && value.length > 1) {
      searchUsers(value);
    } else if (name === 'recipient') {
      setShowSuggestions(false);
    }
  };

  const searchUsers = async (searchTerm) => {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setUserSuggestions(data.users);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const selectUser = (username) => {
    setFormData(prev => ({
      ...prev,
      recipient: username
    }));
    setShowSuggestions(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 3MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload/attachment', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedFiles.push({
            url: data.url,
            filename: data.originalName,
            size: data.size,
            type: data.type
          });
        } else {
          const error = await res.json();
          alert(`Failed to upload ${file.name}: ${error.error}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setAttachments([...attachments, ...uploadedFiles]);
    setUploading(false);
    e.target.value = ''; // Reset file input
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipient.trim()) {
      newErrors.recipient = 'Recipient is required';
    }

    if (!formData.content.trim() && attachments.length === 0) {
      newErrors.content = 'Message content or attachment is required';
    } else if (formData.content.trim() && formData.content.length < 10) {
      newErrors.content = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipient: formData.recipient.trim(),
          content: formData.content.trim() || '(Attachment)',
          attachments: attachments.length > 0 ? attachments : null
        }),
      });

      if (res.ok) {
        router.push('/messages?sent=1');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('An error occurred while sending the message');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout title="New Message">
      <div className="new-message-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <Link href="/messages">Private Messages</Link> &raquo;
          <span> New Message</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Compose New Message
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

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" htmlFor="recipient">
                  To (Username) *
                </label>
                <input
                  id="recipient"
                  name="recipient"
                  type="text"
                  value={formData.recipient}
                  onChange={handleChange}
                  className={`form-input ${errors.recipient ? 'error' : ''}`}
                  placeholder="Enter recipient's username..."
                  autoComplete="off"
                />
                {errors.recipient && (
                  <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                    {errors.recipient}
                  </div>
                )}
                
                {/* User suggestions dropdown */}
                {showSuggestions && userSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderTop: 'none',
                    borderRadius: '0 0 3px 3px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}>
                    {userSuggestions.map(user => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(user.username)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={`${user.username}'s avatar`}
                            style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                          />
                        ) : (
                          <div style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-color)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '10px'
                          }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{user.username}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="content">
                  Message *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className={`form-textarea ${errors.content ? 'error' : ''}`}
                  placeholder="Enter your message..."
                  rows="15"
                />
                {errors.content && (
                  <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                    {errors.content}
                  </div>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="attachment-preview" style={{
                  margin: '15px 0',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '13px', color: '#495057' }}>
                    📎 Attachments:
                  </div>
                  {attachments.map((att, idx) => (
                    <div key={idx} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'white',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      margin: '5px 5px 5px 0',
                      fontSize: '13px'
                    }}>
                      {att.type?.startsWith('image/') ? (
                        <img src={att.url} alt={att.filename} style={{
                          maxWidth: '100px',
                          maxHeight: '60px',
                          borderRadius: '3px'
                        }} />
                      ) : (
                        <span>📄 {att.filename}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: '1',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-group">
                <label className="attach-file-btn" style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.2s',
                  marginRight: '10px'
                }}>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf,text/plain,application/zip"
                    onChange={handleFileUpload}
                    disabled={uploading || loading}
                    style={{ display: 'none' }}
                  />
                  {uploading ? '⏳ Uploading...' : '📎 Attach File'}
                </label>
                <button
                  type="submit"
                  className="button"
                  disabled={loading}
                  style={{ marginRight: '10px' }}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
                <Link href="/messages" className="button" style={{ backgroundColor: '#666' }}>
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

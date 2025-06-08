import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';

export default function ReplyToThread() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useAuth();
  const [thread, setThread] = useState(null);
  const [formData, setFormData] = useState({
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    
    if (id) {
      fetchThread();
    }
  }, [id, user]);

  const fetchThread = async () => {
    try {
      const res = await fetch(`/api/threads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data);
        
        // Check if thread is locked
        if (data.locked) {
          setError('This thread is locked and cannot accept new replies.');
        }
      } else {
        setError('Thread not found');
      }
    } catch (err) {
      setError('Failed to load thread');
    }
  };

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
    
    if (!formData.content.trim()) {
      newErrors.content = 'Reply content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Reply content must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (thread?.locked) {
      setError('This thread is locked and cannot accept new replies.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/threads/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: formData.content.trim()
        }),
      });

      if (res.ok) {
        const post = await res.json();
        router.push(`/threads/${id}#post-${post.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to post reply');
      }
    } catch (err) {
      setError('An error occurred while posting the reply');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  if (!thread) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout title={`Reply to: ${thread.title}`}>
      <div className="reply-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <Link href={`/categories/${thread.subject?.category?.id}`}>{thread.subject?.category?.name}</Link> &raquo;
          <Link href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</Link> &raquo;
          <Link href={`/threads/${id}`}>{thread.title}</Link> &raquo;
          <span> Reply</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Reply to: {thread.title}
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

            {thread.locked ? (
              <div style={{ 
                backgroundColor: '#fff3e0', 
                color: '#e65100', 
                padding: '15px', 
                marginBottom: '20px',
                border: '1px solid #ffb74d',
                borderRadius: '3px',
                textAlign: 'center'
              }}>
                🔒 This thread is locked and cannot accept new replies.
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="content">
                    Your Reply *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    className={`form-textarea ${errors.content ? 'error' : ''}`}
                    placeholder="Enter your reply..."
                    rows="15"
                  />
                  {errors.content && (
                    <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                      {errors.content}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <button 
                    type="submit" 
                    className="button"
                    disabled={loading}
                    style={{ marginRight: '10px' }}
                  >
                    {loading ? 'Posting Reply...' : 'Post Reply'}
                  </button>
                  <Link href={`/threads/${id}`} className="button" style={{ backgroundColor: '#666' }}>
                    Cancel
                  </Link>
                </div>
              </form>
            )}

            {/* Show original thread content for reference */}
            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h4>Original Post:</h4>
              <div className="post">
                <div className="post-header">
                  <div>
                    <strong>{thread.user?.username}</strong> - {new Date(thread.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="post-container">
                  <div className="post-content" style={{ padding: '15px' }}>
                    {thread.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-textarea.error {
          border-color: #c62828;
        }
      `}</style>
    </Layout>
  );
}

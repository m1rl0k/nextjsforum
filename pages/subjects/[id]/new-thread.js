import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';

export default function NewThread() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useAuth();
  const [subject, setSubject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
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
      fetchSubject();
    }
  }, [id, user]);

  const fetchSubject = async () => {
    try {
      const res = await fetch(`/api/subjects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSubject(data);
      } else {
        setError('Subject not found');
      }
    } catch (err) {
      setError('Failed to load subject');
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
    
    if (!formData.title.trim()) {
      newErrors.title = 'Thread title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Thread title must be at least 3 characters';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Thread title must be less than 255 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Thread content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Thread content must be at least 10 characters';
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
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          title: formData.title.trim(),
          content: formData.content.trim(),
          subjectId: parseInt(id)
        }),
      });

      if (res.ok) {
        const thread = await res.json();
        router.push(`/threads/${thread.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create thread');
      }
    } catch (err) {
      setError('An error occurred while creating the thread');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  if (!subject) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout title={`New Thread - ${subject.name}`}>
      <div className="new-thread-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <Link href={`/categories/${subject.category?.id}`}>{subject.category?.name}</Link> &raquo;
          <Link href={`/subjects/${id}`}>{subject.name}</Link> &raquo;
          <span> New Thread</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Post New Thread in {subject.name}
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
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Thread Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter thread title..."
                  maxLength="255"
                />
                {errors.title && (
                  <div style={{ color: '#c62828', fontSize: '12px', marginTop: '5px' }}>
                    {errors.title}
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

              <div className="form-group">
                <button 
                  type="submit" 
                  className="button"
                  disabled={loading}
                  style={{ marginRight: '10px' }}
                >
                  {loading ? 'Creating Thread...' : 'Create Thread'}
                </button>
                <Link href={`/subjects/${id}`} className="button" style={{ backgroundColor: '#666' }}>
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

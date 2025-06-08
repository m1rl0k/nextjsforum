import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import WysiwygEditor from '../../../components/WysiwygEditor';

function formatPostContent(content) {
  if (!content) return '';

  // Check if content is already HTML (from Quill editor)
  if (content.includes('<p>') || content.includes('<img') || content.includes('<strong>') || content.includes('<em>')) {
    // Content is already HTML, just ensure images are responsive
    return content
      .replace(/<img([^>]*?)>/g, '<img$1 style="max-width: 100%; height: auto; border-radius: 3px;">')
      .replace(/<p><\/p>/g, '<br>'); // Replace empty paragraphs with line breaks
  }

  // Legacy BBCode formatting for older posts
  return content
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
    .replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" alt="User posted image" style="max-width:100%; height: auto; border-radius: 3px;">')
    .replace(/\n/g, '<br>');
}

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

    // Wait for router to be ready and id to be available
    if (router.isReady && id) {
      fetchThread();
    }
  }, [id, user, router.isReady]);

  const fetchThread = async () => {
    if (!id) {
      console.log('Invalid thread ID:', id);
      return;
    }

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

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const validateForm = () => {
    const newErrors = {};
    const contentText = stripHtml(formData.content).trim();

    if (!contentText) {
      newErrors.content = 'Reply content is required';
    } else if (contentText.length < 10) {
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
                  <WysiwygEditor
                    value={formData.content}
                    onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                    placeholder="Enter your reply..."
                    height={300}
                    toolbar="standard"
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
                    <div dangerouslySetInnerHTML={{ __html: formatPostContent(thread.content) }} />
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

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import CreateForumModal from '../../components/CreateForumModal';
import { useAuth } from '../../context/AuthContext';

export default function CategoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForumModal, setShowForumModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchCategoryData();
  }, [id]);

  const fetchCategoryData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch category details
      const categoryResponse = await fetch(`/api/categories/${id}`);
      if (!categoryResponse.ok) {
        throw new Error('Category not found');
      }
      const categoryData = await categoryResponse.json();
      setCategory(categoryData);

      // Fetch subjects in this category
      const subjectsResponse = await fetch(`/api/categories/${id}/subjects`);
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData);
      }
    } catch (err) {
      console.error('Error fetching category:', err);
      setError('Failed to load category');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading category...</div>
      </Layout>
    );
  }

  if (error || !category) {
    return (
      <Layout>
        <div className="error">{error || 'Category not found'}</div>
      </Layout>
    );
  }

  return (
    <Layout title={category.name}>
      <div className="category-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <span> {category.name}</span>
        </div>

        <div className="category-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>{category.name}</h1>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
            </div>
            {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
              <button
                onClick={() => setShowForumModal(true)}
                className="button"
                style={{ background: '#4299e1', color: 'white', marginTop: '10px' }}
              >
                ➕ New Forum
              </button>
            )}
          </div>
        </div>

        <div className="subjects-list">
          {/* Header Row */}
          <div className="subject-header">
            <div className="header-forum">Forum</div>
            <div className="header-stats">Topics / Posts</div>
            <div className="header-lastpost">Last Post</div>
          </div>

          {subjects.length === 0 ? (
            <div className="no-subjects" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>📁</div>
              <h3 style={{ color: '#666', marginBottom: '10px' }}>No forums yet</h3>
              <p style={{ color: '#999', marginBottom: '20px' }}>
                This category doesn't have any forums yet.
              </p>
              {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                <button
                  onClick={() => setShowForumModal(true)}
                  className="button"
                  style={{ background: '#4299e1', color: 'white' }}
                >
                  ➕ Create First Forum
                </button>
              )}
            </div>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="subject-row">
                <div className="subject-info">
                  <div className="subject-icon">
                    {subject.icon ? (
                      <img src={subject.icon} alt={subject.name} />
                    ) : (
                      <div className="default-icon">📁</div>
                    )}
                  </div>
                  <div className="subject-details">
                    <h3>
                      <Link href={`/subjects/${subject.id}`}>
                        {subject.name}
                      </Link>
                    </h3>
                    {subject.description && (
                      <p className="subject-description">{subject.description}</p>
                    )}
                  </div>
                </div>
                <div className="subject-stats">
                  <div className="stat">
                    <span className="stat-number">{subject.threadCount || 0}</span>
                    <span className="stat-label">Threads</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{subject.postCount || 0}</span>
                    <span className="stat-label">Posts</span>
                  </div>
                </div>
                <div className="subject-last-post">
                  {subject.lastPost ? (
                    <div>
                      <div className="last-post-date">
                        {new Date(subject.lastPost).toLocaleDateString()}
                      </div>
                      {subject.lastPostUser && (
                        <div className="last-post-user">
                          by <Link href={`/profile/${subject.lastPostUser.username}`}>
                            {subject.lastPostUser.username}
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-posts">No posts yet</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <CreateForumModal
        isOpen={showForumModal}
        onClose={() => setShowForumModal(false)}
        onSuccess={() => {
          setShowForumModal(false);
          // Refresh subjects
          if (id) {
            fetch(`/api/categories/${id}`)
              .then(res => res.json())
              .then(data => {
                setSubjects(data.subjects || []);
              })
              .catch(err => console.error('Failed to refresh subjects:', err));
          }
        }}
        categoryId={category?.id}
      />

      <style jsx>{`
        .category-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .category-header {
          background: white;
          padding: 20px;
          border: 1px solid #ddd;
          margin-bottom: 20px;
        }

        .category-header h1 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .category-description {
          color: #666;
          margin: 0;
        }

        .subjects-list {
          background: white;
          border: 1px solid #ddd;
        }

        .subject-header {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          background-color: var(--subject-header-bg);
          color: var(--subject-header-text);
          font-weight: bold;
          font-size: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .header-forum {
          flex: 1;
        }

        .header-stats {
          width: 150px;
          text-align: center;
        }

        .header-lastpost {
          width: 200px;
          text-align: center;
        }

        .subject-row {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s;
        }

        .subject-row:hover {
          background-color: #f8f9fa;
        }

        .subject-row:last-child {
          border-bottom: none;
        }

        .subject-info {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .subject-icon {
          width: 40px;
          height: 40px;
          margin-right: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .subject-icon img {
          width: 32px;
          height: 32px;
        }

        .default-icon {
          font-size: 24px;
        }

        .subject-details h3 {
          margin: 0 0 5px 0;
        }

        .subject-details h3 a {
          color: #007bff;
          text-decoration: none;
        }

        .subject-details h3 a:hover {
          text-decoration: underline;
        }

        .subject-description {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .subject-stats {
          display: flex;
          gap: 20px;
          margin: 0 20px;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #666;
        }

        .subject-last-post {
          min-width: 150px;
          text-align: right;
          font-size: 14px;
        }

        .last-post-date {
          color: #333;
          margin-bottom: 2px;
        }

        .last-post-user {
          color: #666;
        }

        .last-post-user a {
          color: #007bff;
          text-decoration: none;
        }

        .last-post-user a:hover {
          text-decoration: underline;
        }

        .no-posts {
          color: #999;
        }

        .no-subjects {
          padding: 40px;
          text-align: center;
          color: #666;
        }

        .no-subjects p {
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .subject-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .subject-stats {
            margin: 0;
          }

          .subject-last-post {
            min-width: auto;
            text-align: left;
          }
        }
      `}</style>
    </Layout>
  );
}

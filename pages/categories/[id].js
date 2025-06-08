import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function CategoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
          <h1>{category.name}</h1>
          {category.description && (
            <p className="category-description">{category.description}</p>
          )}
        </div>

        <div className="subjects-list">
          {subjects.length === 0 ? (
            <div className="no-subjects">
              <p>No subjects found in this category.</p>
              {user && user.role === 'ADMIN' && (
                <Link href="/admin/forums" className="button">
                  Manage Forums
                </Link>
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

      <style jsx>{`
        .category-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .category-header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          border-radius: 4px;
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

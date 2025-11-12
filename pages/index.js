import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Category from '../components/Category';
import CreateCategoryModal from '../components/CreateCategoryModal';
import CreateForumModal from '../components/CreateForumModal';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showForumModal, setShowForumModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching categories data...');
      try {
        setIsLoading(true);
        // Fetch real data from API
        const response = await fetch('/api/categories');
        console.log('Categories API response:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const data = await response.json();
        console.log('Categories data:', data);

        setCategories(data.categories || []);
        setStats(data.stats || {});
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load forum categories');
        setIsLoading(false);

        // Set some fallback data so the page isn't completely empty
        setCategories([
          {
            id: 1,
            name: 'General Discussion',
            description: 'Talk about anything related to our forum',
            subjects: [
              {
                id: 1,
                name: 'Introductions',
                description: 'Introduce yourself to the community',
                threadCount: 1,
                postCount: 1,
                lastPost: new Date(),
                lastPostUser: { username: 'admin' }
              }
            ]
          }
        ]);
        setStats({
          totalThreads: 1,
          totalPosts: 1,
          totalMembers: 2,
          newestMember: { username: 'testuser' }
        });
      }
    };
    
    fetchData();
  }, []);

  const handleCategoryCreated = (newCategory) => {
    // Refresh categories
    setCategories(prev => [...prev, newCategory]);
    // Optionally refetch to get full data
    fetchData();
  };

  const handleForumCreated = (newForum) => {
    // Refresh categories to show new forum
    fetchData();
  };

  const fetchData = async () => {
    console.log('Fetching categories data...');
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      console.log('Categories API response:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      console.log('Categories data:', data);

      setCategories(data.categories || []);
      setStats(data.stats || {});
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load forum categories');
      setIsLoading(false);

      // Set some fallback data
      setCategories([]);
      setStats({
        totalThreads: 0,
        totalPosts: 0,
        totalMembers: 0,
        newestMember: null
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading forum...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="forum-index">
        <div className="forum-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <Link href="/mark-read" className="button">📖 Mark Forums Read</Link>
          </div>
          {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="button"
                style={{ background: '#4299e1', color: 'white' }}
              >
                ➕ New Category
              </button>
              <button
                onClick={() => setShowForumModal(true)}
                className="button"
                style={{ background: '#48bb78', color: 'white' }}
              >
                ➕ New Forum
              </button>
            </div>
          )}
        </div>

        {categories.length === 0 && !isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--thread-bg, #fff)', border: '1px solid var(--border-color, #ddd)', borderRadius: 'var(--card-radius, 0px)' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.3 }}>📁</div>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>No categories yet</h3>
            <p style={{ color: '#999', marginBottom: '20px' }}>
              {user && (user.role === 'ADMIN' || user.role === 'MODERATOR')
                ? 'Get started by creating your first category and forum!'
                : 'This forum is being set up. Check back soon!'}
            </p>
            {user && (user.role === 'ADMIN' || user.role === 'MODERATOR') && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="button"
                style={{ background: '#4299e1', color: 'white' }}
              >
                ➕ Create First Category
              </button>
            )}
          </div>
        ) : (
          categories.map(category => (
            <Category key={category.id} category={category} />
          ))
        )}

        <div className="forum-stats">
          <div className="stat">
            <strong>Threads:</strong> {stats?.totalThreads || 0}
          </div>
          <div className="stat">
            <strong>Posts:</strong> {stats?.totalPosts || 0}
          </div>
          <div className="stat">
            <strong>Members:</strong> {stats?.totalMembers || 0}
          </div>
          <div className="stat">
            <strong>Welcome to our newest member:</strong> {stats?.newestMember?.username || 'No members yet'}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSuccess={handleCategoryCreated}
      />
      <CreateForumModal
        isOpen={showForumModal}
        onClose={() => setShowForumModal(false)}
        onSuccess={handleForumCreated}
      />
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Category from '../components/Category';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="forum-actions">
          <Link href="/mark-read" className="button">Mark Forums Read</Link>
        </div>
        
        {categories.map(category => (
          <Category key={category.id} category={category} />
        ))}
        
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
    </Layout>
  );
}

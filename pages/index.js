import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Category from '../components/Category';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you would fetch this from your API
        // const response = await fetch('/api/categories');
        // const data = await response.json();
        
        // Mock data for now
        const mockCategories = [
          {
            id: 1,
            name: 'General Discussion',
            description: 'Talk about anything related to our forum',
            order: 1,
            subjects: [
              {
                id: 1,
                name: 'Introductions',
                description: 'Introduce yourself to the community',
                categoryId: 1,
                threadCount: 15,
                postCount: 124,
                lastPost: new Date(),
                lastPostUserId: 1
              },
              {
                id: 2,
                name: 'Announcements',
                description: 'Important announcements and news',
                categoryId: 1,
                threadCount: 8,
                postCount: 45,
                lastPost: new Date(Date.now() - 86400000),
                lastPostUserId: 2
              }
            ]
          },
          {
            id: 2,
            name: 'Technology',
            description: 'Discuss the latest in technology',
            order: 2,
            subjects: [
              {
                id: 3,
                name: 'Web Development',
                description: 'Frontend, backend, and everything in between',
                categoryId: 2,
                threadCount: 32,
                postCount: 421,
                lastPost: new Date(Date.now() - 3600000),
                lastPostUserId: 3
              },
              {
                id: 4,
                name: 'Mobile Development',
                description: 'iOS, Android, and cross-platform development',
                categoryId: 2,
                threadCount: 18,
                postCount: 156,
                lastPost: new Date(Date.now() - 7200000),
                lastPostUserId: 4
              }
            ]
          }
        ];
        
        // Add user data to last post
        const users = {
          1: { id: 1, username: 'admin' },
          2: { id: 2, username: 'moderator' },
          3: { id: 3, username: 'dev1' },
          4: { id: 4, username: 'mobile_dev' }
        };
        
        // Attach user data to last post
        const categoriesWithUsers = mockCategories.map(cat => ({
          ...cat,
          subjects: cat.subjects.map(subj => ({
            ...subj,
            lastPostUser: users[subj.lastPostUserId] || { username: 'User' }
          }))
        }));
        
        setCategories(categoriesWithUsers);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load forum categories');
        setIsLoading(false);
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
          <a href="/new-thread" className="button">New Thread</a>
          <a href="/mark-read" className="button">Mark Forums Read</a>
        </div>
        
        {categories.map(category => (
          <Category key={category.id} category={category} />
        ))}
        
        <div className="forum-stats">
          <div className="stat">
            <strong>Threads:</strong> {categories.reduce((sum, cat) => 
              sum + (cat.subjects?.reduce((s, subj) => s + (subj.threadCount || 0), 0) || 0), 0)}
          </div>
          <div className="stat">
            <strong>Posts:</strong> {categories.reduce((sum, cat) => 
              sum + (cat.subjects?.reduce((s, subj) => s + (subj.postCount || 0), 0) || 0), 0)}
          </div>
          <div className="stat">
            <strong>Members:</strong> 42
          </div>
          <div className="stat">
            <strong>Welcome to our newest member:</strong> NewUser
          </div>
        </div>
      </div>
    </Layout>
  );
}

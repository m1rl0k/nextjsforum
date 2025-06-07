import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Post from '../../components/Post';

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query;
  const [thread, setThread] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        // In a real app, you would fetch this from your API
        // const response = await fetch(`/api/threads/${id}?page=${page}`);
        // const data = await response.json();
        
        // Mock data for now
        const mockThreads = {
          1: {
            id: 1,
            title: 'Welcome to our forum!',
            content: 'This is the first thread in our forum. Feel free to introduce yourself!',
            userId: 1,
            user: { 
              id: 1, 
              username: 'admin',
              joinDate: new Date('2023-01-01'),
              postCount: 42,
              location: 'Internet',
              avatar: 'https://via.placeholder.com/100',
              signature: 'Forum Administrator',
              role: 'ADMIN'
            },
            subjectId: 1,
            subject: { id: 1, name: 'Introductions' },
            category: { id: 1, name: 'General Discussion' },
            viewCount: 124,
            sticky: true,
            locked: false,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
            lastPostAt: new Date(),
            lastPostUserId: 2,
            lastPostUser: { id: 2, username: 'newuser' },
            posts: [
              {
                id: 1,
                content: 'Welcome to our forum! Feel free to introduce yourself!',
                userId: 1,
                user: { 
                  id: 1, 
                  username: 'admin',
                  joinDate: new Date('2023-01-01'),
                  postCount: 42,
                  location: 'Internet',
                  avatar: 'https://via.placeholder.com/100',
                  signature: 'Forum Administrator',
                  role: 'ADMIN'
                },
                threadId: 1,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01')
              },
              {
                id: 2,
                content: 'Thanks for having me! I\'m excited to be part of this community.',
                userId: 2,
                user: { 
                  id: 2, 
                  username: 'newuser',
                  joinDate: new Date('2023-01-02'),
                  postCount: 15,
                  location: 'New York',
                  avatar: 'https://via.placeholder.com/100?text=NU',
                  signature: 'New member here!',
                  role: 'USER'
                },
                threadId: 1,
                createdAt: new Date('2023-01-02'),
                updatedAt: new Date('2023-01-02')
              },
              {
                id: 3,
                content: 'This is a test post to show pagination.',
                userId: 3,
                user: { 
                  id: 3, 
                  username: 'testuser',
                  joinDate: new Date('2023-01-03'),
                  postCount: 28,
                  location: 'California',
                  avatar: 'https://via.placeholder.com/100?text=TU',
                  signature: 'Testing the forums!',
                  role: 'USER'
                },
                threadId: 1,
                createdAt: new Date('2023-01-03'),
                updatedAt: new Date('2023-01-03')
              },
              // Add more posts to test pagination
              ...Array.from({ length: 15 }).map((_, i) => ({
                id: i + 4,
                content: `This is post #${i + 4} in this thread.`,
                userId: (i % 3) + 1, // Cycle through user IDs 1-3
                user: [
                  { 
                    id: 1, 
                    username: 'admin',
                    joinDate: new Date('2023-01-01'),
                    postCount: 42,
                    location: 'Internet',
                    avatar: 'https://via.placeholder.com/100',
                    signature: 'Forum Administrator',
                    role: 'ADMIN'
                  },
                  { 
                    id: 2, 
                    username: 'newuser',
                    joinDate: new Date('2023-01-02'),
                    postCount: 15,
                    location: 'New York',
                    avatar: 'https://via.placeholder.com/100?text=NU',
                    signature: 'New member here!',
                    role: 'USER'
                  },
                  { 
                    id: 3, 
                    username: 'testuser',
                    joinDate: new Date('2023-01-03'),
                    postCount: 28,
                    location: 'California',
                    avatar: 'https://via.placeholder.com/100?text=TU',
                    signature: 'Testing the forums!',
                    role: 'USER'
                  }
                ][(i % 3)],
                threadId: 1,
                createdAt: new Date(Date.now() - (i * 3600000)),
                updatedAt: new Date(Date.now() - (i * 3600000))
              }))
            ]
          }
        };

        const threadData = mockThreads[id];
        
        if (!threadData) {
          throw new Error('Thread not found');
        }

        // Sort posts by creation date
        threadData.posts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        setThread(threadData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching thread:', err);
        setError('Failed to load thread');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, page]);

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading thread...</div>
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

  if (!thread) {
    return (
      <Layout>
        <div className="error">Thread not found</div>
      </Layout>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(thread.posts.length / postsPerPage);
  const startIndex = (page - 1) * postsPerPage;
  const paginatedPosts = thread.posts.slice(startIndex, startIndex + postsPerPage);

  return (
    <Layout title={thread.title}>
      <div className="thread-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <Link href={`/categories/${thread.category?.id}`}>{thread.category?.name}</Link> &raquo;
          <Link href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</Link> &raquo;
          <span> {thread.title}</span>
        </div>
        
        <div className="thread-actions top">
          <a href={`/subjects/${thread.subjectId}/new-thread`} className="button">New Thread</a>
          <a href={`/threads/${id}/reply`} className="button">Reply</a>
          {thread.locked ? (
            <span className="button disabled">Thread Locked</span>
          ) : (
            <a href={`/threads/${id}/reply`} className="button">Reply</a>
          )}
          <a href="#bottom" className="button">Bottom</a>
        </div>
        
        <div className="pagination top">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link 
              key={pageNum} 
              href={`/threads/${id}?page=${pageNum}`}
              className={`pagination-link ${page === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
        
        <div className="posts-list">
          {paginatedPosts.map((post, index) => (
            <Post 
              key={post.id} 
              post={post} 
              isFirstPost={index === 0 && page === 1} 
            />
          ))}
        </div>
        
        <div className="pagination bottom">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link 
              key={pageNum} 
              href={`/threads/${id}?page=${pageNum}`}
              className={`pagination-link ${page === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
        
        <div className="thread-actions bottom">
          <a href={`/subjects/${thread.subjectId}/new-thread`} className="button">New Thread</a>
          {thread.locked ? (
            <span className="button disabled">Thread Locked</span>
          ) : (
            <a href={`/threads/${id}/reply`} className="button">Reply</a>
          )}
          <a href="#top" className="button">Top</a>
        </div>
        
        <div className="thread-tools">
          <h3>Thread Tools</h3>
          <ul>
            <li><a href={`/threads/${id}/print`}>Show Printable Version</a></li>
            <li><a href={`/threads/${id}/email`}>Email this Page</a></li>
            <li><a href={`/threads/${id}/subscribe`}>Subscribe to this Thread</a></li>
          </ul>
          
          <h3>Search this Thread</h3>
          <form className="search-form">
            <input type="text" className="form-input" placeholder="Search this thread..." />
            <button type="submit" className="button">Search</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

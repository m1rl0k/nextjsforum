import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PrintThread() {
  const router = useRouter();
  const { id } = router.query;
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchThreadData();
    }
  }, [id]);

  const fetchThreadData = async () => {
    try {
      const [threadRes, postsRes] = await Promise.all([
        fetch(`/api/threads/${id}`),
        fetch(`/api/threads/${id}/posts?limit=1000`) // Get all posts for printing
      ]);

      if (threadRes.ok && postsRes.ok) {
        const threadData = await threadRes.json();
        const postsData = await postsRes.json();
        
        setThread(threadData);
        setPosts(postsData.posts || []);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div>Loading thread for printing...</div>;
  }

  if (!thread) {
    return <div>Thread not found</div>;
  }

  return (
    <>
      <Head>
        <title>Print: {thread.title} - NextJS Forum</title>
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .no-print { display: none !important; }
              body { font-size: 12pt; line-height: 1.4; }
              .post { page-break-inside: avoid; margin-bottom: 20pt; }
              .post-header { border-bottom: 1pt solid #000; padding-bottom: 5pt; }
              .post-content { margin: 10pt 0; }
            }
          `
        }} />
      </Head>

      <div className="print-layout">
        {/* Print Controls - Hidden when printing */}
        <div className="no-print print-controls">
          <button onClick={handlePrint} className="button primary">
            🖨️ Print Thread
          </button>
          <button onClick={() => router.back()} className="button">
            ← Back to Thread
          </button>
        </div>

        {/* Thread Header */}
        <div className="print-header">
          <h1>{thread.title}</h1>
          <div className="thread-meta">
            <p><strong>Forum:</strong> {thread.subject?.name} → {thread.subject?.category?.name}</p>
            <p><strong>Started by:</strong> {thread.user?.username}</p>
            <p><strong>Date:</strong> {new Date(thread.createdAt).toLocaleString()}</p>
            <p><strong>Posts:</strong> {posts.length}</p>
            <p><strong>Printed:</strong> {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Thread Posts */}
        <div className="print-posts">
          {posts.map((post, index) => (
            <div key={post.id} className="post">
              <div className="post-header">
                <h3>Post #{index + 1} by {post.user?.username}</h3>
                <p className="post-date">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="post-content">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>

              {post.user?.signature && (
                <div className="post-signature">
                  <hr />
                  <em>{post.user.signature}</em>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Print Footer */}
        <div className="print-footer">
          <hr />
          <p><small>Printed from NextJS Forum - {window.location.origin}</small></p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .print-layout {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
          }

          .print-controls {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
            display: flex;
            gap: 10px;
          }

          .print-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
          }

          .print-header h1 {
            margin: 0 0 15px 0;
            color: #333;
          }

          .thread-meta p {
            margin: 5px 0;
            color: #666;
          }

          .post {
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }

          .post-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }

          .post-header h3 {
            margin: 0 0 5px 0;
            color: #333;
            font-size: 1.1em;
          }

          .post-date {
            margin: 0;
            color: #666;
            font-size: 0.9em;
          }

          .post-content {
            line-height: 1.6;
            color: #333;
          }

          .post-signature {
            margin-top: 15px;
            padding-top: 10px;
            font-size: 0.9em;
            color: #666;
          }

          .print-footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
          }

          .button {
            padding: 10px 20px;
            border: 1px solid #ddd;
            background: white;
            color: #333;
            text-decoration: none;
            border-radius: 4px;
            cursor: pointer;
            display: inline-block;
          }

          .button:hover {
            background: #f8f9fa;
          }

          .button.primary {
            background: #007bff;
            color: white;
            border-color: #007bff;
          }

          .button.primary:hover {
            background: #0056b3;
          }

          @media print {
            .print-layout {
              max-width: none;
              margin: 0;
              padding: 0;
            }

            .post {
              border: 1px solid #000;
              margin-bottom: 20pt;
            }

            .post-header h3 {
              font-size: 12pt;
            }
          }
        `
      }} />
    </>
  );
}

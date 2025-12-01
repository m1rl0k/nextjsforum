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
      const threadRes = await fetch(`/api/threads/${id}`);

      if (threadRes.ok) {
        const threadData = await threadRes.json();
        setThread(threadData);

        // Fetch all posts with pagination (max 100 per page)
        let allPosts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const postsRes = await fetch(`/api/threads/${id}/posts?page=${page}&limit=100`);
          if (postsRes.ok) {
            const postsData = await postsRes.json();
            allPosts = [...allPosts, ...(postsData.posts || [])];
            hasMore = postsData.pagination?.hasNextPage || false;
            page++;
          } else {
            hasMore = false;
          }
        }

        setPosts(allPosts);
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
            padding: 10px;
            font-family: Tahoma, Verdana, Arial, sans-serif;
            font-size: 11px;
          }

          .print-controls {
            margin-bottom: 15px;
            padding: 10px;
            background: #F5F5F5;
            border: 1px solid #C0C0C0;
            display: flex;
            gap: 8px;
          }

          .print-header {
            margin-bottom: 20px;
            padding: 10px;
            background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
            color: white;
            border: 1px solid #6B84AA;
          }

          .print-header h1 {
            margin: 0 0 10px 0;
            color: white;
            font-size: 14px;
            font-weight: bold;
          }

          .thread-meta {
            background: #F5F5F5;
            padding: 10px;
            border: 1px solid #C0C0C0;
            margin-top: 10px;
          }

          .thread-meta p {
            margin: 3px 0;
            color: #333;
          }

          .post {
            margin-bottom: 15px;
            border: 1px solid #6B84AA;
          }

          .post-header {
            background: linear-gradient(to bottom, #8FA3C7 0%, #738FBF 100%);
            padding: 8px 10px;
            border-bottom: 1px solid #6B84AA;
          }

          .post-header h3 {
            margin: 0 0 3px 0;
            color: white;
            font-size: 11px;
            font-weight: bold;
          }

          .post-date {
            margin: 0;
            color: #E0E0E0;
            font-size: 10px;
          }

          .post-content {
            padding: 10px;
            line-height: 1.5;
            color: #333;
            background: white;
          }

          .post-signature {
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed #C0C0C0;
            font-size: 10px;
            color: #666;
          }

          .print-footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            padding: 10px;
            border-top: 1px solid #C0C0C0;
          }

          .button {
            padding: 5px 15px;
            border: 1px solid #808080;
            background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
            color: #333;
            text-decoration: none;
            cursor: pointer;
            display: inline-block;
            font-size: 11px;
            font-family: Tahoma, Verdana, Arial, sans-serif;
          }

          .button:hover {
            background: linear-gradient(to bottom, #E0E0E0 0%, #D0D0D0 100%);
          }

          .button.primary {
            background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
            color: white;
            border-color: #2B4F81;
          }

          .button.primary:hover {
            background: linear-gradient(to bottom, #3A6090 0%, #1E3A5F 100%);
          }

          @media print {
            .print-layout {
              max-width: none;
              margin: 0;
              padding: 0;
            }

            .print-header {
              background: #333 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .post {
              border: 1px solid #000;
              margin-bottom: 15pt;
              page-break-inside: avoid;
            }

            .post-header {
              background: #666 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .post-header h3 {
              font-size: 11pt;
            }
          }
        `
      }} />
    </>
  );
}

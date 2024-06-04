import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Thread() {
  const router = useRouter();
  const { id } = router.query;
  const [thread, setThread] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/threads/${id}`)
        .then(response => response.json())
        .then(data => setThread(data));
    }
  }, [id]);

  if (!thread) return <div>Loading...</div>;

  return (
    <div>
      <h1>{thread.title}</h1>
      <p>{thread.content}</p>
      <p>Posted by: {thread.user.username}</p>
      <h2>Replies</h2>
      <ul>
        {thread.posts.map(post => (
          <li key={post.id}>
            <p>{post.content}</p>
            <p>Posted by: {post.user.username}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

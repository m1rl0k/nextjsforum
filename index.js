import { useEffect, useState } from 'react';

export default function Home() {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    fetch('/api/threads')
      .then(response => response.json())
      .then(data => setThreads(data));
  }, []);

  return (
    <div>
      <h1>Forum Threads</h1>
      <ul>
        {threads.map(thread => (
          <li key={thread.id}>
            <a href={`/threads/${thread.id}`}>{thread.title}</a>
            <p>Posted by: {thread.user.username}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

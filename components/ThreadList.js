import Link from 'next/link';

export default function ThreadList({ threads = [] }) {
  if (threads.length === 0) {
    return (
      <div className="no-threads">
        No threads found. Be the first to <Link href="/new-thread">start a new thread</Link>!
      </div>
    );
  }

  return (
    <div className="threads-list">
      <div className="forum-table">
        <thead>
          <tr>
            <th>Thread</th>
            <th>Replies</th>
            <th>Views</th>
            <th>Last Post</th>
          </tr>
        </thead>
        <tbody>
          {threads.map(thread => (
            <ThreadRow key={thread.id} thread={thread} />
          ))}
        </tbody>
      </div>
    </div>
  );
}

function ThreadRow({ thread }) {
  const lastPost = thread.lastPostAt ? new Date(thread.lastPostAt) : null;
  const isSticky = thread.sticky;
  const isLocked = thread.locked;

  return (
    <tr className="thread-row">
      <td className="thread-main">
        <div className="thread-icon">
          {isSticky ? '📌' : isLocked ? '🔒' : '📄'}
        </div>
        <div className="thread-details">
          <div className="thread-title">
            <Link href={`/threads/${thread.id}`}>
              {thread.title}
            </Link>
          </div>
          <div className="thread-starter">
            Started by <Link href={`/users/${thread.userId}`}>{thread.user?.username || 'Deleted User'}</Link>
          </div>
        </div>
      </td>
      <td className="thread-replies">
        {thread.posts ? thread.posts.length - 1 : 0}
      </td>
      <td className="thread-views">
        {thread.viewCount || 0}
      </td>
      <td className="thread-lastpost">
        {lastPost ? (
          <>
            <div>{lastPost.toLocaleDateString()}</div>
            <div>by <Link href={`/users/${thread.lastPostUserId}`}>
              {thread.lastPostUser?.username || 'User'}
            </Link></div>
          </>
        ) : 'No posts'}
      </td>
    </tr>
  );
}

import Link from 'next/link';
import { getThreadUrl } from '../lib/slugUtils';

export default function ThreadList({ threads = [], subjectId }) {
  if (threads.length === 0) {
    return (
      <div className="no-threads">
        No threads found. {subjectId ? (
          <>Be the first to <Link href={`/subjects/${subjectId}/new-thread`}>start a new thread</Link>!</>
        ) : (
          'Select a subject to start a new thread!'
        )}
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
  const isPinned = thread.threadType === 'ANNOUNCEMENT';
  const threadUrl = getThreadUrl(thread);

  // Determine icon priority: Pinned > Sticky > Locked > Normal
  const getThreadIcon = () => {
    if (isPinned) return '📍'; // Pin icon for announcements
    if (isSticky) return '📌'; // Sticky icon
    if (isLocked) return '🔒'; // Lock icon
    return '📄'; // Normal thread icon
  };

  return (
    <tr className={`thread-row ${isPinned ? 'pinned' : ''} ${isSticky ? 'sticky' : ''} ${isLocked ? 'locked' : ''}`}>
      <td className="thread-main">
        <div className="thread-icon">
          {getThreadIcon()}
        </div>
        <div className="thread-details">
          <div className="thread-title">
            <Link href={threadUrl}>
              {isPinned && <span className="thread-badge pinned">📍 PINNED</span>}
              {isSticky && !isPinned && <span className="thread-badge sticky">📌 STICKY</span>}
              {isLocked && <span className="thread-badge locked">🔒 LOCKED</span>}
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

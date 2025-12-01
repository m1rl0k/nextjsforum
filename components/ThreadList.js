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
  const isPoll = thread.threadType === 'POLL';
  const threadUrl = getThreadUrl(thread);

  // Calculate if thread is "hot" (many replies or recent activity)
  const replyCount = thread.posts ? thread.posts.length - 1 : (thread.replyCount || 0);
  const isHot = replyCount >= 10 || thread.viewCount >= 100;
  const isVeryHot = replyCount >= 25 || thread.viewCount >= 500;

  // Determine thread status icon
  const getThreadIcon = () => {
    if (isPinned) return { icon: '📍', title: 'Announcement', className: 'icon-pinned' };
    if (isSticky && isLocked) return { icon: '📌🔒', title: 'Sticky & Locked', className: 'icon-sticky-locked' };
    if (isSticky) return { icon: '📌', title: 'Sticky Thread', className: 'icon-sticky' };
    if (isLocked) return { icon: '🔒', title: 'Locked Thread', className: 'icon-locked' };
    if (isPoll) return { icon: '📊', title: 'Poll', className: 'icon-poll' };
    if (isVeryHot) return { icon: '🔥', title: 'Very Hot Thread', className: 'icon-very-hot' };
    if (isHot) return { icon: '💬', title: 'Hot Thread', className: 'icon-hot' };
    return { icon: '📄', title: 'Thread', className: 'icon-normal' };
  };

  const iconInfo = getThreadIcon();

  return (
    <tr className={`thread-row ${isPinned ? 'pinned' : ''} ${isSticky ? 'sticky' : ''} ${isLocked ? 'locked' : ''} ${isHot ? 'hot' : ''}`}>
      <td className="thread-main">
        <div className={`thread-icon ${iconInfo.className}`} title={iconInfo.title}>
          {iconInfo.icon}
        </div>
        <div className="thread-details">
          <div className="thread-title">
            <Link href={threadUrl}>
              {isPinned && <span className="thread-badge pinned">PINNED</span>}
              {isSticky && !isPinned && <span className="thread-badge sticky">STICKY</span>}
              {isLocked && <span className="thread-badge locked">LOCKED</span>}
              {isPoll && <span className="thread-badge poll">POLL</span>}
              {isVeryHot && !isPinned && !isSticky && <span className="thread-badge very-hot">HOT!</span>}
              {thread.title}
            </Link>
          </div>
          <div className="thread-starter">
            Started by <Link href={`/profile/${thread.user?.username || 'deleted'}`}>{thread.user?.username || 'Deleted User'}</Link>
            {thread.posts && thread.posts.length > 10 && (
              <span className="thread-pages">
                {' '}• Pages: {Array.from({ length: Math.min(5, Math.ceil(thread.posts.length / 10)) }, (_, i) => (
                  <Link key={i} href={`${threadUrl}?page=${i + 1}`} className="page-link">{i + 1}</Link>
                ))}
                {Math.ceil(thread.posts.length / 10) > 5 && ' ...'}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="thread-replies">
        {replyCount}
      </td>
      <td className="thread-views">
        {thread.viewCount || 0}
      </td>
      <td className="thread-lastpost">
        {lastPost ? (
          <>
            <div>{lastPost.toLocaleDateString()}</div>
            <div>by <Link href={`/profile/${thread.lastPostUser?.username || 'user'}`}>
              {thread.lastPostUser?.username || 'User'}
            </Link></div>
          </>
        ) : 'No posts'}
      </td>
    </tr>
  );
}

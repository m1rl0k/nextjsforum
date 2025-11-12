import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Category({ category }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="category-block">
      <div
        className="category-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <span className="category-title">{category.name}</span>
        <span className="category-toggle">
          {isExpanded ? '−' : '+'}
        </span>
      </div>
      {category.description && (
        <div className="category-description">
          {category.description}
        </div>
      )}
      {isExpanded && category.subjects && category.subjects.length > 0 && (
        <div className="subjects-list">
          {category.subjects.map(subject => (
            <Subject key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}

function Subject({ subject }) {
  const router = useRouter();
  const lastPost = subject.lastPost ? new Date(subject.lastPost) : null;

  const handleRowClick = (e) => {
    // Don't navigate if clicking on a link
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      return;
    }
    // Navigate to the subject page
    router.push(`/subjects/${subject.id}`);
  };

  return (
    <div className="subject-row" onClick={handleRowClick}>
      <div className="subject-icon">
        <span>📁</span>
      </div>
      <div className="subject-info">
        <div className="subject-title">
          <Link href={`/subjects/${subject.id}`}>{subject.name}</Link>
        </div>
        {subject.description && (
          <div className="subject-description">{subject.description}</div>
        )}
      </div>
      <div className="subject-stats">
        <div>Threads: {subject.threadCount || 0}</div>
        <div>Posts: {subject.postCount || 0}</div>
      </div>
      <div className="subject-lastpost">
        {lastPost ? (
          <>
            <div>Last post by <Link href={`/profile/${subject.lastPostUser?.username || 'user'}`}>
              {subject.lastPostUser?.username || 'User'}
            </Link></div>
            <div>{lastPost.toLocaleDateString()}</div>
            {subject.lastThread && (
              <div>
                <Link href={`/threads/${subject.lastThread.id}`}>
                  {subject.lastThread.title}
                </Link>
              </div>
            )}
          </>
        ) : (
          <div>No posts</div>
        )}
      </div>
    </div>
  );
}
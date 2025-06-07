import Link from 'next/link';
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
        {category.name}
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
  const lastPost = subject.lastPost ? new Date(subject.lastPost) : null;
  
  return (
    <div className="subject-row">
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
            <div>Last post by User</div>
            <div>{lastPost.toLocaleDateString()}</div>
          </>
        ) : (
          <div>No posts</div>
        )}
      </div>
    </div>
  );
}

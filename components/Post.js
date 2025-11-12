import Link from 'next/link';
import ReportButton from './ReportButton';
import { sanitizeHtml } from '../lib/sanitize';

export default function Post({ post, isFirstPost = false }) {
  const postDate = post.createdAt ? new Date(post.createdAt) : new Date();
  
  return (
    <div className={`post ${isFirstPost ? 'first-post' : ''}`} id={`post-${post.id}`}>
      <div className="post-header">
        <div className="post-number">
          #{post.id}
        </div>
        <div className="post-date">
          Posted: {postDate.toLocaleString()}
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <span> • Last edited: {new Date(post.updatedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
      <div className="post-container">
        <div className="post-sidebar">
          <div className="post-username">
            <Link href={`/profile/${post.user?.username || 'deleted'}`}>
              {post.user?.username || 'Deleted User'}
            </Link>
          </div>
          <div className="post-userinfo">
            <div>Posts: {post.user?.postCount || 0}</div>
            <div>Joined: {post.user?.createdAt ? new Date(post.user.createdAt).toLocaleDateString() : 'N/A'}</div>
            {post.user?.role && post.user.role !== 'USER' && (
              <div style={{ color: post.user.role === 'ADMIN' ? '#d32f2f' : '#1976d2', fontSize: '11px', fontWeight: 'bold' }}>
                {post.user.role === 'ADMIN' ? '👑 Administrator' : '🛡️ Moderator'}
              </div>
            )}
          </div>
          {post.user?.avatar && (
            <div className="post-avatar">
              <img src={post.user.avatar} alt="User Avatar" />
            </div>
          )}
          {post.user?.location && (
            <div className="post-location">
              From: {post.user.location}
            </div>
          )}
          {post.user?.signature && (
            <div className="post-signature">
              {post.user.signature}
            </div>
          )}
        </div>
        <div className="post-content">
          <div className="post-message" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatPostContent(post.content)) }} />
          
          {post.updatedBy && post.updatedAt && (
            <div className="post-edit-note">
              Last edited by {post.updatedBy} on {new Date(post.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
      <div className="post-footer">
        <Link href={`#post-${post.id}`} className="button">#{post.id}</Link>
        <Link href={`/threads/${post.threadId}/reply?quote=${post.id}`} className="button">Quote</Link>
        <Link href={`/threads/${post.threadId}/reply`} className="button">Reply</Link>
        <ReportButton type="post" targetId={post.id} targetTitle={`Post #${post.id}`} />
      </div>
    </div>
  );
}

function formatPostContent(content) {
  if (!content) return '';

  // Check if content is already HTML (from Quill editor)
  if (content.includes('<p>') || content.includes('<img') || content.includes('<strong>') || content.includes('<em>')) {
    // Content is already HTML, just ensure images are responsive
    return content
      .replace(/<img([^>]*?)>/g, '<img$1 style="max-width: 100%; height: auto; border-radius: 3px;">')
      .replace(/<p><\/p>/g, '<br>'); // Replace empty paragraphs with line breaks
  }

  // Legacy BBCode formatting for older posts
  return content
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
    .replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" alt="User posted image" style="max-width:100%; height: auto; border-radius: 3px;">')
    .replace(/\n/g, '<br>');
}

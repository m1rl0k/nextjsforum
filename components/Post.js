import { useState } from 'react';
import Link from 'next/link';
import ReportButton from './ReportButton';
import { sanitizeHtml } from '../lib/sanitize';
import { useAuth } from '../context/AuthContext';
import EditPostModal from './EditPostModal';

export default function Post({ post, isFirstPost = false, onPostUpdated }) {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  // Check if user can edit this post
  const canEdit = user && (
    user.id === currentPost.userId ||
    user.role === 'ADMIN' ||
    user.role === 'MODERATOR'
  );

  const handleEditSuccess = (updatedPost) => {
    setCurrentPost({ ...currentPost, ...updatedPost });
    setIsEditModalOpen(false);
    if (onPostUpdated) {
      onPostUpdated(updatedPost);
    }
  };
  const postDate = currentPost.createdAt ? new Date(currentPost.createdAt) : new Date();

  return (
    <div className={`post ${isFirstPost ? 'first-post' : ''}`} id={`post-${currentPost.id}`}>
      <div className="post-header">
        <div className="post-number">
          #{currentPost.id}
        </div>
        <div className="post-date">
          Posted: {postDate.toLocaleString()}
          {currentPost.editedAt && (
            <span> • Last edited: {new Date(currentPost.editedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
      <div className="post-container">
        <div className="post-sidebar">
          <div className="post-username">
            <Link href={`/profile/${currentPost.user?.username || 'deleted'}`}>
              {currentPost.user?.username || 'Deleted User'}
            </Link>
          </div>
          <div className="post-userinfo">
            <div>Posts: {currentPost.user?.postCount || 0}</div>
            <div>Joined: {currentPost.user?.createdAt ? new Date(currentPost.user.createdAt).toLocaleDateString() : 'N/A'}</div>
            {currentPost.user?.role && currentPost.user.role !== 'USER' && (
              <div style={{ color: currentPost.user.role === 'ADMIN' ? '#d32f2f' : '#1976d2', fontSize: '11px', fontWeight: 'bold' }}>
                {currentPost.user.role === 'ADMIN' ? '👑 Administrator' : '🛡️ Moderator'}
              </div>
            )}
          </div>
          {currentPost.user?.avatar && (
            <div className="post-avatar">
              <img src={currentPost.user.avatar} alt="User Avatar" />
            </div>
          )}
          {currentPost.user?.location && (
            <div className="post-location">
              From: {currentPost.user.location}
            </div>
          )}
          {currentPost.user?.signature && (
            <div className="post-signature">
              {currentPost.user.signature}
            </div>
          )}
        </div>
        <div className="post-content">
          <div className="post-message" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatPostContent(currentPost.content)) }} />

          {currentPost.editedAt && currentPost.editReason && (
            <div className="post-edit-note">
              Edit reason: {currentPost.editReason}
            </div>
          )}
        </div>
      </div>
      <div className="post-footer">
        <Link href={`#post-${currentPost.id}`} className="button">#{currentPost.id}</Link>
        {canEdit && (
          <button onClick={() => setIsEditModalOpen(true)} className="button">Edit</button>
        )}
        <Link href={`/threads/${currentPost.threadId}/reply?quote=${currentPost.id}`} className="button">Quote</Link>
        <Link href={`/threads/${currentPost.threadId}/reply`} className="button">Reply</Link>
        <ReportButton type="post" targetId={currentPost.id} targetTitle={`Post #${currentPost.id}`} />
      </div>

      {isEditModalOpen && (
        <EditPostModal
          post={currentPost}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
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

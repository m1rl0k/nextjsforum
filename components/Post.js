import Link from 'next/link';

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
            <Link href={`/users/${post.userId}`}>
              {post.user?.username || 'Deleted User'}
            </Link>
          </div>
          <div className="post-userinfo">
            <div>Posts: {post.user?.postCount || 0}</div>
            <div>Joined: {post.user?.joinDate ? new Date(post.user.joinDate).toLocaleDateString() : 'N/A'}</div>
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
          <div className="post-message" dangerouslySetInnerHTML={{ __html: formatPostContent(post.content) }} />
          
          {post.updatedBy && post.updatedAt && (
            <div className="post-edit-note">
              Last edited by {post.updatedBy} on {new Date(post.updatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
      <div className="post-footer">
        <Link href={`/report/post/${post.id}`} className="button">Report</Link>
        <Link href={`#post-${post.id}`} className="button">Link</Link>
        <Link href={`/reply/${post.threadId}?quote=${post.id}`} className="button">Quote</Link>
        <Link href={`/reply/${post.threadId}`} className="button">Reply</Link>
      </div>
    </div>
  );
}

function formatPostContent(content) {
  if (!content) return '';
  
  // Simple formatting - in a real app, you'd want to use a proper parser
  return content
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>')
    .replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" alt="User posted image" style="max-width:100%;">')
    .replace(/\n/g, '<br>');
}

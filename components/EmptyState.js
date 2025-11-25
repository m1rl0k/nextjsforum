import Link from 'next/link';

const PRESET_ICONS = {
  threads: '💬',
  posts: '📝',
  users: '👥',
  messages: '✉️',
  notifications: '🔔',
  search: '🔍',
  error: '⚠️',
  empty: '📭',
  folder: '📁',
  lock: '🔒'
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  onAction,
  preset,
  className = ''
}) {
  const displayIcon = icon || (preset && PRESET_ICONS[preset]) || PRESET_ICONS.empty;

  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-icon">{displayIcon}</div>
      {title && <h3 className="empty-title">{title}</h3>}
      {description && <p className="empty-description">{description}</p>}
      {(actionHref || onAction) && (
        actionHref ? (
          <Link href={actionHref} className="empty-action">
            {actionLabel || 'Take Action'}
          </Link>
        ) : (
          <button onClick={onAction} className="empty-action">
            {actionLabel || 'Take Action'}
          </button>
        )
      )}

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          background: #fafafa;
          border-radius: 12px;
          border: 2px dashed #e5e7eb;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 20px 0;
          max-width: 400px;
          line-height: 1.5;
        }

        .empty-action {
          display: inline-flex;
          align-items: center;
          padding: 10px 20px;
          background: var(--primary-color, #2563eb);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .empty-action:hover {
          background: var(--primary-hover, #1d4ed8);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

// Compact empty state for inline use
export function EmptyStateInline({ icon, message, className = '' }) {
  return (
    <div className={`empty-inline ${className}`}>
      {icon && <span className="empty-inline-icon">{icon}</span>}
      <span className="empty-inline-message">{message}</span>

      <style jsx>{`
        .empty-inline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px 16px;
          color: #6b7280;
          font-size: 14px;
        }

        .empty-inline-icon {
          font-size: 20px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

// Preset empty states for common scenarios
export function NoThreadsEmptyState({ forumName, canCreate, createHref }) {
  return (
    <EmptyState
      icon="💬"
      title="No threads yet"
      description={forumName
        ? `Be the first to start a discussion in ${forumName}!`
        : "Be the first to start a discussion!"}
      actionLabel={canCreate ? "Start New Thread" : undefined}
      actionHref={canCreate ? createHref : undefined}
    />
  );
}

export function NoPostsEmptyState() {
  return (
    <EmptyState
      icon="📝"
      title="No replies yet"
      description="Be the first to reply to this thread!"
    />
  );
}

export function NoSearchResultsEmptyState({ searchTerm, onClear }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find anything matching "${searchTerm}". Try different keywords or check your spelling.`}
      actionLabel="Clear Search"
      onAction={onClear}
    />
  );
}

export function NoMessagesEmptyState() {
  return (
    <EmptyState
      icon="✉️"
      title="No messages yet"
      description="Your inbox is empty. Start a conversation with someone!"
      actionLabel="Send Message"
      actionHref="/messages/new"
    />
  );
}

export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      icon="🔔"
      title="All caught up!"
      description="You have no new notifications. Check back later!"
    />
  );
}

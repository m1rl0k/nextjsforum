import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10&unreadOnly=false');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'THREAD_REPLY': '💬',
      'POST_REPLY': '↩️',
      'POST_MENTION': '@',
      'POST_LIKE': '❤️',
      'PRIVATE_MESSAGE': '✉️',
      'MODERATION_ACTION': '⚠️',
      'SYSTEM_ALERT': '📢',
      'THREAD_SUBSCRIBE': '🔔'
    };
    return icons[type] || '📬';
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button 
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="mark-all-read-btn"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                >
                  {notification.actionUrl ? (
                    <Link 
                      href={notification.actionUrl}
                      onClick={() => handleNotificationClick(notification)}
                      className="notification-link"
                    >
                      <div className="notification-content">
                        <div className="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-text">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-description">{notification.content}</div>
                          <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div 
                      onClick={() => handleNotificationClick(notification)}
                      className="notification-content"
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-text">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-description">{notification.content}</div>
                        <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <Link href="/notifications" onClick={() => setIsOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        .notification-dropdown {
          position: relative;
          display: inline-block;
        }

        .notification-button {
          position: relative;
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .notification-button:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background: #ff4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 0.7rem;
          font-weight: bold;
          min-width: 16px;
          text-align: center;
        }

        .notification-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 350px;
          max-height: 500px;
          overflow: hidden;
          z-index: 1000;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          background: #f8f9fa;
        }

        .notification-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .mark-all-read-btn {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 0.85rem;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .mark-all-read-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .no-notifications {
          padding: 40px 20px;
          text-align: center;
          color: #666;
          font-style: italic;
        }

        .notification-item {
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
        }

        .notification-item.unread {
          background-color: #f0f8ff;
        }

        .notification-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .notification-content {
          display: flex;
          padding: 12px 16px;
          cursor: pointer;
        }

        .notification-icon {
          font-size: 1.2rem;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .notification-text {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 4px;
          color: #333;
        }

        .notification-description {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 4px;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .notification-time {
          font-size: 0.75rem;
          color: #999;
        }

        .notification-footer {
          padding: 12px 16px;
          border-top: 1px solid #eee;
          background: #f8f9fa;
          text-align: center;
        }

        .notification-footer a {
          color: var(--primary-color);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .notification-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

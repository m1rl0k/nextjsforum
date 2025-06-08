import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '50',
        unreadOnly: filter === 'unread' ? 'true' : 'false'
      });

      if (filter !== 'all' && filter !== 'unread') {
        params.append('type', filter);
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
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
      
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, read: true }
            : notif
        )
      );
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotifications = async (notificationIds) => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      });
      
      setNotifications(prev => 
        prev.filter(notif => !notificationIds.includes(notif.id))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Only' },
    { value: 'THREAD_REPLY', label: 'Thread Replies' },
    { value: 'POST_MENTION', label: 'Mentions' },
    { value: 'PRIVATE_MESSAGE', label: 'Messages' },
    { value: 'MODERATION_ACTION', label: 'Moderation' }
  ];

  return (
    <Layout>
      <div className="notifications-page">
        <div className="page-header">
          <h1>📬 Notifications</h1>
          <div className="header-actions">
            <button onClick={markAllAsRead} className="button">
              Mark All Read
            </button>
            <Link href="/notifications/preferences" className="button">
              ⚙️ Preferences
            </Link>
          </div>
        </div>

        <div className="notifications-controls">
          <div className="filter-tabs">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`filter-tab ${filter === option.value ? 'active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="bulk-actions">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length}
                  onChange={handleSelectAll}
                />
                Select All
              </label>
              
              {selectedNotifications.length > 0 && (
                <div className="selected-actions">
                  <button 
                    onClick={() => markAsRead(selectedNotifications)}
                    className="button small"
                  >
                    Mark Read ({selectedNotifications.length})
                  </button>
                  <button 
                    onClick={() => deleteNotifications(selectedNotifications)}
                    className="button small danger"
                  >
                    Delete ({selectedNotifications.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="notifications-list">
          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No notifications</h3>
                <p>You're all caught up! New notifications will appear here.</p>
              </div>
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <label className="notification-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(prev => [...prev, notification.id]);
                      } else {
                        setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                      }
                    }}
                  />
                </label>

                <div 
                  className="notification-content"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-text">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-description">{notification.content}</div>
                    <div className="notification-meta">
                      <span className="notification-time">{formatDate(notification.createdAt)}</span>
                      {notification.triggeredBy && (
                        <span className="notification-user">
                          by {notification.triggeredBy.username}
                        </span>
                      )}
                    </div>
                  </div>

                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .notifications-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--border-color);
        }

        .page-header h1 {
          margin: 0;
          color: var(--text-color);
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .notifications-controls {
          margin-bottom: 20px;
        }

        .filter-tabs {
          display: flex;
          gap: 5px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 8px 16px;
          border: 1px solid var(--border-color);
          background: white;
          cursor: pointer;
          border-radius: 4px;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          background: #f5f5f5;
        }

        .filter-tab.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .bulk-actions {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .select-all {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .selected-actions {
          display: flex;
          gap: 10px;
        }

        .notifications-list {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .loading {
          padding: 40px;
          text-align: center;
          color: #666;
        }

        .no-notifications {
          padding: 60px 20px;
        }

        .empty-state {
          text-align: center;
          color: #666;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .notification-item:hover {
          background-color: #f8f9fa;
        }

        .notification-item.unread {
          background-color: #f0f8ff;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-checkbox {
          margin-right: 15px;
          cursor: pointer;
        }

        .notification-content {
          display: flex;
          flex: 1;
          cursor: pointer;
          position: relative;
        }

        .notification-icon {
          font-size: 1.5rem;
          margin-right: 15px;
          flex-shrink: 0;
        }

        .notification-text {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .notification-description {
          color: #666;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .notification-meta {
          display: flex;
          gap: 15px;
          font-size: 0.85rem;
          color: #999;
        }

        .unread-indicator {
          width: 8px;
          height: 8px;
          background: var(--primary-color);
          border-radius: 50%;
          margin-left: 10px;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .button {
          padding: 8px 16px;
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-color);
          text-decoration: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
          display: inline-block;
        }

        .button:hover {
          background: #f5f5f5;
        }

        .button.small {
          padding: 6px 12px;
          font-size: 0.85rem;
        }

        .button.danger {
          color: #dc3545;
          border-color: #dc3545;
        }

        .button.danger:hover {
          background: #dc3545;
          color: white;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .filter-tabs {
            flex-direction: column;
          }

          .bulk-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .selected-actions {
            width: 100%;
          }

          .notification-item {
            padding: 12px;
          }

          .notification-meta {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </Layout>
  );
}

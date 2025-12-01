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
          padding: 10px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          font-size: 11px;
        }

        .page-header {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid #6B84AA;
          border-bottom: none;
        }

        .page-header h1 {
          margin: 0;
          font-size: 12px;
          font-weight: bold;
        }

        .header-actions {
          display: flex;
          gap: 5px;
        }

        .notifications-controls {
          background: #F5F5F5;
          border: 1px solid #6B84AA;
          border-top: none;
          padding: 8px;
        }

        .filter-tabs {
          display: flex;
          gap: 3px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .filter-tab {
          padding: 4px 10px;
          border: 1px solid #808080;
          background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
          cursor: pointer;
          font-size: 11px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }

        .filter-tab:hover {
          background: linear-gradient(to bottom, #E0E0E0 0%, #D0D0D0 100%);
        }

        .filter-tab.active {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          border-color: #2B4F81;
        }

        .bulk-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px;
          background: #E5E5E5;
          border: 1px solid #C0C0C0;
        }

        .select-all {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          font-size: 11px;
        }

        .selected-actions {
          display: flex;
          gap: 5px;
        }

        .notifications-list {
          background: white;
          border: 1px solid #6B84AA;
          border-top: none;
        }

        .loading {
          padding: 30px;
          text-align: center;
          color: #666;
        }

        .no-notifications {
          padding: 40px 20px;
        }

        .empty-state {
          text-align: center;
          color: #666;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 12px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 8px 10px;
          border-bottom: 1px solid #E0E0E0;
        }

        .notification-item:hover {
          background-color: #F5F5F5;
        }

        .notification-item.unread {
          background-color: #FFFDE7;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-checkbox {
          margin-right: 10px;
          cursor: pointer;
        }

        .notification-content {
          display: flex;
          flex: 1;
          cursor: pointer;
          position: relative;
        }

        .notification-icon {
          font-size: 1.2rem;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .notification-text {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: bold;
          margin-bottom: 3px;
          color: #22497D;
          font-size: 11px;
        }

        .notification-description {
          color: #333;
          margin-bottom: 5px;
          line-height: 1.4;
        }

        .notification-meta {
          display: flex;
          gap: 10px;
          font-size: 10px;
          color: #808080;
        }

        .unread-indicator {
          width: 6px;
          height: 6px;
          background: #FF4400;
          border-radius: 50%;
          margin-left: 8px;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .button {
          padding: 4px 10px;
          border: 1px solid #808080;
          background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
          color: #333;
          text-decoration: none;
          cursor: pointer;
          font-size: 11px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          display: inline-block;
        }

        .button:hover {
          background: linear-gradient(to bottom, #E0E0E0 0%, #D0D0D0 100%);
        }

        .button.small {
          padding: 3px 8px;
          font-size: 10px;
        }

        .button.danger {
          color: #CC0000;
          border-color: #CC0000;
        }

        .button.danger:hover {
          background: #CC0000;
          color: white;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .filter-tabs {
            flex-direction: column;
          }

          .bulk-actions {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .selected-actions {
            width: 100%;
          }

          .notification-item {
            padding: 8px;
          }

          .notification-meta {
            flex-direction: column;
            gap: 3px;
          }
        }
      `}</style>
    </Layout>
  );
}

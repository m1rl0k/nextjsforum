import prisma from './prisma';

/**
 * Create a notification for a user
 * @param {Object} params - Notification parameters
 * @param {number} params.userId - ID of user to notify
 * @param {string} params.type - Notification type (enum value)
 * @param {string} params.title - Notification title
 * @param {string} params.content - Notification content
 * @param {string} params.actionUrl - URL to navigate when clicked
 * @param {Object} params.actionData - Additional data for the notification
 * @param {string} params.relatedType - Type of related content
 * @param {number} params.relatedId - ID of related content
 * @param {number} params.triggeredById - ID of user who triggered this notification
 * @param {string} params.priority - Notification priority
 */
export async function createNotification({
  userId,
  type,
  title,
  content,
  actionUrl = null,
  actionData = null,
  relatedType = null,
  relatedId = null,
  triggeredById = null,
  priority = 'NORMAL'
}) {
  try {
    // Check if user has notification preferences
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    // Check if user wants this type of notification
    if (preferences && !shouldSendNotification(type, preferences)) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        actionUrl,
        actionData: actionData ? JSON.stringify(actionData) : null,
        relatedType,
        relatedId,
        triggeredById,
        priority
      },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create notifications for thread replies
 */
export async function notifyThreadReply(threadId, postId, authorId) {
  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        user: true,
        subscriptions: {
          include: { user: true }
        }
      }
    });

    if (!thread) return;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true }
    });

    if (!post) return;

    const notifications = [];

    // Notify thread author (if not the same as post author)
    if (thread.userId !== authorId) {
      notifications.push(createNotification({
        userId: thread.userId,
        type: 'THREAD_REPLY',
        title: 'New reply to your thread',
        content: `${post.user.username} replied to "${thread.title}"`,
        actionUrl: `/threads/${threadId}#post-${postId}`,
        relatedType: 'thread',
        relatedId: threadId,
        triggeredById: authorId
      }));
    }

    // Notify subscribers (excluding author and thread owner)
    for (const subscription of thread.subscriptions) {
      if (subscription.userId !== authorId && subscription.userId !== thread.userId) {
        notifications.push(createNotification({
          userId: subscription.userId,
          type: 'THREAD_SUBSCRIBE',
          title: 'New post in subscribed thread',
          content: `${post.user.username} posted in "${thread.title}"`,
          actionUrl: `/threads/${threadId}#post-${postId}`,
          relatedType: 'thread',
          relatedId: threadId,
          triggeredById: authorId
        }));
      }
    }

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying thread reply:', error);
  }
}

/**
 * Create notification for post mentions
 */
export async function notifyMentions(postId, mentionedUsernames, authorId) {
  try {
    if (!mentionedUsernames || mentionedUsernames.length === 0) return;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        thread: true
      }
    });

    if (!post) return;

    const mentionedUsers = await prisma.user.findMany({
      where: {
        username: { in: mentionedUsernames },
        id: { not: authorId } // Don't notify the author
      }
    });

    const notifications = mentionedUsers.map(user => 
      createNotification({
        userId: user.id,
        type: 'POST_MENTION',
        title: 'You were mentioned',
        content: `${post.user.username} mentioned you in "${post.thread.title}"`,
        actionUrl: `/threads/${post.threadId}#post-${postId}`,
        relatedType: 'post',
        relatedId: postId,
        triggeredById: authorId
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying mentions:', error);
  }
}

/**
 * Create notification for private messages
 */
export async function notifyPrivateMessage(messageId, senderId, recipientId) {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true }
    });

    if (!message) return;

    await createNotification({
      userId: recipientId,
      type: 'PRIVATE_MESSAGE',
      title: 'New private message',
      content: `${message.sender.username} sent you a message`,
      actionUrl: `/messages/${messageId}`,
      relatedType: 'message',
      relatedId: messageId,
      triggeredById: senderId,
      priority: 'HIGH'
    });
  } catch (error) {
    console.error('Error notifying private message:', error);
  }
}

/**
 * Check if user wants to receive this type of notification
 */
function shouldSendNotification(type, preferences) {
  const typeMap = {
    'THREAD_REPLY': preferences.browserThreadReply,
    'POST_REPLY': preferences.browserPostReply,
    'POST_MENTION': preferences.browserMentions,
    'PRIVATE_MESSAGE': preferences.browserMessages,
    'MODERATION_ACTION': preferences.browserModeration,
    'SYSTEM_ALERT': preferences.browserSystem,
    'THREAD_SUBSCRIBE': preferences.browserThreadReply
  };

  return typeMap[type] !== false;
}

/**
 * Extract @mentions from content
 */
export function extractMentions(content) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

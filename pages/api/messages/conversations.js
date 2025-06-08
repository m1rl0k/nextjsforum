import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import { notifyPrivateMessage } from '../../../lib/notifications';

export default async function handler(req, res) {
  try {
    // Get token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (req.method === 'GET') {
      const { conversationId, limit = 20, offset = 0 } = req.query;

      if (conversationId) {
        // Get messages in a specific conversation
        const messages = await prisma.message.findMany({
          where: {
            conversationId,
            OR: [
              { senderId: user.id },
              { recipientId: user.id }
            ],
            isDeleted: false
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            recipient: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            },
            replyTo: {
              select: {
                id: true,
                content: true,
                sender: {
                  select: {
                    username: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: parseInt(limit),
          skip: parseInt(offset)
        });

        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            conversationId,
            recipientId: user.id,
            isRead: false
          },
          data: { isRead: true }
        });

        res.status(200).json({ messages });

      } else {
        // Get conversation list
        const conversations = await prisma.$queryRaw`
          WITH latest_messages AS (
            SELECT DISTINCT ON (conversation_id)
              m.*,
              ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
            FROM messages m
            WHERE (m.sender_id = ${user.id} OR m.recipient_id = ${user.id})
              AND m.conversation_id IS NOT NULL
              AND m.is_deleted = false
            ORDER BY conversation_id, created_at DESC
          )
          SELECT 
            lm.*,
            sender.username as sender_username,
            sender.avatar as sender_avatar,
            recipient.username as recipient_username,
            recipient.avatar as recipient_avatar,
            (SELECT COUNT(*) FROM messages WHERE conversation_id = lm.conversation_id AND recipient_id = ${user.id} AND is_read = false) as unread_count
          FROM latest_messages lm
          LEFT JOIN "User" sender ON lm.sender_id = sender.id
          LEFT JOIN "User" recipient ON lm.recipient_id = recipient.id
          WHERE rn = 1
          ORDER BY lm.created_at DESC
          LIMIT ${parseInt(limit)}
          OFFSET ${parseInt(offset)}
        `;

        res.status(200).json({ conversations });
      }

    } else if (req.method === 'POST') {
      const { 
        recipientUsername, 
        content, 
        subject,
        conversationId,
        replyToId,
        priority = 'NORMAL'
      } = req.body;

      if (!recipientUsername || !content) {
        return res.status(400).json({ error: 'Recipient and content are required' });
      }

      // Find recipient user
      const recipientUser = await prisma.user.findUnique({
        where: { username: recipientUsername },
      });

      if (!recipientUser) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      // Prevent sending message to self
      if (user.id === recipientUser.id) {
        return res.status(400).json({ error: 'Cannot send message to yourself' });
      }

      // Generate conversation ID if not provided
      let finalConversationId = conversationId;
      if (!finalConversationId) {
        // Create conversation ID based on user IDs (consistent ordering)
        const userIds = [user.id, recipientUser.id].sort();
        finalConversationId = `conv_${userIds[0]}_${userIds[1]}_${Date.now()}`;
      }

      const message = await prisma.message.create({
        data: {
          subject,
          content,
          senderId: user.id,
          recipientId: recipientUser.id,
          conversationId: finalConversationId,
          replyToId: replyToId ? parseInt(replyToId) : null,
          priority
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          recipient: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      });

      // Send notification
      await notifyPrivateMessage(message.id, user.id, recipientUser.id);

      res.status(201).json(message);

    } else if (req.method === 'PUT') {
      // Mark conversation as read
      const { conversationId } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID required' });
      }

      await prisma.message.updateMany({
        where: {
          conversationId,
          recipientId: user.id,
          isRead: false
        },
        data: { isRead: true }
      });

      res.status(200).json({ success: true });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling conversation:', error);
    res.status(500).json({ error: 'Failed to handle conversation' });
  }
}

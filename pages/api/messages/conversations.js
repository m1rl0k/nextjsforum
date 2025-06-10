import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';
import { notifyPrivateMessage } from '../../../lib/notifications';
import { serializeBigInt, serializeRawQuery } from '../../../lib/bigintUtils';

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
            SELECT DISTINCT ON ("conversationId")
              m.*,
              ROW_NUMBER() OVER (PARTITION BY "conversationId" ORDER BY "createdAt" DESC) as rn
            FROM messages m
            WHERE (m."senderId" = ${user.id} OR m."recipientId" = ${user.id})
              AND m."conversationId" IS NOT NULL
              AND m."isDeleted" = false
            ORDER BY "conversationId", "createdAt" DESC
          )
          SELECT
            lm.*,
            sender.username as sender_username,
            sender.avatar as sender_avatar,
            recipient.username as recipient_username,
            recipient.avatar as recipient_avatar,
            (SELECT COUNT(*) FROM messages WHERE "conversationId" = lm."conversationId" AND "recipientId" = ${user.id} AND "isRead" = false) as unread_count
          FROM latest_messages lm
          LEFT JOIN "User" sender ON lm."senderId" = sender.id
          LEFT JOIN "User" recipient ON lm."recipientId" = recipient.id
          WHERE rn = 1
          ORDER BY lm."createdAt" DESC
          LIMIT ${parseInt(limit)}
          OFFSET ${parseInt(offset)}
        `;

        // Convert BigInt values to strings for JSON serialization
        const serializedConversations = serializeRawQuery(conversations);

        res.status(200).json({ conversations: serializedConversations });
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

      // Convert BigInt values to strings for JSON serialization
      const serializedMessage = serializeBigInt(message);

      res.status(201).json(serializedMessage);

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

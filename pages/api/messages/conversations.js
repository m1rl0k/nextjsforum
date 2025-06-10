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
            ]
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

        // If no messages found with exact conversation ID, try to find messages between users
        if (messages.length === 0) {
          // Extract user IDs from conversation ID if it follows the conv_X_Y format
          const convMatch = conversationId.match(/^conv_(\d+)_(\d+)$/);
          if (convMatch) {
            const [, userId1, userId2] = convMatch;
            const userIds = [parseInt(userId1), parseInt(userId2)];

            // Find messages between these users
            const fallbackMessages = await prisma.message.findMany({
              where: {
                OR: [
                  { senderId: userIds[0], recipientId: userIds[1] },
                  { senderId: userIds[1], recipientId: userIds[0] }
                ],
                AND: {
                  OR: [
                    { senderId: user.id },
                    { recipientId: user.id }
                  ]
                }
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



            if (fallbackMessages.length > 0) {
              // Update these messages to have the correct conversation ID
              await prisma.message.updateMany({
                where: {
                  OR: [
                    { senderId: userIds[0], recipientId: userIds[1] },
                    { senderId: userIds[1], recipientId: userIds[0] }
                  ]
                },
                data: { conversationId }
              });

              // Use the fallback messages
              const serializedMessages = serializeBigInt(fallbackMessages);
              res.status(200).json({ messages: serializedMessages });
              return;
            }
          }
        }

        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            conversationId,
            recipientId: user.id,
            isRead: false
          },
          data: { isRead: true }
        });

        // Serialize the messages
        const serializedMessages = serializeBigInt(messages);
        res.status(200).json({ messages: serializedMessages });

      } else {
        // Get conversation list - first update any messages without conversation IDs
        await prisma.$executeRaw`
          UPDATE messages
          SET "conversationId" = CASE
            WHEN "senderId" < "recipientId" THEN CONCAT('conv_', "senderId", '_', "recipientId")
            ELSE CONCAT('conv_', "recipientId", '_', "senderId")
          END
          WHERE "conversationId" IS NULL
            AND ("senderId" = ${user.id} OR "recipientId" = ${user.id})
        `;

        const conversations = await prisma.$queryRaw`
          WITH latest_messages AS (
            SELECT DISTINCT ON ("conversationId")
              m.*,
              ROW_NUMBER() OVER (PARTITION BY "conversationId" ORDER BY "createdAt" DESC) as rn
            FROM messages m
            WHERE (m."senderId" = ${user.id} OR m."recipientId" = ${user.id})
              AND m."conversationId" IS NOT NULL
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
        // Check if a conversation already exists between these users
        const existingMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, recipientId: recipientUser.id },
              { senderId: recipientUser.id, recipientId: user.id }
            ],
            conversationId: { not: null }
          },
          select: { conversationId: true }
        });

        if (existingMessage && existingMessage.conversationId) {
          finalConversationId = existingMessage.conversationId;
        } else {
          // Create conversation ID based on user IDs (consistent ordering, no timestamp)
          const userIds = [user.id, recipientUser.id].sort();
          finalConversationId = `conv_${userIds[0]}_${userIds[1]}`;
        }
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

import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Send message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, content, mediaUrl } = req.body;

    if (!receiverId || (!content && !mediaUrl)) {
      return res.status(400).json({
        status: 'error',
        message: 'Receiver ID and content/media are required',
      });
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found',
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId: senderId!,
        receiverId,
        content,
        mediaUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: receiverId,
        senderId,
        type: 'MESSAGE',
        entityId: message.id,
        message: `${req.user?.username} sent you a message`,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: { message },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get conversations
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get all users the current user has messaged with
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const userIds = [
      ...sentMessages.map((m) => m.receiverId),
      ...receivedMessages.map((m) => m.senderId),
    ];

    const uniqueUserIds = [...new Set(userIds)];

    // Get conversation details
    const conversations = await Promise.all(
      uniqueUserIds.map(async (otherUserId) => {
        const user = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        });

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          user,
          lastMessage,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || new Date(0);
      const bTime = b.lastMessage?.createdAt || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

    res.status(200).json({
      status: 'success',
      data: { conversations },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get messages with a user
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        skip,
        take: Number(limit),
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      }),
    ]);

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.status(200).json({
      status: 'success',
      data: {
        messages: messages.reverse(),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

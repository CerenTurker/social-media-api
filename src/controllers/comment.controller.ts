import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Create comment
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment content is required',
      });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, commentsEnabled: true },
    });

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found',
      });
    }

    if (!post.commentsEnabled) {
      return res.status(403).json({
        status: 'error',
        message: 'Comments are disabled for this post',
      });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: userId!,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    });

    // Update post comments count
    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    // Create notification
    if (post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          senderId: userId,
          type: 'COMMENT',
          entityId: postId,
          message: `${req.user?.username} commented on your post`,
        },
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Comment created successfully',
      data: { comment },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create comment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get post comments
export const getPostComments = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          parentId: null, // Only top-level comments
        },
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isVerified: true,
            },
          },
          replies: {
            take: 3,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              replies: true,
              likes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        comments: comments.map((comment) => ({
          ...comment,
          repliesCount: comment._count.replies,
          likesCount: comment._count.likes,
        })),
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
      message: 'Failed to fetch comments',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get comment replies
export const getCommentReplies = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const replies = await prisma.comment.findMany({
      where: { parentId: commentId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      data: { replies },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch replies',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete comment
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found',
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this comment',
      });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Update post comments count
    await prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete comment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

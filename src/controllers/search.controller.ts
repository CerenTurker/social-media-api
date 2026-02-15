import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Search users
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query as any;
    const currentUserId = req.user?.id;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required',
      });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      take: 20,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        bio: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Search posts
export const searchPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query as any;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required',
      });
    }

    const posts = await prisma.post.findMany({
      where: {
        content: { contains: query, mode: 'insensitive' },
        isPublic: true,
      },
      take: 20,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts: posts.map((post) => ({
          ...post,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Search hashtags
export const searchHashtags = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query as any;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required',
      });
    }

    const hashtags = await prisma.hashtag.findMany({
      where: {
        name: { contains: query.toLowerCase(), mode: 'insensitive' },
      },
      take: 20,
      orderBy: { count: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { hashtags },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get trending hashtags
export const getTrendingHashtags = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10 } = req.query as any;

    const hashtags = await prisma.hashtag.findMany({
      take: Number(limit),
      orderBy: { count: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { hashtags },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch trending hashtags',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Get user profile by username
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        website: true,
        location: true,
        isVerified: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Get stats
    const [postsCount, followersCount, followingCount] = await Promise.all([
      prisma.post.count({ where: { userId: user.id } }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        stats: {
          postsCount,
          followersCount,
          followingCount,
        },
        isFollowing,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Follow user
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const { userId } = req.params;

    if (currentUserId === userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot follow yourself',
      });
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToFollow) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId!,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({
        status: 'error',
        message: 'Already following this user',
      });
    }

    // Create follow
    await prisma.follow.create({
      data: {
        followerId: currentUserId!,
        followingId: userId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: userId,
        senderId: currentUserId,
        type: 'FOLLOW',
        message: `${req.user?.username} started following you`,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'User followed successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to follow user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Unfollow user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const { userId } = req.params;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId!,
          followingId: userId,
        },
      },
    });

    if (!follow) {
      return res.status(404).json({
        status: 'error',
        message: 'Not following this user',
      });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId!,
          followingId: userId,
        },
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'User unfollowed successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to unfollow user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get followers
export const getFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: user.id },
        skip,
        take: Number(limit),
        include: {
          follower: {
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        followers: followers.map((f) => f.follower),
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
      message: 'Failed to fetch followers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get following
export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: user.id },
        skip,
        take: Number(limit),
        include: {
          following: {
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        following: following.map((f) => f.following),
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
      message: 'Failed to fetch following',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

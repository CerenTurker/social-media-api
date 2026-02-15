import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Create post
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { content, mediaUrls, mediaType, location } = req.body;

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Post must have content or media',
      });
    }

    // Extract hashtags from content
    const hashtags = content?.match(/#[a-zA-Z0-9_]+/g)?.map((tag: string) => tag.substring(1)) || [];

    // Extract mentions from content
    const mentions = content?.match(/@[a-zA-Z0-9_]+/g)?.map((mention: string) => mention.substring(1)) || [];

    // Create post
    const post = await prisma.post.create({
      data: {
        userId: userId!,
        content,
        mediaUrls: mediaUrls || [],
        mediaType: mediaType || 'IMAGE',
        location,
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

    // Create hashtags
    for (const tag of hashtags) {
      let hashtag = await prisma.hashtag.findUnique({
        where: { name: tag.toLowerCase() },
      });

      if (!hashtag) {
        hashtag = await prisma.hashtag.create({
          data: { name: tag.toLowerCase(), count: 1 },
        });
      } else {
        await prisma.hashtag.update({
          where: { id: hashtag.id },
          data: { count: { increment: 1 } },
        });
      }

      await prisma.postHashtag.create({
        data: {
          postId: post.id,
          hashtagId: hashtag.id,
        },
      });
    }

    // Create mentions
    for (const username of mentions) {
      const mentionedUser = await prisma.user.findUnique({
        where: { username },
      });

      if (mentionedUser) {
        await prisma.postMention.create({
          data: {
            postId: post.id,
            userId: mentionedUser.id,
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: mentionedUser.id,
            senderId: userId,
            type: 'MENTION',
            entityId: post.id,
            message: `${req.user?.username} mentioned you in a post`,
          },
        });
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Post created successfully',
      data: { post },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get feed (following users' posts)
export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    // Get users that current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId!); // Include own posts

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          userId: { in: followingIds },
          isPublic: true,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({
        where: {
          userId: { in: followingIds },
          isPublic: true,
        },
      }),
    ]);

    // Check if user liked each post
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post) => {
        const liked = await prisma.like.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId: userId!,
            },
          },
        });

        return {
          ...post,
          isLiked: !!liked,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: {
        posts: postsWithLikeStatus,
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
      message: 'Failed to fetch feed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get user posts
export const getUserPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 12 } = req.query as any;
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

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { userId: user.id },
        skip,
        take: Number(limit),
        include: {
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where: { userId: user.id } }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        posts: posts.map((post) => ({
          ...post,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
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
      message: 'Failed to fetch user posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get single post
export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const post = await prisma.post.findUnique({
      where: { id },
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
        comments: {
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
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found',
      });
    }

    // Check if user liked
    const liked = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: userId!,
        },
      },
    });

    // Increment views
    await prisma.post.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    res.status(200).json({
      status: 'success',
      data: {
        post: {
          ...post,
          isLiked: !!liked,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Like post
export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found',
      });
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: userId!,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({
        status: 'error',
        message: 'Post already liked',
      });
    }

    // Create like
    await prisma.like.create({
      data: {
        postId: id,
        userId: userId!,
      },
    });

    // Update post likes count
    await prisma.post.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    });

    // Create notification
    if (post.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          senderId: userId,
          type: 'LIKE',
          entityId: id,
          message: `${req.user?.username} liked your post`,
        },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Post liked successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to like post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Unlike post
export const unlikePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: userId!,
        },
      },
    });

    if (!like) {
      return res.status(404).json({
        status: 'error',
        message: 'Like not found',
      });
    }

    await prisma.like.delete({
      where: {
        postId_userId: {
          postId: id,
          userId: userId!,
        },
      },
    });

    // Update post likes count
    await prisma.post.update({
      where: { id },
      data: { likesCount: { decrement: 1 } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Post unliked successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to unlike post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete post
export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found',
      });
    }

    if (post.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this post',
      });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

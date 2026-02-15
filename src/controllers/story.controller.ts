import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

// Create story
export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { mediaUrl, mediaType, caption } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Media URL is required',
      });
    }

    // Story expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await prisma.story.create({
      data: {
        userId: userId!,
        mediaUrl,
        mediaType: mediaType || 'IMAGE',
        caption,
        expiresAt,
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

    res.status(201).json({
      status: 'success',
      message: 'Story created successfully',
      data: { story },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create story',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get stories from following users
export const getStories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get users that current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId!); // Include own stories

    // Get active stories (not expired)
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: followingIds },
        expiresAt: { gt: new Date() },
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
        views: {
          where: { userId: userId! },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group stories by user
    const groupedStories = stories.reduce((acc: any, story) => {
      const existingUser = acc.find((u: any) => u.userId === story.userId);
      const storyData = {
        ...story,
        isViewed: story.views.length > 0,
      };

      if (existingUser) {
        existingUser.stories.push(storyData);
      } else {
        acc.push({
          userId: story.userId,
          user: story.user,
          stories: [storyData],
        });
      }

      return acc;
    }, []);

    res.status(200).json({
      status: 'success',
      data: { stories: groupedStories },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch stories',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// View story
export const viewStory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { storyId } = req.params;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found',
      });
    }

    // Check if already viewed
    const existingView = await prisma.storyView.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: userId!,
        },
      },
    });

    if (!existingView) {
      // Create view
      await prisma.storyView.create({
        data: {
          storyId,
          userId: userId!,
        },
      });

      // Update story views count
      await prisma.story.update({
        where: { id: storyId },
        data: { viewsCount: { increment: 1 } },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Story viewed',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to view story',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete story
export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { storyId } = req.params;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return res.status(404).json({
        status: 'error',
        message: 'Story not found',
      });
    }

    if (story.userId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this story',
      });
    }

    await prisma.story.delete({
      where: { id: storyId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Story deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete story',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

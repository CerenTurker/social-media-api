import { Router } from 'express';
import {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/:username', authenticate, getUserProfile);
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/unfollow', authenticate, unfollowUser);
router.get('/:username/followers', authenticate, getFollowers);
router.get('/:username/following', authenticate, getFollowing);

export default router;

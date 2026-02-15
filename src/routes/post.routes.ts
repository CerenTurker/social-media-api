import { Router } from 'express';
import {
  createPost,
  getFeed,
  getUserPosts,
  getPost,
  likePost,
  unlikePost,
  deletePost,
} from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createPost);
router.get('/feed', getFeed);
router.get('/user/:username', getUserPosts);
router.get('/:id', getPost);
router.post('/:id/like', likePost);
router.delete('/:id/unlike', unlikePost);
router.delete('/:id', deletePost);

export default router;

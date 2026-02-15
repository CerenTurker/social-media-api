import { Router } from 'express';
import {
  createComment,
  getPostComments,
  getCommentReplies,
  deleteComment,
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/:postId', createComment);
router.get('/:postId', getPostComments);
router.get('/:commentId/replies', getCommentReplies);
router.delete('/:commentId', deleteComment);

export default router;

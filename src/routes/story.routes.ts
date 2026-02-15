import { Router } from 'express';
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
} from '../controllers/story.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createStory);
router.get('/', getStories);
router.post('/:storyId/view', viewStory);
router.delete('/:storyId', deleteStory);

export default router;

import { Router } from 'express';
import { searchUsers, searchPosts, searchHashtags, getTrendingHashtags } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/users', searchUsers);
router.get('/posts', searchPosts);
router.get('/hashtags', searchHashtags);
router.get('/trending', getTrendingHashtags);

export default router;

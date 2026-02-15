import { Router } from 'express';
import { sendMessage, getConversations, getMessages } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/:otherUserId', getMessages);

export default router;

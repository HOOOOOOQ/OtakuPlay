import { Router } from 'express';
import {
  addGroupMember,
  createConversation,
  deleteOwnMessage,
  getConversations,
  getMessages,
  leaveGroup,
  markConversationRead,
  removeGroupMember,
  sendMessage,
  updateGroup,
} from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  createConversationSchema,
  sendMessageSchema,
  updateGroupSchema,
} from '../validators/chat.validator';

const router = Router();

router.use(authenticate);

router.get('/', getConversations);
router.post('/', validateBody(createConversationSchema), createConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', validateBody(sendMessageSchema), sendMessage);
router.post('/:id/read', markConversationRead);
router.patch('/:id', validateBody(updateGroupSchema), updateGroup);
router.post('/:id/members', addGroupMember);
router.delete('/:id/members/:userId', removeGroupMember);
router.post('/:id/leave', leaveGroup);
router.delete('/messages/:messageId', deleteOwnMessage);

export default router;

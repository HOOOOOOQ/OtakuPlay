import { Router } from 'express';
import {
  blockUser,
  deleteMyAccount,
  followUser,
  getMe,
  getUserByUsername,
  getVerificationStatus,
  muteUser,
  requestVerification,
  searchUsers,
  unblockUser,
  unfollowUser,
  updateMe,
} from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateProfileSchema, verificationRequestSchema } from '../validators/user.validator';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateMe);
router.delete('/me', authenticate, deleteMyAccount);
router.get('/search', optionalAuth, searchUsers);
router.get('/:username', optionalAuth, getUserByUsername);
router.post('/:id/follow', authenticate, followUser);
router.delete('/:id/follow', authenticate, unfollowUser);
router.post('/:id/block', authenticate, blockUser);
router.delete('/:id/block', authenticate, unblockUser);
router.post('/:id/mute', authenticate, muteUser);

// Also mounted via verification alias
export const verificationRouter = Router();
verificationRouter.post(
  '/request',
  authenticate,
  validateBody(verificationRequestSchema),
  requestVerification
);
verificationRouter.get('/status', authenticate, getVerificationStatus);

export default router;

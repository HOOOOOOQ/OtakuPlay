import { Router } from 'express';
import {
  createComment,
  createPost,
  createReport,
  deletePost,
  getComments,
  getPostById,
  getPosts,
  handleMediaUpload,
  sharePost,
  togglePostBookmark,
  togglePostLike,
} from '../controllers/community.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { uploadMedia } from '../middlewares/upload.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  createCommentSchema,
  createPostSchema,
  createReportSchema,
} from '../validators/community.validator';

const router = Router();

router.get('/', optionalAuth, getPosts);
router.post('/', authenticate, validateBody(createPostSchema), createPost);
router.get('/:id', optionalAuth, getPostById);
router.delete('/:id', authenticate, deletePost);
router.post('/:id/like', authenticate, togglePostLike);
router.post('/:id/bookmark', authenticate, togglePostBookmark);
router.post('/:id/share', authenticate, sharePost);
router.get('/:id/comments', optionalAuth, getComments);
router.post('/:id/comments', authenticate, validateBody(createCommentSchema), createComment);

export const reportsRouter = Router();
reportsRouter.post('/', authenticate, validateBody(createReportSchema), createReport);

export const uploadsRouter = Router();
uploadsRouter.post('/media', authenticate, uploadMedia.single('file'), handleMediaUpload);

export default router;

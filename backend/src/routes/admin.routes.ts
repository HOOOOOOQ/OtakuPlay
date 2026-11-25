import { Router } from 'express';
import {
  adminDeleteComment,
  adminDeletePost,
  approvePostContribution,
  createAdminContent,
  deleteAdminContent,
  getAdminDashboard,
  listAdminComments,
  listAdminContent,
  listAdminUsers,
  listAuditLogs,
  listModerationPosts,
  listReports,
  listVerificationRequests,
  resolveReport,
  reviewVerificationRequest,
  updateAdminUserStatus,
} from '../controllers/admin.controller';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  createContentSchema,
  resolveReportSchema,
  reviewVerificationSchema,
  updateUserStatusSchema,
} from '../validators/admin.validator';

const router = Router();

router.use(authenticate, requireRoles('moderator', 'admin', 'super_admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/users', listAdminUsers);
router.patch(
  '/users/:id/status',
  requireRoles('admin', 'super_admin'),
  validateBody(updateUserStatusSchema),
  updateAdminUserStatus
);

router.get('/verifications', listVerificationRequests);
router.patch(
  '/verification/:id',
  requireRoles('admin', 'super_admin'),
  validateBody(reviewVerificationSchema),
  reviewVerificationRequest
);

router.get('/reports', listReports);
router.patch('/reports/:id', validateBody(resolveReportSchema), resolveReport);

router.get('/posts', listModerationPosts);
router.delete('/posts/:id', adminDeletePost);
router.post('/posts/:id/approve-contribution', approvePostContribution);

router.get('/comments', listAdminComments);
router.delete('/comments/:id', adminDeleteComment);

router.get('/content', requireRoles('admin', 'super_admin'), listAdminContent);
router.post(
  '/content',
  requireRoles('admin', 'super_admin'),
  validateBody(createContentSchema),
  createAdminContent
);
router.delete('/content/:id', requireRoles('admin', 'super_admin'), deleteAdminContent);

router.get('/audit-logs', requireRoles('admin', 'super_admin'), listAuditLogs);

export default router;

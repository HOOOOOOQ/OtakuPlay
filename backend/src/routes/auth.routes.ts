import { Router } from 'express';
import {
  changeEmailRequestSchema,
  changeEmailVerifySchema,
  changePasswordSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validator';
import {
  changePassword,
  forgotPassword,
  getSessions,
  googleAuth,
  loginWithPassword,
  logout,
  logoutAllDevices,
  refreshAuthToken,
  registerWithPassword,
  requestEmailChange,
  resetPassword,
  verifyEmailChange,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();

router.post('/google', authLimiter, validateBody(googleLoginSchema), googleAuth);
router.post('/register', authLimiter, validateBody(registerSchema), registerWithPassword);
router.post('/login', authLimiter, validateBody(loginSchema), loginWithPassword);
router.post('/refresh', authLimiter, validateBody(refreshSchema), refreshAuthToken);
router.post('/logout', authenticate, validateBody(logoutSchema), logout);
router.post('/logout-all', authenticate, logoutAllDevices);
router.get('/sessions', authenticate, getSessions);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), changePassword);
router.post(
  '/change-email/request',
  authenticate,
  validateBody(changeEmailRequestSchema),
  requestEmailChange
);
router.post(
  '/change-email/verify',
  authenticate,
  validateBody(changeEmailVerifySchema),
  verifyEmailChange
);

export default router;

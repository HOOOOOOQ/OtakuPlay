import { NextFunction, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';
import {
  AdminAuditLog,
  Announcement,
  Comment,
  Message,
  Post,
  Report,
  User,
  VerificationRequest,
} from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  awardXp,
  checkAndUnlockAchievement,
  XP_REWARDS,
} from '../services/gamification.service';
import { createNotification } from '../services/notification.service';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { getPagination, sendSuccess } from '../utils/response';

async function writeAuditLog(
  req: AuthenticatedRequest,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  await AdminAuditLog.create({
    actorId: req.user!.id,
    actorRole: req.user!.role,
    action,
    targetType,
    targetId,
    metadata,
    ipAddress: req.ip || '',
  });
}

export async function getAdminDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalPosts,
      totalComments,
      totalMessages,
      pendingVerifications,
      pendingReports,
      recentUsersAgg,
      recentPostsAgg,
    ] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, status: 'active', lastSeen: { $gte: oneDayAgo } }),
      User.countDocuments({ deletedAt: null, createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ isDeleted: false }),
      Comment.countDocuments({ isDeleted: false }),
      Message.countDocuments({ isDeleted: false }),
      VerificationRequest.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: { $in: ['pending', 'reviewing'] } }),
      User.aggregate([
        { $match: { deletedAt: null, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Post.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const userMap = new Map(recentUsersAgg.map((r) => [r._id as string, r.count as number]));
    const postMap = new Map(recentPostsAgg.map((r) => [r._id as string, r.count as number]));
    const activitySeries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
      activitySeries.push({
        date: d,
        newUsers: userMap.get(d) || 0,
        newPosts: postMap.get(d) || 0,
      });
    }

    return sendSuccess(res, {
      metrics: {
        totalUsers,
        activeUsers,
        newUsers,
        totalPosts,
        totalComments,
        totalMessages,
        verificationRequests: pendingVerifications,
        reports: pendingReports,
      },
      apiHealth: {
        status: isDatabaseConnected() ? 'healthy' : 'degraded',
        database: isDatabaseConnected() ? 'connected' : 'disconnected',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: now.toISOString(),
      },
      activitySeries,
    });
  } catch (err) {
    return next(err);
  }
}

export async function listAdminUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, 50);
    const q = String(req.query.q || '').trim();
    const status = String(req.query.status || '').trim();
    const role = String(req.query.role || '').trim();

    const filter: Record<string, unknown> = { deletedAt: null };
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          'username email displayName avatarUrl role status isVerified verifiedAt xp level levelTitle lastSeen createdAt'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, users, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function updateAdminUserStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const target = await User.findById(req.params.id);
    if (!target || target.deletedAt) throw new NotFoundError('Pengguna tidak ditemukan');

    const { status, role, suspendedDays, banReason, isVerified } = req.body;

    if (role !== undefined) {
      if (!['admin', 'super_admin'].includes(req.user!.role)) {
        throw new ForbiddenError('Hanya Admin/Super Admin yang dapat mengubah peran pengguna');
      }
      if (role === 'super_admin' && req.user!.role !== 'super_admin') {
        throw new ForbiddenError('Hanya Super Admin yang dapat menetapkan peran Super Admin');
      }
      target.role = role;
    }

    if (status !== undefined) {
      if (target.role === 'super_admin' && req.user!.role !== 'super_admin') {
        throw new ForbiddenError('Tidak dapat mengubah status Super Admin');
      }
      target.status = status;
      target.banReason = banReason;
      target.suspendedUntil =
        status === 'suspended' && suspendedDays
          ? new Date(Date.now() + suspendedDays * 86400000)
          : undefined;
    }

    if (isVerified !== undefined) {
      target.isVerified = isVerified;
      target.verifiedAt = isVerified ? new Date() : undefined;
      target.verifiedBy = isVerified ? (req.user!.id as unknown as typeof target.verifiedBy) : undefined;
    }

    await target.save();

    await writeAuditLog(req, 'USER_UPDATED', 'user', String(target._id), {
      status,
      role,
      isVerified,
      banReason,
    });

    return sendSuccess(res, target, 200, 'Status pengguna diperbarui');
  } catch (err) {
    return next(err);
  }
}

export async function listVerificationRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const status = String(req.query.status || 'pending');
    const items = await VerificationRequest.find(status === 'all' ? {} : { status })
      .populate('userId', 'username displayName avatarUrl email level xp isVerified')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return sendSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}

export async function reviewVerificationRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const requestDoc = await VerificationRequest.findById(req.params.id);
    if (!requestDoc) throw new NotFoundError('Permohonan verifikasi tidak ditemukan');

    const { status, reviewNotes } = req.body;
    requestDoc.status = status;
    requestDoc.reviewedBy = req.user!.id as unknown as typeof requestDoc.reviewedBy;
    requestDoc.reviewedAt = new Date();
    requestDoc.reviewNotes = reviewNotes;
    await requestDoc.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(requestDoc.userId, {
        $set: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: req.user!.id,
        },
      });
      await checkAndUnlockAchievement(requestDoc.userId, 'VERIFIED_OTAKU');
    }

    await createNotification({
      userId: requestDoc.userId,
      actorId: req.user!.id,
      type: 'verification_result',
      title:
        status === 'approved'
          ? 'Selamat! Akun Kamu Terverifikasi'
          : 'Permohonan Verifikasi Ditolak',
      body:
        status === 'approved'
          ? 'Lencana verifikasi biru OtakuPlay sekarang aktif di profil kamu.'
          : reviewNotes || 'Permohonan verifikasi kamu belum memenuhi kriteria saat ini.',
      data: { status },
    });

    await writeAuditLog(req, `VERIFICATION_${status.toUpperCase()}`, 'verification', String(requestDoc._id), {
      userId: String(requestDoc.userId),
      reviewNotes,
    });

    return sendSuccess(res, requestDoc, 200, 'Permohonan verifikasi diproses');
  } catch (err) {
    return next(err);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const status = String(req.query.status || 'pending');
    const items = await Report.find(status === 'all' ? {} : { status })
      .populate('reporterId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return sendSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}

export async function resolveReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) throw new NotFoundError('Laporan tidak ditemukan');

    const { status, resolutionNote, deleteTargetContent } = req.body;
    report.status = status;
    report.resolutionNote = resolutionNote;
    report.resolvedBy = req.user!.id as unknown as typeof report.resolvedBy;
    report.resolvedAt = new Date();
    await report.save();

    if (deleteTargetContent) {
      if (report.targetType === 'post') {
        await Post.findByIdAndUpdate(report.targetId, {
          $set: { isDeleted: true, moderationStatus: 'removed' },
        });
      } else if (report.targetType === 'comment') {
        await Comment.findByIdAndUpdate(report.targetId, { $set: { isDeleted: true } });
      } else if (report.targetType === 'message') {
        await Message.findByIdAndUpdate(report.targetId, {
          $set: { isDeleted: true, content: '' },
        });
      }
    }

    await writeAuditLog(req, 'REPORT_RESOLVED', 'report', String(report._id), {
      status,
      deleteTargetContent,
      targetType: report.targetType,
    });

    return sendSuccess(res, report);
  } catch (err) {
    return next(err);
  }
}

export async function listModerationPosts(_req: Request, res: Response, next: NextFunction) {
  try {
    const posts = await Post.find({ isDeleted: false })
      .populate('authorId', 'username displayName avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return sendSuccess(res, posts);
  } catch (err) {
    return next(err);
  }
}

export async function adminDeletePost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true, moderationStatus: 'removed' } },
      { new: true }
    );
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');

    await writeAuditLog(req, 'POST_REMOVED', 'post', String(post._id));
    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}

export async function approvePostContribution(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');
    if (!post.isApprovedContribution) {
      post.isApprovedContribution = true;
      await post.save();
      await awardXp(post.authorId, XP_REWARDS.APPROVED_CONTRIBUTION, 'Kontribusi Komunitas Disetujui');
      await writeAuditLog(req, 'POST_CONTRIBUTION_APPROVED', 'post', String(post._id));
    }
    return sendSuccess(res, post);
  } catch (err) {
    return next(err);
  }
}

export async function listAdminComments(_req: Request, res: Response, next: NextFunction) {
  try {
    const comments = await Comment.find({ isDeleted: false })
      .populate('authorId', 'username displayName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return sendSuccess(res, comments);
  } catch (err) {
    return next(err);
  }
}

export async function adminDeleteComment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!comment) throw new NotFoundError('Komentar tidak ditemukan');
    await writeAuditLog(req, 'COMMENT_REMOVED', 'comment', String(comment._id));
    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}

export async function listAdminContent(_req: Request, res: Response, next: NextFunction) {
  try {
    const items = await Announcement.find().sort({ priority: -1, createdAt: -1 }).limit(100).lean();
    return sendSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}

export async function createAdminContent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const doc = await Announcement.create({
      ...req.body,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      createdBy: req.user!.id,
    });
    await writeAuditLog(req, 'CONTENT_CREATED', doc.kind, String(doc._id), { title: doc.title });
    return sendSuccess(res, doc, 201);
  } catch (err) {
    return next(err);
  }
}

export async function deleteAdminContent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) throw new NotFoundError('Konten tidak ditemukan');
    await writeAuditLog(req, 'CONTENT_DELETED', deleted.kind, String(deleted._id));
    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}

export async function listAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, 100);
    const [logs, total] = await Promise.all([
      AdminAuditLog.find()
        .populate('actorId', 'username displayName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminAuditLog.countDocuments(),
    ]);
    return sendSuccess(res, logs, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

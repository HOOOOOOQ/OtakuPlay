import { NextFunction, Response } from 'express';
import {
  Bookmark,
  Comment,
  Follow,
  Like,
  Post,
  Report,
  User,
} from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  awardXp,
  canAwardPostXpToday,
  checkAndUnlockAchievement,
  XP_REWARDS,
} from '../services/gamification.service';
import { createNotification } from '../services/notification.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { getPagination, sendSuccess } from '../utils/response';

function extractHashtags(caption: string, explicitTags?: string[]): string[] {
  const fromCaption = Array.from(caption.matchAll(/#([a-zA-Z0-9_]+)/g)).map((m) =>
    m[1].toLowerCase()
  );
  const combined = new Set([...(explicitTags || []).map((t) => t.toLowerCase()), ...fromCaption]);
  return Array.from(combined).slice(0, 15);
}

export async function getPosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, 30);
    const feed = String(req.query.feed || 'explore');
    const hashtag = String(req.query.hashtag || '').trim().toLowerCase();
    const authorId = String(req.query.authorId || '').trim();
    const q = String(req.query.q || '').trim();

    const filter: Record<string, unknown> = {
      isDeleted: false,
      moderationStatus: 'active',
    };

    if (req.user) {
      const me = await User.findById(req.user.id).select('blockedUsers mutedUsers').lean();
      const excluded = [...(me?.blockedUsers || []), ...(me?.mutedUsers || [])];
      if (excluded.length > 0 && !authorId) {
        filter.authorId = { $nin: excluded };
      }
    }

    if (feed === 'following' && req.user) {
      const followingDocs = await Follow.find({ followerId: req.user.id }).select('followingId').lean();
      const followingIds = followingDocs.map((f) => f.followingId);
      followingIds.push(req.user.id as unknown as typeof followingIds[number]);
      filter.authorId = { $in: followingIds };
    }

    if (hashtag) filter.hashtags = hashtag;
    if (authorId) filter.authorId = authorId;
    if (q) filter.caption = { $regex: q, $options: 'i' };

    const sortOption: Record<string, 1 | -1> =
      feed === 'trending'
        ? { likesCount: -1, commentsCount: -1, createdAt: -1 }
        : { createdAt: -1 };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('authorId', 'username displayName avatarUrl isVerified level levelTitle')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    let likedIds = new Set<string>();
    let bookmarkedIds = new Set<string>();
    if (req.user && posts.length > 0) {
      const postIds = posts.map((p) => p._id);
      const [likes, bookmarks] = await Promise.all([
        Like.find({
          userId: req.user.id,
          targetType: 'post',
          targetId: { $in: postIds },
        })
          .select('targetId')
          .lean(),
        Bookmark.find({
          userId: req.user.id,
          postId: { $in: postIds },
        })
          .select('postId')
          .lean(),
      ]);
      likedIds = new Set(likes.map((l) => String(l.targetId)));
      bookmarkedIds = new Set(bookmarks.map((b) => String(b.postId)));
    }

    const enriched = posts.map((post) => ({
      ...post,
      isLiked: likedIds.has(String(post._id)),
      isBookmarked: bookmarkedIds.has(String(post._id)),
    }));

    return sendSuccess(res, enriched, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { caption, mediaUrl, mediaType, thumbnailUrl, hashtags, animeReference } = req.body;
    const extractedTags = extractHashtags(caption, hashtags);

    const post = await Post.create({
      authorId: req.user!.id,
      caption,
      mediaUrl,
      mediaType: mediaUrl ? mediaType || 'image' : 'none',
      thumbnailUrl,
      hashtags: extractedTags,
      animeReference,
    });

    const isQualityPost = caption.trim().length >= 15 || Boolean(mediaUrl);
    if (isQualityPost && (await canAwardPostXpToday(req.user!.id))) {
      await awardXp(req.user!.id, XP_REWARDS.QUALITY_POST, 'Postingan Komunitas');
      await checkAndUnlockAchievement(req.user!.id, 'FIRST_POST');
    }

    const populated = await Post.findById(post._id)
      .populate('authorId', 'username displayName avatarUrl isVerified level levelTitle')
      .lean();

    return sendSuccess(res, populated, 201, 'Postingan berhasil diterbitkan');
  } catch (err) {
    return next(err);
  }
}

export async function getPostById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false })
      .populate('authorId', 'username displayName avatarUrl isVerified level levelTitle')
      .lean();
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');

    let isLiked = false;
    let isBookmarked = false;
    if (req.user) {
      const [like, bm] = await Promise.all([
        Like.exists({ userId: req.user.id, targetType: 'post', targetId: post._id }),
        Bookmark.exists({ userId: req.user.id, postId: post._id }),
      ]);
      isLiked = Boolean(like);
      isBookmarked = Boolean(bm);
    }

    return sendSuccess(res, { ...post, isLiked, isBookmarked });
  } catch (err) {
    return next(err);
  }
}

export async function deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');

    const isModerator = ['moderator', 'admin', 'super_admin'].includes(req.user!.role);
    if (String(post.authorId) !== req.user!.id && !isModerator) {
      throw new ForbiddenError('Anda tidak berhak menghapus postingan ini');
    }

    post.isDeleted = true;
    await post.save();

    return sendSuccess(res, { deleted: true }, 200, 'Postingan dihapus');
  } catch (err) {
    return next(err);
  }
}

export async function togglePostLike(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');

    const existing = await Like.findOne({
      userId: req.user!.id,
      targetType: 'post',
      targetId: post._id,
    });

    if (existing) {
      await existing.deleteOne();
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();
      return sendSuccess(res, { liked: false, likesCount: post.likesCount });
    }

    await Like.create({
      userId: req.user!.id,
      targetType: 'post',
      targetId: post._id,
    });
    post.likesCount += 1;
    await post.save();

    await createNotification({
      userId: post.authorId,
      actorId: req.user!.id,
      type: 'new_like',
      title: 'Suka Baru',
      body: `@${req.user!.username} menyukai postingan kamu.`,
      data: { postId: String(post._id) },
    });

    return sendSuccess(res, { liked: true, likesCount: post.likesCount });
  } catch (err) {
    return next(err);
  }
}

export async function togglePostBookmark(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');

    const existing = await Bookmark.findOne({ userId: req.user!.id, postId: post._id });
    if (existing) {
      await existing.deleteOne();
      post.bookmarksCount = Math.max(0, post.bookmarksCount - 1);
      await post.save();
      return sendSuccess(res, { bookmarked: false, bookmarksCount: post.bookmarksCount });
    }

    await Bookmark.create({ userId: req.user!.id, postId: post._id });
    post.bookmarksCount += 1;
    await post.save();
    return sendSuccess(res, { bookmarked: true, bookmarksCount: post.bookmarksCount });
  } catch (err) {
    return next(err);
  }
}

export async function sharePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');
    return sendSuccess(res, { sharesCount: post.sharesCount });
  } catch (err) {
    return next(err);
  }
}

export async function getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, 50);
    const [comments, total] = await Promise.all([
      Comment.find({ postId: req.params.id, isDeleted: false })
        .populate('authorId', 'username displayName avatarUrl isVerified level')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ postId: req.params.id, isDeleted: false }),
    ]);

    return sendSuccess(res, comments, 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function createComment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) throw new NotFoundError('Postingan tidak ditemukan');

    const { content, parentId } = req.body;
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findOne({ _id: parentId, postId: post._id, isDeleted: false });
      if (!parentComment) throw new NotFoundError('Komentar induk tidak ditemukan');
    }

    const comment = await Comment.create({
      postId: post._id,
      authorId: req.user!.id,
      parentId: parentId || null,
      content,
    });

    post.commentsCount += 1;
    await post.save();

    if (parentComment) {
      await createNotification({
        userId: parentComment.authorId,
        actorId: req.user!.id,
        type: 'new_reply',
        title: 'Balasan Komentar',
        body: `@${req.user!.username} membalas komentar kamu.`,
        data: { postId: String(post._id), commentId: String(comment._id) },
      });
    } else {
      await createNotification({
        userId: post.authorId,
        actorId: req.user!.id,
        type: 'new_comment',
        title: 'Komentar Baru',
        body: `@${req.user!.username} mengomentari postingan kamu.`,
        data: { postId: String(post._id), commentId: String(comment._id) },
      });
    }

    const populated = await Comment.findById(comment._id)
      .populate('authorId', 'username displayName avatarUrl isVerified level')
      .lean();

    return sendSuccess(res, populated, 201, 'Komentar ditambahkan');
  } catch (err) {
    return next(err);
  }
}

export async function createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const report = await Report.create({
      reporterId: req.user!.id,
      targetType,
      targetId,
      reason,
      details,
    });
    return sendSuccess(res, report, 201, 'Laporan telah dikirim untuk ditinjau moderator');
  } catch (err) {
    return next(err);
  }
}

export async function handleMediaUpload(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      throw new BadRequestError('File media diperlukan');
    }
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    const url = `/uploads/${req.file.filename}`;
    return sendSuccess(res, {
      url,
      mediaType,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 201);
  } catch (err) {
    return next(err);
  }
}

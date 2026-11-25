import { NextFunction, Response } from 'express';
import { Types } from 'mongoose';
import { Conversation, Follow, Message, User } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { createNotification } from '../services/notification.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { getPagination, sendSuccess } from '../utils/response';

let chatEmitter: ((room: string, event: string, payload: unknown) => void) | null = null;

export function registerChatEmitter(
  emitter: (room: string, event: string, payload: unknown) => void
) {
  chatEmitter = emitter;
}

export async function getConversations(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const q = String(req.query.q || '').trim().toLowerCase();

    const conversations = await Conversation.find({ participants: userId })
      .populate(
        'participants',
        'username displayName avatarUrl isVerified isOnline lastSeen privacySettings'
      )
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .limit(50)
      .lean();

    const convIds = conversations.map((c) => c._id);
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: convIds },
          isDeleted: false,
          senderId: { $ne: new Types.ObjectId(userId) },
          'readBy.userId': { $ne: new Types.ObjectId(userId) },
        },
      },
      { $group: { _id: '$conversationId', count: { $sum: 1 } } },
    ]);

    const unreadMap = new Map<string, number>();
    for (const row of unreadAgg) {
      unreadMap.set(String(row._id), row.count);
    }

    const sanitized = conversations
      .map((conv) => {
        const safeParticipants = (conv.participants as unknown as Array<Record<string, unknown>>).map(
          (p) => {
            const privacy = (p.privacySettings as Record<string, unknown>) || {};
            const showOnline = privacy.showOnlineStatus !== false;
            return {
              _id: p._id,
              username: p.username,
              displayName: p.displayName,
              avatarUrl: p.avatarUrl,
              isVerified: p.isVerified,
              isOnline: showOnline ? p.isOnline : false,
              lastSeen: showOnline ? p.lastSeen : null,
            };
          }
        );

        return {
          ...conv,
          participants: safeParticipants,
          unreadCount: unreadMap.get(String(conv._id)) || 0,
        };
      })
      .filter((conv) => {
        if (!q) return true;
        if (conv.name?.toLowerCase().includes(q)) return true;
        return conv.participants.some(
          (p) =>
            String(p.username || '').toLowerCase().includes(q) ||
            String(p.displayName || '').toLowerCase().includes(q)
        );
      });

    return sendSuccess(res, sanitized);
  } catch (err) {
    return next(err);
  }
}

export async function createConversation(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { type, recipientId, name, description, avatarUrl, participantIds } = req.body;

    if (type === 'private') {
      if (!recipientId || recipientId === userId) {
        throw new BadRequestError('Penerima percakapan pribadi tidak valid');
      }

      const [me, recipient] = await Promise.all([
        User.findById(userId).select('blockedUsers'),
        User.findById(recipientId).select('blockedUsers privacySettings deletedAt status'),
      ]);

      if (!recipient || recipient.deletedAt || recipient.status === 'banned') {
        throw new NotFoundError('Pengguna penerima tidak ditemukan');
      }
      if (
        recipient.blockedUsers.some((id) => String(id) === userId) ||
        me?.blockedUsers.some((id) => String(id) === recipientId)
      ) {
        throw new ForbiddenError('Tidak dapat mengirim pesan karena pengguna diblokir');
      }
      if (recipient.privacySettings?.allowPrivateMessages === 'nobody') {
        throw new ForbiddenError('Pengguna ini menonaktifkan pesan pribadi');
      }
      if (recipient.privacySettings?.allowPrivateMessages === 'followers') {
        const follows = await Follow.exists({ followerId: userId, followingId: recipientId });
        if (!follows) {
          throw new ForbiddenError('Pengguna ini hanya menerima pesan dari pengikutnya');
        }
      }

      const sorted = [userId, recipientId].sort();
      const directKey = `${sorted[0]}:${sorted[1]}`;

      let conv = await Conversation.findOne({ directKey })
        .populate('participants', 'username displayName avatarUrl isVerified isOnline lastSeen');

      if (!conv) {
        conv = await Conversation.create({
          type: 'private',
          participants: sorted,
          admins: [],
          createdBy: userId,
          directKey,
        });
        conv = await Conversation.findById(conv._id)
          .populate('participants', 'username displayName avatarUrl isVerified isOnline lastSeen');
      }

      return sendSuccess(res, conv, 201);
    }

    // Group conversation
    if (!name) {
      throw new BadRequestError('Nama grup wajib diisi');
    }
    const members = Array.from(new Set([userId, ...(participantIds || [])]));
    const conv = await Conversation.create({
      type: 'group',
      name,
      description,
      avatarUrl,
      participants: members,
      admins: [userId],
      createdBy: userId,
    });

    for (const memberId of members) {
      if (memberId !== userId) {
        await createNotification({
          userId: memberId,
          actorId: userId,
          type: 'group_invitation',
          title: 'Undangan Grup Baru',
          body: `Kamu ditambahkan ke grup "${name}".`,
          data: { conversationId: String(conv._id) },
        });
      }
    }

    const populated = await Conversation.findById(conv._id)
      .populate('participants', 'username displayName avatarUrl isVerified isOnline lastSeen')
      .lean();

    return sendSuccess(res, populated, 201, 'Grup berhasil dibuat');
  } catch (err) {
    return next(err);
  }
}

export async function getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) throw new NotFoundError('Percakapan tidak ditemukan');
    if (!conv.participants.some((id) => String(id) === req.user!.id)) {
      throw new ForbiddenError('Anda bukan anggota percakapan ini');
    }

    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, 50);
    const [messages, total] = await Promise.all([
      Message.find({ conversationId: conv._id, isDeleted: false })
        .populate('senderId', 'username displayName avatarUrl isVerified')
        .populate({
          path: 'replyToId',
          select: 'content senderId attachmentType',
          populate: { path: 'senderId', select: 'username displayName' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversationId: conv._id, isDeleted: false }),
    ]);

    return sendSuccess(res, messages.reverse(), 200, undefined, { page, limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) throw new NotFoundError('Percakapan tidak ditemukan');
    if (!conv.participants.some((id) => String(id) === req.user!.id)) {
      throw new ForbiddenError('Anda bukan anggota percakapan ini');
    }

    const { content, attachmentUrl, attachmentType, replyToId } = req.body;
    if (!content?.trim() && !attachmentUrl) {
      throw new BadRequestError('Pesan atau lampiran tidak boleh kosong');
    }

    if (conv.type === 'private') {
      const otherId = conv.participants.find((p) => String(p) !== req.user!.id);
      if (otherId) {
        const [me, other] = await Promise.all([
          User.findById(req.user!.id).select('blockedUsers'),
          User.findById(otherId).select('blockedUsers'),
        ]);
        if (
          me?.blockedUsers.some((id) => String(id) === String(otherId)) ||
          other?.blockedUsers.some((id) => String(id) === req.user!.id)
        ) {
          throw new ForbiddenError('Pengiriman pesan diblokir');
        }
      }
    }

    const msg = await Message.create({
      conversationId: conv._id,
      senderId: req.user!.id,
      content: content?.trim() || '',
      attachmentUrl,
      attachmentType: attachmentUrl ? attachmentType || 'image' : 'none',
      replyToId: replyToId || null,
      readBy: [{ userId: new Types.ObjectId(req.user!.id), readAt: new Date() }],
    });

    conv.lastMessageId = msg._id;
    conv.lastMessageText = msg.content || '[Gambar]';
    conv.lastMessageAt = new Date();
    await conv.save();

    const populated = await Message.findById(msg._id)
      .populate('senderId', 'username displayName avatarUrl isVerified')
      .populate({
        path: 'replyToId',
        select: 'content senderId attachmentType',
        populate: { path: 'senderId', select: 'username displayName' },
      })
      .lean();

    if (chatEmitter) {
      chatEmitter(`conv:${conv._id}`, 'chat:new_message', populated);
    }

    for (const participantId of conv.participants) {
      if (String(participantId) !== req.user!.id) {
        await createNotification({
          userId: participantId,
          actorId: req.user!.id,
          type: 'new_message',
          title: conv.type === 'group' ? conv.name || 'Grup Chat' : `@${req.user!.username}`,
          body: msg.content || 'Mengirim lampiran gambar',
          data: { conversationId: String(conv._id), messageId: String(msg._id) },
        });
      }
    }

    return sendSuccess(res, populated, 201);
  } catch (err) {
    return next(err);
  }
}

export async function deleteOwnMessage(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg || msg.isDeleted) throw new NotFoundError('Pesan tidak ditemukan');
    if (String(msg.senderId) !== req.user!.id) {
      throw new ForbiddenError('Anda hanya dapat menghapus pesan Anda sendiri');
    }

    msg.isDeleted = true;
    msg.deletedAt = new Date();
    msg.content = '';
    msg.attachmentUrl = undefined;
    await msg.save();

    if (chatEmitter) {
      chatEmitter(`conv:${msg.conversationId}`, 'chat:message_deleted', {
        conversationId: String(msg.conversationId),
        messageId: String(msg._id),
      });
    }

    return sendSuccess(res, { deleted: true });
  } catch (err) {
    return next(err);
  }
}

export async function markConversationRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) throw new NotFoundError('Percakapan tidak ditemukan');
    if (!conv.participants.some((id) => String(id) === req.user!.id)) {
      throw new ForbiddenError('Anda bukan anggota percakapan ini');
    }

    const now = new Date();
    await Message.updateMany(
      {
        conversationId: conv._id,
        'readBy.userId': { $ne: new Types.ObjectId(req.user!.id) },
      },
      {
        $push: { readBy: { userId: new Types.ObjectId(req.user!.id), readAt: now } },
      }
    );

    if (chatEmitter) {
      chatEmitter(`conv:${conv._id}`, 'chat:read_receipt', {
        conversationId: String(conv._id),
        userId: req.user!.id,
        readAt: now,
      });
    }

    return sendSuccess(res, { read: true, readAt: now });
  } catch (err) {
    return next(err);
  }
}

export async function updateGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || conv.type !== 'group') throw new NotFoundError('Grup tidak ditemukan');
    if (!conv.admins.some((id) => String(id) === req.user!.id)) {
      throw new ForbiddenError('Hanya admin grup yang dapat mengubah info grup');
    }

    const { name, description, avatarUrl } = req.body;
    if (name !== undefined) conv.name = name;
    if (description !== undefined) conv.description = description;
    if (avatarUrl !== undefined) conv.avatarUrl = avatarUrl;
    await conv.save();

    return sendSuccess(res, conv);
  } catch (err) {
    return next(err);
  }
}

export async function addGroupMember(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || conv.type !== 'group') throw new NotFoundError('Grup tidak ditemukan');
    if (!conv.admins.some((id) => String(id) === req.user!.id)) {
      throw new ForbiddenError('Hanya admin grup yang dapat menambah anggota');
    }

    const { userId } = req.body;
    if (!userId) throw new BadRequestError('userId diperlukan');
    await Conversation.findByIdAndUpdate(conv._id, {
      $addToSet: { participants: userId },
    });

    await createNotification({
      userId,
      actorId: req.user!.id,
      type: 'group_invitation',
      title: 'Ditambahkan ke Grup',
      body: `Kamu ditambahkan ke grup "${conv.name}".`,
      data: { conversationId: String(conv._id) },
    });

    return sendSuccess(res, { added: true });
  } catch (err) {
    return next(err);
  }
}

export async function removeGroupMember(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || conv.type !== 'group') throw new NotFoundError('Grup tidak ditemukan');
    if (!conv.admins.some((id) => String(id) === req.user!.id)) {
      throw new ForbiddenError('Hanya admin grup yang dapat mengeluarkan anggota');
    }

    const targetId = req.params.userId;
    await Conversation.findByIdAndUpdate(conv._id, {
      $pull: { participants: targetId, admins: targetId },
    });

    return sendSuccess(res, { removed: true });
  } catch (err) {
    return next(err);
  }
}

export async function leaveGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || conv.type !== 'group') throw new NotFoundError('Grup tidak ditemukan');

    await Conversation.findByIdAndUpdate(conv._id, {
      $pull: { participants: req.user!.id, admins: req.user!.id },
    });

    return sendSuccess(res, { left: true });
  } catch (err) {
    return next(err);
  }
}

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { Conversation, Message, User } from '../models';
import { verifyAccessToken } from '../services/token.service';
import { registerChatEmitter } from '../controllers/chat.controller';
import { registerNotificationEmitter } from '../services/notification.service';

interface AuthedSocket extends Socket {
  data: {
    userId: string;
    username: string;
  };
}

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOriginList.length > 0 ? env.corsOriginList : '*',
      credentials: true,
    },
    pingTimeout: 25000,
    pingInterval: 20000,
  });

  registerChatEmitter((room, event, payload) => {
    io.to(room).emit(event, payload);
  });

  registerNotificationEmitter((userId, event, payload) => {
    io.to(`user:${userId}`).emit(event, payload);
  });

  // Authentication middleware on handshake
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.headers.authorization?.replace('Bearer ', '') ?? '');

      if (!token) {
        return next(new Error('Token autentikasi socket diperlukan'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub).select('username status deletedAt');
      if (!user || user.deletedAt || user.status === 'banned') {
        return next(new Error('Pengguna tidak diizinkan'));
      }

      socket.data.userId = String(user._id);
      socket.data.username = user.username;
      return next();
    } catch {
      return next(new Error('Autentikasi socket gagal'));
    }
  });

  io.on('connection', async (rawSocket) => {
    const socket = rawSocket as AuthedSocket;
    const userId = socket.data.userId;

    socket.join(`user:${userId}`);

    // Mark user online and join all existing conversation rooms
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { isOnline: true, lastSeen: new Date() } },
      { new: true }
    ).select('privacySettings');

    const conversations = await Conversation.find({ participants: userId }).select('_id').lean();
    for (const conv of conversations) {
      socket.join(`conv:${conv._id}`);
    }

    if (user?.privacySettings?.showOnlineStatus !== false) {
      socket.broadcast.emit('user:presence', {
        userId,
        isOnline: true,
        lastSeen: new Date(),
      });
    }

    // Per-socket simple sliding window rate limiter
    const messageTimestamps: number[] = [];
    const checkRateLimit = () => {
      const now = Date.now();
      while (messageTimestamps.length > 0 && now - messageTimestamps[0] > 10000) {
        messageTimestamps.shift();
      }
      if (messageTimestamps.length >= 20) return false;
      messageTimestamps.push(now);
      return true;
    };

    socket.on('chat:join', async (conversationId: string) => {
      const conv = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select('_id');
      if (conv) {
        socket.join(`conv:${conv._id}`);
      }
    });

    socket.on('chat:typing:start', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        username: socket.data.username,
        isTyping: true,
      });
    });

    socket.on('chat:typing:stop', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        username: socket.data.username,
        isTyping: false,
      });
    });

    socket.on(
      'chat:send',
      async (
        payload: {
          conversationId: string;
          content?: string;
          attachmentUrl?: string;
          attachmentType?: 'none' | 'image';
          replyToId?: string;
        },
        ack?: (res: Record<string, unknown>) => void
      ) => {
        try {
          if (!checkRateLimit()) {
            ack?.({ success: false, message: 'Terlalu cepat mengirim pesan' });
            return;
          }

          const conv = await Conversation.findById(payload.conversationId);
          if (!conv || !conv.participants.some((p) => String(p) === userId)) {
            ack?.({ success: false, message: 'Akses percakapan ditolak' });
            return;
          }

          const content = (payload.content || '').trim();
          if (!content && !payload.attachmentUrl) {
            ack?.({ success: false, message: 'Pesan kosong' });
            return;
          }

          const msg = await Message.create({
            conversationId: conv._id,
            senderId: userId,
            content: content.slice(0, 4000),
            attachmentUrl: payload.attachmentUrl,
            attachmentType: payload.attachmentUrl ? payload.attachmentType || 'image' : 'none',
            replyToId: payload.replyToId || null,
            readBy: [{ userId: new Types.ObjectId(userId), readAt: new Date() }],
          });

          conv.lastMessageId = msg._id;
          conv.lastMessageText = msg.content || '[Gambar]';
          conv.lastMessageAt = new Date();
          await conv.save();

          const populated = await Message.findById(msg._id)
            .populate('senderId', 'username displayName avatarUrl isVerified')
            .lean();

          io.to(`conv:${conv._id}`).emit('chat:new_message', populated);
          ack?.({ success: true, data: populated });
        } catch (err) {
          logger.error({ err }, 'Socket chat:send error');
          ack?.({ success: false, message: 'Gagal mengirim pesan' });
        }
      }
    );

    socket.on('chat:read', async (conversationId: string) => {
      try {
        const conv = await Conversation.findOne({ _id: conversationId, participants: userId });
        if (!conv) return;
        const now = new Date();
        await Message.updateMany(
          {
            conversationId: conv._id,
            'readBy.userId': { $ne: new Types.ObjectId(userId) },
          },
          { $push: { readBy: { userId: new Types.ObjectId(userId), readAt: now } } }
        );
        io.to(`conv:${conv._id}`).emit('chat:read_receipt', {
          conversationId,
          userId,
          readAt: now,
        });
      } catch (err) {
        logger.error({ err }, 'Socket chat:read error');
      }
    });

    socket.on('disconnect', async () => {
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { $set: { isOnline: false, lastSeen } });
      if (user?.privacySettings?.showOnlineStatus !== false) {
        socket.broadcast.emit('user:presence', {
          userId,
          isOnline: false,
          lastSeen,
        });
      }
    });
  });

  return io;
}

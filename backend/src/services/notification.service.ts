import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models';
import { logger } from '../config/logger';

let ioEmitter: ((userId: string, event: string, payload: unknown) => void) | null = null;

export function registerNotificationEmitter(
  emitter: (userId: string, event: string, payload: unknown) => void
) {
  ioEmitter = emitter;
}

export async function createNotification(params: {
  userId: Types.ObjectId | string;
  actorId?: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  try {
    if (params.actorId && String(params.userId) === String(params.actorId)) {
      return null;
    }

    const notification = await Notification.create({
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    });

    if (ioEmitter) {
      ioEmitter(String(params.userId), 'notification:new', notification);
    }

    return notification;
  } catch (err) {
    logger.error({ err }, 'Failed to create notification');
    return null;
  }
}

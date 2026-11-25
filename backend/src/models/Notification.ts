import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'new_follower'
  | 'new_like'
  | 'new_comment'
  | 'new_reply'
  | 'new_message'
  | 'group_invitation'
  | 'verification_result'
  | 'level_up'
  | 'badge_unlocked'
  | 'admin_announcement';

export interface INotification extends Document {
  userId: Types.ObjectId;
  actorId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'new_follower',
        'new_like',
        'new_comment',
        'new_reply',
        'new_message',
        'group_invitation',
        'verification_result',
        'level_up',
        'badge_unlocked',
        'admin_announcement',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, required: true, maxlength: 500 },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

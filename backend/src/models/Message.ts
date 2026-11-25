import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  attachmentUrl?: string;
  attachmentType: 'none' | 'image';
  replyToId?: Types.ObjectId;
  readBy: Array<{ userId: Types.ObjectId; readAt: Date }>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, default: '', trim: true, maxlength: 4000 },
    attachmentUrl: { type: String },
    attachmentType: { type: String, enum: ['none', 'image'], default: 'none' },
    replyToId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);

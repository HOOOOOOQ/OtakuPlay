import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IConversation extends Document {
  type: 'private' | 'group';
  name?: string;
  description?: string;
  avatarUrl?: string;
  participants: Types.ObjectId[];
  admins: Types.ObjectId[];
  createdBy: Types.ObjectId;
  directKey?: string;
  lastMessageId?: Types.ObjectId;
  lastMessageText?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ['private', 'group'], required: true },
    name: { type: String, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300 },
    avatarUrl: { type: String },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    directKey: { type: String, unique: true, sparse: true },
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageText: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

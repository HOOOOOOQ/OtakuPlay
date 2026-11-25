import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  deviceName: string;
  platform: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceName: { type: String, default: 'Unknown Device' },
    platform: { type: String, default: 'android' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, isActive: 1 });

export const Session = mongoose.model<ISession>('Session', sessionSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IVerificationRequest extends Document {
  userId: Types.ObjectId;
  fullName: string;
  category: 'creator' | 'community_leader' | 'cosplayer' | 'reviewer' | 'other';
  reason: string;
  portfolioLinks: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const verificationRequestSchema = new Schema<IVerificationRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: String,
      enum: ['creator', 'community_leader', 'cosplayer', 'reviewer', 'other'],
      default: 'creator',
    },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    portfolioLinks: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

verificationRequestSchema.index({ status: 1, createdAt: -1 });

export const VerificationRequest = mongoose.model<IVerificationRequest>(
  'VerificationRequest',
  verificationRequestSchema
);

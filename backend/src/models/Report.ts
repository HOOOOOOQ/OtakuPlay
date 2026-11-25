import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  targetType: 'post' | 'comment' | 'user' | 'message';
  targetId: Types.ObjectId;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolvedBy?: Types.ObjectId;
  resolutionNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['post', 'comment', 'user', 'message'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 200 },
    details: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: { type: String, maxlength: 500 },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, targetType: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);

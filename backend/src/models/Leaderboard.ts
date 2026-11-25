import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILeaderboard extends Document {
  period: 'weekly' | 'monthly' | 'all_time';
  periodKey: string;
  userId: Types.ObjectId;
  xpEarned: number;
  updatedAt: Date;
  createdAt: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    period: { type: String, enum: ['weekly', 'monthly', 'all_time'], required: true },
    periodKey: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    xpEarned: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

leaderboardSchema.index({ period: 1, periodKey: 1, userId: 1 }, { unique: true });
leaderboardSchema.index({ period: 1, periodKey: 1, xpEarned: -1 });

export const Leaderboard = mongoose.model<ILeaderboard>('Leaderboard', leaderboardSchema);

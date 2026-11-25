import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'community' | 'anime' | 'social' | 'milestone';
  xpReward: number;
  threshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, required: true, default: 'award' },
    category: {
      type: String,
      enum: ['community', 'anime', 'social', 'milestone'],
      default: 'milestone',
    },
    xpReward: { type: Number, required: true, min: 0 },
    threshold: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);

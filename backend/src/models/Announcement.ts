import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  kind: 'announcement' | 'banner' | 'featured_anime' | 'news_highlight';
  title: string;
  body: string;
  imageUrl?: string;
  targetUrl?: string;
  priority: number;
  isActive: boolean;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    kind: {
      type: String,
      enum: ['announcement', 'banner', 'featured_anime', 'news_highlight'],
      default: 'announcement',
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 1500 },
    imageUrl: { type: String },
    targetUrl: { type: String },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ kind: 1, isActive: 1, priority: -1, createdAt: -1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);

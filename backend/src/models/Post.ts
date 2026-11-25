import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPost extends Document {
  authorId: Types.ObjectId;
  caption: string;
  mediaUrl?: string;
  mediaType: 'none' | 'image' | 'video';
  thumbnailUrl?: string;
  hashtags: string[];
  animeReference?: {
    title: string;
    url: string;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  bookmarksCount: number;
  isApprovedContribution: boolean;
  moderationStatus: 'active' | 'flagged' | 'removed';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caption: { type: String, required: true, trim: true, maxlength: 2000 },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['none', 'image', 'video'], default: 'none' },
    thumbnailUrl: { type: String },
    hashtags: [{ type: String, lowercase: true, trim: true }],
    animeReference: {
      title: { type: String },
      url: { type: String },
    },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    sharesCount: { type: Number, default: 0, min: 0 },
    bookmarksCount: { type: Number, default: 0, min: 0 },
    isApprovedContribution: { type: Boolean, default: false },
    moderationStatus: {
      type: String,
      enum: ['active', 'flagged', 'removed'],
      default: 'active',
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });
postSchema.index({ likesCount: -1, commentsCount: -1, createdAt: -1 });
postSchema.index({ caption: 'text', hashtags: 'text' });

export const Post = mongoose.model<IPost>('Post', postSchema);

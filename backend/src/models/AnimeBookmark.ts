import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnimeBookmark extends Document {
  userId: Types.ObjectId;
  animeUrl: string;
  title: string;
  image?: string;
  type?: string;
  watchStatus: 'plan_to_watch' | 'watching' | 'completed' | 'dropped';
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const animeBookmarkSchema = new Schema<IAnimeBookmark>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    animeUrl: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String },
    type: { type: String },
    watchStatus: {
      type: String,
      enum: ['plan_to_watch', 'watching', 'completed', 'dropped'],
      default: 'plan_to_watch',
    },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

animeBookmarkSchema.index({ userId: 1, animeUrl: 1 }, { unique: true });
animeBookmarkSchema.index({ userId: 1, isFavorite: 1, updatedAt: -1 });

export const AnimeBookmark = mongoose.model<IAnimeBookmark>('AnimeBookmark', animeBookmarkSchema);

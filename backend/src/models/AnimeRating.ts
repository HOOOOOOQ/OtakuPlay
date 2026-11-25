import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnimeRating extends Document {
  userId: Types.ObjectId;
  animeUrl: string;
  animeTitle: string;
  score: number;
  review?: string;
  xpRewarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const animeRatingSchema = new Schema<IAnimeRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    animeUrl: { type: String, required: true, trim: true },
    animeTitle: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 1, max: 10 },
    review: { type: String, trim: true, maxlength: 2000 },
    xpRewarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

animeRatingSchema.index({ userId: 1, animeUrl: 1 }, { unique: true });
animeRatingSchema.index({ animeUrl: 1, createdAt: -1 });

export const AnimeRating = mongoose.model<IAnimeRating>('AnimeRating', animeRatingSchema);

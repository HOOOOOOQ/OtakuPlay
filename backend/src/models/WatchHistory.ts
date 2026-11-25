import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWatchHistory extends Document {
  userId: Types.ObjectId;
  animeUrl: string;
  animeTitle: string;
  animeImage?: string;
  episodeNumber: string;
  episodeTitle: string;
  episodeUrl: string;
  positionSeconds: number;
  durationSeconds: number;
  completed: boolean;
  watchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const watchHistorySchema = new Schema<IWatchHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    animeUrl: { type: String, required: true, trim: true },
    animeTitle: { type: String, required: true, trim: true },
    animeImage: { type: String },
    episodeNumber: { type: String, required: true },
    episodeTitle: { type: String, required: true },
    episodeUrl: { type: String, required: true },
    positionSeconds: { type: Number, default: 0, min: 0 },
    durationSeconds: { type: Number, default: 0, min: 0 },
    completed: { type: Boolean, default: false },
    watchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

watchHistorySchema.index({ userId: 1, animeUrl: 1, episodeUrl: 1 }, { unique: true });
watchHistorySchema.index({ userId: 1, watchedAt: -1 });

export const WatchHistory = mongoose.model<IWatchHistory>('WatchHistory', watchHistorySchema);

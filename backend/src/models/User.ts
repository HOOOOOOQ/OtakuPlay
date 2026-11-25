import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  pendingEmail?: string;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordHash?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  googleId?: string;
  displayName: string;
  avatarUrl: string;
  coverUrl?: string;
  bio: string;
  role: UserRole;
  status: AccountStatus;
  suspendedUntil?: Date;
  banReason?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  xp: number;
  level: number;
  levelTitle: string;
  dailyLoginDate?: string;
  profileCompletedRewarded: boolean;
  blockedUsers: Types.ObjectId[];
  mutedUsers: Types.ObjectId[];
  privacySettings: {
    showOnlineStatus: boolean;
    allowPrivateMessages: 'everyone' | 'followers' | 'nobody';
    showWatchHistory: boolean;
  };
  isOnline: boolean;
  lastSeen: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    pendingEmail: { type: String, trim: true, lowercase: true },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordHash: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    googleId: { type: String, unique: true, sparse: true },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    avatarUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 300 },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin', 'super_admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    suspendedUntil: { type: Date },
    banReason: { type: String },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    levelTitle: { type: String, default: 'Newbie' },
    dailyLoginDate: { type: String },
    profileCompletedRewarded: { type: Boolean, default: false },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mutedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    privacySettings: {
      showOnlineStatus: { type: Boolean, default: true },
      allowPrivateMessages: {
        type: String,
        enum: ['everyone', 'followers', 'nobody'],
        default: 'everyone',
      },
      showWatchHistory: { type: Boolean, default: true },
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ xp: -1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ displayName: 'text', username: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);

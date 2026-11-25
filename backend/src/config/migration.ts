import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from './database';
import { env } from './env';
import { logger } from './logger';
import { Achievement, User } from '../models';

const DEFAULT_ACHIEVEMENTS = [
  {
    code: 'FIRST_XP',
    name: 'Langkah Pertama',
    description: 'Memperoleh XP pertama di OtakuPlay.',
    icon: 'sparkles',
    category: 'milestone',
    xpReward: 0,
    threshold: 1,
  },
  {
    code: 'PROFILE_COMPLETE',
    name: 'Identitas Otaku',
    description: 'Melengkapi profil OtakuPlay kamu.',
    icon: 'user-check',
    category: 'milestone',
    xpReward: 20,
    threshold: 1,
  },
  {
    code: 'FIRST_POST',
    name: 'Suara Komunitas',
    description: 'Membuat postingan komunitas pertama.',
    icon: 'message-square-plus',
    category: 'community',
    xpReward: 10,
    threshold: 1,
  },
  {
    code: 'ANIME_CRITIC',
    name: 'Kritikus Anime',
    description: 'Menulis ulasan anime pertama kamu.',
    icon: 'star',
    category: 'anime',
    xpReward: 15,
    threshold: 1,
  },
  {
    code: 'LEVEL_5',
    name: 'Otaku Beginner',
    description: 'Mencapai Level 5 di OtakuPlay.',
    icon: 'flame',
    category: 'milestone',
    xpReward: 25,
    threshold: 5,
  },
  {
    code: 'LEVEL_10',
    name: 'Anime Fan Sejati',
    description: 'Mencapai Level 10 di OtakuPlay.',
    icon: 'trophy',
    category: 'milestone',
    xpReward: 50,
    threshold: 10,
  },
  {
    code: 'VERIFIED_OTAKU',
    name: 'Kreator Terverifikasi',
    description: 'Mendapatkan lencana verifikasi biru resmi OtakuPlay.',
    icon: 'badge-check',
    category: 'social',
    xpReward: 50,
    threshold: 1,
  },
];

export async function runMigrations(): Promise<void> {
  for (const item of DEFAULT_ACHIEVEMENTS) {
    await Achievement.findOneAndUpdate(
      { code: item.code },
      { $setOnInsert: item },
      { upsert: true, new: true }
    );
  }

  const existingAdmin = await User.findOne({ email: env.SUPER_ADMIN_EMAIL.toLowerCase() });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12);
    await User.create({
      username: env.SUPER_ADMIN_USERNAME.toLowerCase(),
      email: env.SUPER_ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      displayName: 'OtakuPlay Super Admin',
      role: 'super_admin',
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      level: 50,
      levelTitle: 'Legendary Otaku',
      xp: 30000,
    });
    logger.info({ email: env.SUPER_ADMIN_EMAIL }, 'Bootstrap super_admin created');
  }

  logger.info('Database migrations & seed completed');
}

if (require.main === module) {
  connectDatabase()
    .then(() => runMigrations())
    .then(() => disconnectDatabase())
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Migration failed');
      process.exit(1);
    });
}

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/state_views.dart';
import '../../widgets/verified_badge.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profil')),
        body: EmptyStateView(
          assetPath: 'assets/avatars/default_avatar.png',
          title: 'Belum Masuk Akun',
          subtitle: 'Masuk dengan Google atau email untuk melacak XP, level, badge, dan daftar anime.',
          actionLabel: 'Masuk Sekarang',
          onAction: () => context.go('/login'),
        ),
      );
    }

    final user = auth.user!;
    final ratio = user.levelProgress.progressRatio(user.xp);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Saya', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: () => context.push('/profile/settings'),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.read(authProvider.notifier).refreshProfile(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
                boxShadow: AppColors.subtlePurpleGlow,
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 34,
                        backgroundColor: AppColors.secondarySurface,
                        backgroundImage: user.avatarUrl.isNotEmpty
                            ? CachedNetworkImageProvider(user.avatarUrl)
                            : const AssetImage('assets/avatars/default_avatar.png')
                                as ImageProvider,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    user.displayName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                if (user.isVerified) ...[
                                  const SizedBox(width: 6),
                                  const VerifiedBadge(size: 18),
                                ],
                              ],
                            ),
                            Text(
                              '@${user.username}',
                              style: const TextStyle(fontSize: 12, color: AppColors.secondary),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                gradient: AppColors.violetGlowGradient,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                'Lv ${user.level} · ${user.levelTitle}',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (user.bio.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        user.bio,
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${user.xp} XP',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accent,
                        ),
                      ),
                      Text(
                        'Menuju Lv ${user.level + 1}: ${user.levelProgress.nextLevelXp} XP',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  LinearProgressIndicator(
                    value: ratio,
                    minHeight: 8,
                    backgroundColor: AppColors.secondarySurface,
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _StatPill(label: 'Pengikut', value: '${user.stats.followersCount}'),
                      _StatPill(label: 'Mengikuti', value: '${user.stats.followingCount}'),
                      _StatPill(label: 'Postingan', value: '${user.stats.postsCount}'),
                      _StatPill(label: 'Tontonan', value: '${user.stats.watchCount}'),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => context.push('/profile/edit'),
                      child: const Text('Edit Profil (+20 XP jika lengkap)'),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _MenuTile(
              icon: Icons.leaderboard_rounded,
              title: 'Leaderboard & Peringkat XP',
              subtitle: 'Mingguan, Bulanan, dan Sepanjang Masa',
              onTap: () => context.push('/leaderboard'),
            ),
            _MenuTile(
              icon: Icons.verified_outlined,
              title: 'Verifikasi Centang Biru',
              subtitle: user.isVerified ? 'Akun Terverifikasi' : 'Ajukan permohonan verifikasi',
              onTap: () => context.push('/profile/verification'),
            ),
            _MenuTile(
              icon: Icons.notifications_outlined,
              title: 'Notifikasi',
              subtitle: 'Pengikut, balasan, level up, dan pengumuman',
              onTap: () => context.push('/notifications'),
            ),
            _MenuTile(
              icon: Icons.auto_awesome_rounded,
              title: 'Otaku AI Assistant',
              subtitle: 'Tanya rekomendasi anime & bantuan coding',
              onTap: () => context.push('/tools/ai'),
            ),
            _MenuTile(
              icon: Icons.download_rounded,
              title: 'TikTok Utility Downloader',
              subtitle: 'Unduh video/audio pribadi atau berizin',
              onTap: () => context.push('/tools/tiktok'),
            ),
            _MenuTile(
              icon: Icons.newspaper_rounded,
              title: 'Kompas News',
              subtitle: 'Berita teknologi dan hiburan terbaru',
              onTap: () => context.push('/tools/news'),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Keluar'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;

  const _StatPill({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        tileColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border),
        ),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.secondarySurface,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.accent, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      ),
    );
  }
}

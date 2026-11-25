import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/formatters.dart';
import '../../core/haptics.dart';
import '../../models/anime_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/anime_poster_card.dart';
import '../../widgets/otaku_logo.dart';
import '../../widgets/shimmer_skeleton.dart';
import '../../widgets/state_views.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final homeAsync = ref.watch(homeDataProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.refresh(homeDataProvider.future),
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const OtakuPlayLogo(height: 28),
                          const Spacer(),
                          IconButton(
                            onPressed: () => context.push('/tools/ai'),
                            tooltip: 'Otaku AI',
                            icon: const Icon(Icons.auto_awesome_rounded, color: AppColors.accent),
                          ),
                          IconButton(
                            onPressed: () => context.push('/notifications'),
                            tooltip: 'Notifikasi',
                            icon: const Icon(Icons.notifications_outlined),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '${_greeting()}, ${auth.user?.displayName ?? 'Otaku'} 👋',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Mau nonton anime atau bahas episode terbaru apa hari ini?',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 14),
                      GestureDetector(
                        onTap: () => context.push('/anime/search'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                          decoration: BoxDecoration(
                            color: AppColors.secondarySurface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.search_rounded, color: AppColors.secondary, size: 20),
                              SizedBox(width: 10),
                              Text(
                                'Cari judul anime, genre, atau komunitas...',
                                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _QuickUtilityChip(
                              icon: Icons.auto_awesome_rounded,
                              label: 'Otaku AI',
                              onTap: () => context.push('/tools/ai'),
                            ),
                            const SizedBox(width: 8),
                            _QuickUtilityChip(
                              icon: Icons.newspaper_rounded,
                              label: 'Kompas News',
                              onTap: () => context.push('/tools/news'),
                            ),
                            const SizedBox(width: 8),
                            _QuickUtilityChip(
                              icon: Icons.download_rounded,
                              label: 'TikTok Utility',
                              onTap: () => context.push('/tools/tiktok'),
                            ),
                            const SizedBox(width: 8),
                            _QuickUtilityChip(
                              icon: Icons.leaderboard_rounded,
                              label: 'Leaderboard',
                              onTap: () => context.push('/leaderboard'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              homeAsync.when(
                loading: () => const SliverToBoxAdapter(
                  child: Column(
                    children: [
                      Padding(
                        padding: EdgeInsets.all(16),
                        child: ShimmerBox(width: double.infinity, height: 190, borderRadius: 20),
                      ),
                      AnimeRowSkeleton(),
                      SizedBox(height: 18),
                      AnimeRowSkeleton(),
                    ],
                  ),
                ),
                error: (err, _) => SliverFillRemaining(
                  child: ErrorStateView(
                    message: err.toString(),
                    onRetry: () => ref.invalidate(homeDataProvider),
                  ),
                ),
                data: (data) => SliverList(
                  delegate: SliverChildListDelegate([
                    _HeroCarousel(items: data.popular.take(5).toList()),
                    if (data.history.isNotEmpty) ...[
                      _SectionHeader(title: 'Lanjutkan Menonton', onSeeAll: () {}),
                      SizedBox(
                        height: 112,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: data.history.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, i) {
                            final h = data.history[i];
                            return GestureDetector(
                              onTap: () => context.push(
                                '/watch',
                                extra: {
                                  'animeUrl': h.animeUrl,
                                  'animeTitle': h.animeTitle,
                                  'animeImage': h.animeImage,
                                  'episodeNumber': h.episodeNumber,
                                  'episodeTitle': h.episodeTitle,
                                  'episodeUrl': h.episodeUrl,
                                  'resumeSeconds': h.positionSeconds,
                                },
                              ),
                              child: Container(
                                width: 245,
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: h.animeImage != null
                                          ? CachedNetworkImage(
                                              imageUrl: h.animeImage!,
                                              width: 66,
                                              height: 90,
                                              fit: BoxFit.cover,
                                            )
                                          : Container(
                                              width: 66,
                                              height: 90,
                                              color: AppColors.secondarySurface,
                                              child: const Icon(Icons.play_arrow_rounded),
                                            ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            h.animeTitle,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            h.episodeTitle,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: AppColors.secondary,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          LinearProgressIndicator(
                                            value: h.durationSeconds > 0
                                                ? (h.positionSeconds / h.durationSeconds)
                                                    .clamp(0.05, 1.0)
                                                : 0.25,
                                            backgroundColor: AppColors.secondarySurface,
                                            color: AppColors.primary,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                    _AnimeHorizontalSection(title: 'Trending & Populer', items: data.popular),
                    _AnimeHorizontalSection(
                      title: 'Ongoing & Episode Terbaru',
                      items: data.ongoing,
                    ),
                    _AnimeHorizontalSection(
                      title: 'Rekomendasi & Tamat',
                      items: data.completed,
                    ),
                    if (data.trendingPosts.isNotEmpty) ...[
                      _SectionHeader(
                        title: 'Sorotan Komunitas',
                        onSeeAll: () => context.go('/community'),
                      ),
                      SizedBox(
                        height: 122,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: data.trendingPosts.take(6).length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, i) {
                            final post = data.trendingPosts[i];
                            return Container(
                              width: 240,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '@${post.author.username}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.secondary,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Expanded(
                                    child: Text(
                                      post.caption,
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12, height: 1.35),
                                    ),
                                  ),
                                  Text(
                                    '${post.likesCount} suka · ${post.commentsCount} komentar',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                    if (data.news.isNotEmpty) ...[
                      _SectionHeader(
                        title: 'Berita Tekno & Hiburan (Kompas)',
                        onSeeAll: () => context.push('/tools/news'),
                      ),
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: data.news.take(3).length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final item = data.news[i];
                          return ListTile(
                            tileColor: AppColors.surface,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: const BorderSide(color: AppColors.border),
                            ),
                            onTap: () => context.push('/tools/news/read', extra: item),
                            title: Text(
                              item.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text(
                              '${item.category} · ${item.time}',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                            trailing: const Icon(Icons.chevron_right_rounded),
                          );
                        },
                      ),
                    ],
                    const SizedBox(height: 28),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickUtilityChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickUtilityChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        AppHaptics.light();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: AppColors.accent),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _HeroCarousel extends StatelessWidget {
  final List<AnimeItemModel> items;

  const _HeroCarousel({required this.items});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 196,
      child: PageView.builder(
        controller: PageController(viewportFraction: 0.92),
        itemCount: items.isEmpty ? 1 : items.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Container(
              margin: const EdgeInsets.only(right: 10, top: 8, bottom: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.45)),
                boxShadow: AppColors.subtlePurpleGlow,
              ),
              clipBehavior: Clip.antiAlias,
              child: Image.asset('assets/banners/home_banner_branded.png', fit: BoxFit.cover),
            );
          }

          final anime = items[index - 1];
          return GestureDetector(
            onTap: () => context.push('/anime/detail', extra: anime.link),
            child: Container(
              margin: const EdgeInsets.only(right: 10, top: 8, bottom: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
                color: AppColors.surface,
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (anime.image != null)
                    CachedNetworkImage(imageUrl: anime.image!, fit: BoxFit.cover),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          AppColors.background.withValues(alpha: 0.94),
                          AppColors.background.withValues(alpha: 0.35),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            anime.type ?? 'POPULER',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          anime.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${anime.latestEpisode ?? 'Series'} · Rating ${AppFormatters.formatRating(anime.rating)}',
                          style: const TextStyle(fontSize: 12, color: AppColors.secondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onSeeAll;

  const _SectionHeader({required this.title, required this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          GestureDetector(
            onTap: onSeeAll,
            child: const Text(
              'Lihat Semua',
              style: TextStyle(fontSize: 12, color: AppColors.secondary, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _AnimeHorizontalSection extends StatelessWidget {
  final String title;
  final List<AnimeItemModel> items;

  const _AnimeHorizontalSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: title, onSeeAll: () => context.go('/anime')),
        SizedBox(
          height: 248,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final anime = items[index];
              return AnimePosterCard(
                anime: anime,
                onTap: () => context.push('/anime/detail', extra: anime.link),
              );
            },
          ),
        ),
      ],
    );
  }
}

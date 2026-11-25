import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../config/env.dart';
import '../../core/formatters.dart';
import '../../core/haptics.dart';
import '../../models/community_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/state_views.dart';
import '../../widgets/verified_badge.dart';
import 'comments_sheet.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final Map<String, PostModel> _optimisticPosts = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _resolveMediaUrl(String url) {
    if (url.startsWith('http')) return url;
    return '${AppEnv.socketUrl}$url';
  }

  Future<void> _toggleLike(PostModel post) async {
    AppHaptics.light();
    try {
      final res = await ref.read(communityServiceProvider).toggleLike(post.id);
      setState(() {
        _optimisticPosts[post.id] = post.copyWith(
          isLiked: res.liked,
          likesCount: res.likesCount,
        );
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _toggleBookmark(PostModel post) async {
    AppHaptics.light();
    try {
      final res = await ref.read(communityServiceProvider).toggleBookmark(post.id);
      setState(() {
        _optimisticPosts[post.id] = post.copyWith(
          isBookmarked: res.bookmarked,
          bookmarksCount: res.bookmarksCount,
        );
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Komunitas Otaku', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: () => context.push('/community/create'),
            icon: const Icon(Icons.add_box_outlined, color: AppColors.accent),
            tooltip: 'Buat Postingan',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: const [
            Tab(text: 'Explore'),
            Tab(text: 'Following'),
            Tab(text: 'Trending'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFeedTab('explore'),
          _buildFeedTab('following'),
          _buildFeedTab('trending'),
        ],
      ),
    );
  }

  Widget _buildFeedTab(String feed) {
    final postsAsync = ref.watch(communityFeedProvider(feed));

    return postsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (err, _) => ErrorStateView(
        message: err.toString(),
        onRetry: () => ref.invalidate(communityFeedProvider(feed)),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return EmptyStateView(
            assetPath: 'assets/illustrations/empty_community.png',
            title: 'Belum Ada Postingan',
            subtitle: 'Jadilah yang pertama membagikan momen anime di komunitas!',
            actionLabel: 'Buat Postingan',
            onAction: () => context.push('/community/create'),
          );
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            _optimisticPosts.clear();
            return ref.refresh(communityFeedProvider(feed).future);
          },
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: posts.length,
            separatorBuilder: (_, __) => const SizedBox(height: 14),
            itemBuilder: (context, idx) {
              final raw = posts[idx];
              final post = _optimisticPosts[raw.id] ?? raw;
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 19,
                          backgroundColor: AppColors.secondarySurface,
                          backgroundImage: post.author.avatarUrl.isNotEmpty
                              ? CachedNetworkImageProvider(post.author.avatarUrl)
                              : const AssetImage('assets/avatars/default_avatar.png')
                                  as ImageProvider,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      post.author.displayName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                  if (post.author.isVerified) ...[
                                    const SizedBox(width: 4),
                                    const VerifiedBadge(size: 15),
                                  ],
                                ],
                              ),
                              Text(
                                '@${post.author.username} · Lv ${post.author.level} · ${AppFormatters.timeAgo(post.createdAt)}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        PopupMenuButton<String>(
                          onSelected: (val) async {
                            if (val == 'report') {
                              await ref.read(communityServiceProvider).reportTarget(
                                    targetType: 'post',
                                    targetId: post.id,
                                    reason: 'Konten tidak pantas',
                                  );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Postingan dilaporkan')),
                                );
                              }
                            }
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem(value: 'report', child: Text('Laporkan Postingan')),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(post.caption, style: const TextStyle(fontSize: 14, height: 1.45)),
                    if (post.hashtags.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        children: post.hashtags
                            .map(
                              (tag) => Text(
                                '#$tag',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.secondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                    if (post.mediaUrl != null && post.mediaType == 'image') ...[
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: CachedNetworkImage(
                          imageUrl: _resolveMediaUrl(post.mediaUrl!),
                          width: double.infinity,
                          height: 220,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _PostAction(
                          icon: post.isLiked
                              ? Icons.favorite_rounded
                              : Icons.favorite_border_rounded,
                          color: post.isLiked ? AppColors.error : AppColors.textSecondary,
                          label: '${post.likesCount}',
                          onTap: () => _toggleLike(post),
                        ),
                        const SizedBox(width: 18),
                        _PostAction(
                          icon: Icons.chat_bubble_outline_rounded,
                          color: AppColors.textSecondary,
                          label: '${post.commentsCount}',
                          onTap: () => showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: AppColors.surface,
                            shape: const RoundedRectangleBorder(
                              borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
                            ),
                            builder: (_) => CommentsSheet(postId: post.id),
                          ),
                        ),
                        const SizedBox(width: 18),
                        _PostAction(
                          icon: Icons.share_outlined,
                          color: AppColors.textSecondary,
                          label: '${post.sharesCount}',
                          onTap: () {
                            ref.read(communityServiceProvider).sharePost(post.id);
                            Share.share('${post.caption}\n— @${post.author.username} di OtakuPlay');
                          },
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: () => _toggleBookmark(post),
                          icon: Icon(
                            post.isBookmarked
                                ? Icons.bookmark_rounded
                                : Icons.bookmark_border_rounded,
                            color: post.isBookmarked ? AppColors.accent : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _PostAction extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  const _PostAction({
    required this.icon,
    required this.color,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 5),
          Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

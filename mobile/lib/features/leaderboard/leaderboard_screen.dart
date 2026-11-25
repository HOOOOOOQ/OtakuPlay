import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/state_views.dart';
import '../../widgets/verified_badge.dart';

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard OtakuPlay', style: TextStyle(fontWeight: FontWeight.w800)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Mingguan'),
            Tab(text: 'Bulanan'),
            Tab(text: 'All Time'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildList('weekly'),
          _buildList('monthly'),
          _buildList('all_time'),
        ],
      ),
    );
  }

  Widget _buildList(String period) {
    final asyncData = ref.watch(leaderboardProvider(period));

    return asyncData.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (err, _) => ErrorStateView(
        message: err.toString(),
        onRetry: () => ref.invalidate(leaderboardProvider(period)),
      ),
      data: (entries) {
        if (entries.isEmpty) {
          return const Center(
            child: Text(
              'Belum ada peringkat XP pada periode ini.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: entries.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, idx) {
            final item = entries[idx];
            final top3 = item.rank <= 3;
            return ListTile(
              tileColor: AppColors.surface,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: top3 ? AppColors.primary.withValues(alpha: 0.6) : AppColors.border,
                ),
              ),
              leading: CircleAvatar(
                backgroundColor: top3 ? AppColors.primary : AppColors.secondarySurface,
                child: Text(
                  '#${item.rank}',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
              title: Row(
                children: [
                  Flexible(
                    child: Text(
                      item.displayName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                  ),
                  if (item.isVerified) ...[
                    const SizedBox(width: 4),
                    const VerifiedBadge(size: 14),
                  ],
                ],
              ),
              subtitle: Text(
                '@${item.username} · Lv ${item.level} (${item.levelTitle})',
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
              trailing: Text(
                '${item.xp} XP',
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppColors.accent,
                  fontSize: 14,
                ),
              ),
            );
          },
        );
      },
    );
  }
}

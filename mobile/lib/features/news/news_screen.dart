import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/state_views.dart';

class NewsScreen extends ConsumerWidget {
  const NewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final newsAsync = ref.watch(newsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Berita Kompas Terbaru')),
      body: newsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => ErrorStateView(
          message: err.toString(),
          onRetry: () => ref.invalidate(newsProvider),
        ),
        data: (res) => RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.refresh(newsProvider.future),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: res.items.length + 1,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, idx) {
              if (idx == 0) {
                return Text(
                  res.attribution,
                  style: const TextStyle(fontSize: 12, color: AppColors.secondary),
                );
              }
              final item = res.items[idx - 1];
              return GestureDetector(
                onTap: () => context.push('/tools/news/read', extra: item),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (item.image != null && item.image!.isNotEmpty) ...[
                        ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: CachedNetworkImage(
                            imageUrl: item.image!,
                            height: 165,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              item.category,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppColors.accent,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            item.published.isNotEmpty ? item.published : item.time,
                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item.title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      if (item.description.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          item.description,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                      const SizedBox(height: 8),
                      const Text(
                        'Baca selengkapnya di Kompas →',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.secondary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

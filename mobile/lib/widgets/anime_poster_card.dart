import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../core/formatters.dart';
import '../core/haptics.dart';
import '../models/anime_model.dart';
import '../theme/app_colors.dart';

class AnimePosterCard extends StatelessWidget {
  final AnimeItemModel anime;
  final VoidCallback onTap;
  final double width;

  const AnimePosterCard({
    super.key,
    required this.anime,
    required this.onTap,
    this.width = 142,
  });

  @override
  Widget build(BuildContext context) {
    final hasRating = anime.rating != null && anime.rating!.isNotEmpty;

    return GestureDetector(
      onTap: () {
        AppHaptics.light();
        onTap();
      },
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 0.72,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.border),
                  color: AppColors.secondarySurface,
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (anime.image != null && anime.image!.isNotEmpty)
                      CachedNetworkImage(
                        imageUrl: anime.image!,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(color: AppColors.secondarySurface),
                        errorWidget: (_, __, ___) => const Icon(
                          Icons.movie_outlined,
                          color: AppColors.textSecondary,
                          size: 36,
                        ),
                      )
                    else
                      const Icon(Icons.movie_outlined, color: AppColors.textSecondary, size: 36),
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: Container(
                        height: 54,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              AppColors.background.withValues(alpha: 0.92),
                            ],
                          ),
                        ),
                      ),
                    ),
                    if (anime.type != null)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.background.withValues(alpha: 0.8),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.primary.withValues(alpha: 0.5)),
                          ),
                          child: Text(
                            anime.type!,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.accent,
                            ),
                          ),
                        ),
                      ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.background.withValues(alpha: 0.82),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.star_rounded,
                              size: 12,
                              color: hasRating ? Colors.amber : AppColors.textSecondary,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              hasRating ? anime.rating! : '-',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (anime.latestEpisode != null)
                      Positioned(
                        left: 8,
                        right: 8,
                        bottom: 8,
                        child: Text(
                          anime.latestEpisode!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.secondary,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              anime.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                height: 1.25,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Rating: ${AppFormatters.formatRating(anime.rating)}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

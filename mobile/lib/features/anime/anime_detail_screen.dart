import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/formatters.dart';
import '../../core/haptics.dart';
import '../../models/anime_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/state_views.dart';

class AnimeDetailScreen extends ConsumerStatefulWidget {
  final String animeUrl;

  const AnimeDetailScreen({super.key, required this.animeUrl});

  @override
  ConsumerState<AnimeDetailScreen> createState() => _AnimeDetailScreenState();
}

class _AnimeDetailScreenState extends ConsumerState<AnimeDetailScreen> {
  AnimeDetailsModel? _details;
  bool _loading = true;
  String? _error;
  bool _bookmarked = false;
  bool _favorite = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ref.read(animeRepositoryProvider).getDetails(widget.animeUrl);
      setState(() {
        _details = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _toggleBookmark({bool isFav = false}) async {
    if (_details == null) return;
    AppHaptics.light();
    try {
      await ref.read(animeRepositoryProvider).upsertBookmark(
            animeUrl: _details!.url,
            title: _details!.title,
            image: _details!.image,
            watchStatus: isFav ? null : 'plan_to_watch',
            isFavorite: isFav ? !_favorite : null,
          );
      setState(() {
        if (isFav) {
          _favorite = !_favorite;
        } else {
          _bookmarked = !_bookmarked;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isFav ? 'Favorit diperbarui' : 'Bookmark diperbarui'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  void _openRatingDialog() {
    if (_details == null) return;
    double score = 9;
    final reviewCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            20,
            20,
            MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Beri Rating & Ulasan (+15 XP)',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Skor Kamu', style: TextStyle(color: AppColors.textSecondary)),
                  Text(
                    '${score.toInt()} / 10 ★',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppColors.accent,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              Slider(
                min: 1,
                max: 10,
                divisions: 9,
                value: score,
                activeColor: AppColors.primary,
                onChanged: (v) => setModalState(() => score = v),
              ),
              TextField(
                controller: reviewCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Tulis ulasan singkat minimal 15 karakter untuk bonus XP...',
                ),
              ),
              const SizedBox(height: 14),
              ElevatedButton(
                onPressed: () async {
                  try {
                    await ref.read(animeRepositoryProvider).submitRating(
                          animeUrl: _details!.url,
                          animeTitle: _details!.title,
                          score: score,
                          review: reviewCtrl.text.trim(),
                        );
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ulasan anime berhasil dikirim!')),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context)
                          .showSnackBar(SnackBar(content: Text(e.toString())));
                    }
                  }
                },
                child: const Text('Kirim Ulasan'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: _load)
              : _details == null
                  ? const SizedBox.shrink()
                  : CustomScrollView(
                      slivers: [
                        SliverAppBar(
                          expandedHeight: 270,
                          pinned: true,
                          flexibleSpace: FlexibleSpaceBar(
                            background: Stack(
                              fit: StackFit.expand,
                              children: [
                                if (_details!.image != null)
                                  CachedNetworkImage(
                                    imageUrl: _details!.image!,
                                    fit: BoxFit.cover,
                                  ),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                      colors: [
                                        AppColors.background.withValues(alpha: 0.3),
                                        AppColors.background,
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          actions: [
                            IconButton(
                              onPressed: () => _toggleBookmark(isFav: false),
                              icon: Icon(
                                _bookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                                color: _bookmarked ? AppColors.accent : Colors.white,
                              ),
                            ),
                            IconButton(
                              onPressed: () => _toggleBookmark(isFav: true),
                              icon: Icon(
                                _favorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                color: _favorite ? AppColors.error : Colors.white,
                              ),
                            ),
                            IconButton(
                              onPressed: () =>
                                  Share.share('Tonton ${_details!.title} di OtakuPlay!\n${_details!.url}'),
                              icon: const Icon(Icons.share_rounded),
                            ),
                          ],
                        ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _details!.title,
                                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.star_rounded, color: Colors.amber, size: 18),
                                    const SizedBox(width: 4),
                                    Text(
                                      AppFormatters.formatRating(_details!.rating),
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                    const SizedBox(width: 14),
                                    Text(
                                      'Total Episode: ${_details!.totalEpisodes ?? _details!.episodes.length}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _details!.genres
                                      .map((g) => Chip(label: Text(g)))
                                      .toList(),
                                ),
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: Column(
                                    children: [
                                      _InfoRow(
                                        label: 'Status',
                                        value: _details!.infoField(['status']),
                                      ),
                                      _InfoRow(
                                        label: 'Studio',
                                        value: _details!.infoField(['studio', 'studios']),
                                      ),
                                      _InfoRow(
                                        label: 'Rilis',
                                        value: _details!.infoField(['released', 'rilis', 'aired']),
                                      ),
                                      _InfoRow(
                                        label: 'Durasi',
                                        value: _details!.infoField(['duration', 'durasi']),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    if (_details!.episodes.isNotEmpty)
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: () {
                                            final ep = _details!.episodes.first;
                                            context.push(
                                              '/watch',
                                              extra: {
                                                'animeUrl': _details!.url,
                                                'animeTitle': _details!.title,
                                                'animeImage': _details!.image,
                                                'episodeNumber': ep.episode,
                                                'episodeTitle': ep.title,
                                                'episodeUrl': ep.episodeUrl,
                                                'episodes': _details!.episodes,
                                                'episodeIndex': 0,
                                              },
                                            );
                                          },
                                          icon: const Icon(Icons.play_arrow_rounded),
                                          label: const Text('Tonton Sekarang'),
                                        ),
                                      ),
                                    const SizedBox(width: 10),
                                    OutlinedButton.icon(
                                      onPressed: _openRatingDialog,
                                      icon: const Icon(Icons.rate_review_outlined, size: 18),
                                      label: const Text('Ulas'),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 18),
                                const Text(
                                  'Sinopsis',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _details!.sinopsis,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                    height: 1.55,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  'Daftar Episode (${_details!.episodes.length})',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 10),
                                ListView.separated(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemCount: _details!.episodes.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                                  itemBuilder: (context, idx) {
                                    final ep = _details!.episodes[idx];
                                    return ListTile(
                                      tileColor: AppColors.surface,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                        side: const BorderSide(color: AppColors.border),
                                      ),
                                      leading: CircleAvatar(
                                        backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                                        child: Text(
                                          ep.episode.isNotEmpty ? ep.episode : '${idx + 1}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.accent,
                                          ),
                                        ),
                                      ),
                                      title: Text(
                                        ep.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                      ),
                                      subtitle: ep.date != null
                                          ? Text(
                                              ep.date!,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors.textSecondary,
                                              ),
                                            )
                                          : null,
                                      trailing: const Icon(
                                        Icons.play_circle_fill_rounded,
                                        color: AppColors.primary,
                                      ),
                                      onTap: () => context.push(
                                        '/watch',
                                        extra: {
                                          'animeUrl': _details!.url,
                                          'animeTitle': _details!.title,
                                          'animeImage': _details!.image,
                                          'episodeNumber': ep.episode,
                                          'episodeTitle': ep.title,
                                          'episodeUrl': ep.episodeUrl,
                                          'episodes': _details!.episodes,
                                          'episodeIndex': idx,
                                        },
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

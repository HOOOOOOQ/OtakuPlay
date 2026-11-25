import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/anime_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/anime_poster_card.dart';
import '../../widgets/state_views.dart';

class AnimeSearchScreen extends ConsumerStatefulWidget {
  const AnimeSearchScreen({super.key});

  @override
  ConsumerState<AnimeSearchScreen> createState() => _AnimeSearchScreenState();
}

class _AnimeSearchScreenState extends ConsumerState<AnimeSearchScreen> {
  final _ctrl = TextEditingController();
  List<AnimeItemModel> _results = [];
  bool _loading = false;
  bool _searched = false;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _search(String q) async {
    final trimmed = q.trim();
    if (trimmed.isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
      _searched = true;
    });
    try {
      final res = await ref.read(animeRepositoryProvider).search(trimmed);
      setState(() {
        _results = res.results;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _ctrl,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onSubmitted: _search,
          decoration: InputDecoration(
            hintText: 'Cari anime (mis. Jujutsu Kaisen)...',
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            fillColor: Colors.transparent,
            suffixIcon: IconButton(
              icon: const Icon(Icons.search_rounded, color: AppColors.primary),
              onPressed: () => _search(_ctrl.text),
            ),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? ErrorStateView(message: _error!, onRetry: () => _search(_ctrl.text))
              : !_searched
                  ? const EmptyStateView(
                      assetPath: 'assets/illustrations/empty_anime.png',
                      title: 'Temukan Anime Favoritmu',
                      subtitle: 'Ketik judul anime pada kolom pencarian di atas.',
                    )
                  : _results.isEmpty
                      ? const EmptyStateView(
                          assetPath: 'assets/illustrations/empty_anime.png',
                          title: 'Hasil Tidak Ditemukan',
                          subtitle: 'Coba kata kunci judul yang berbeda.',
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.58,
                            crossAxisSpacing: 14,
                            mainAxisSpacing: 16,
                          ),
                          itemCount: _results.length,
                          itemBuilder: (context, idx) {
                            final item = _results[idx];
                            return AnimePosterCard(
                              width: double.infinity,
                              anime: item,
                              onTap: () => context.push('/anime/detail', extra: item.link),
                            );
                          },
                        ),
    );
  }
}

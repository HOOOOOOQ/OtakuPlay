import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/anime_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/anime_poster_card.dart';
import '../../widgets/shimmer_skeleton.dart';
import '../../widgets/state_views.dart';

class AnimeScreen extends ConsumerStatefulWidget {
  const AnimeScreen({super.key});

  @override
  ConsumerState<AnimeScreen> createState() => _AnimeScreenState();
}

class _AnimeScreenState extends ConsumerState<AnimeScreen> {
  static const _categories = [
    'Popular',
    'Ongoing',
    'Completed',
    'Schedule',
    'Movie',
    'TV',
    'OVA',
    'ONA',
  ];

  String _selectedCategory = 'Popular';
  String _selectedSort = 'Terbaru';
  final List<AnimeItemModel> _items = [];
  List<ScheduleGroupModel> _schedule = [];
  int _page = 1;
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  String? _error;

  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadInitial();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 240 &&
          !_loadingMore &&
          _hasMore &&
          _selectedCategory != 'Schedule') {
        _loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadInitial() async {
    setState(() {
      _loading = true;
      _error = null;
      _page = 1;
      _hasMore = true;
      _items.clear();
      _schedule = [];
    });

    try {
      final repo = ref.read(animeRepositoryProvider);
      if (_selectedCategory == 'Schedule') {
        final groups = await repo.getSchedule();
        setState(() {
          _schedule = groups;
          _loading = false;
        });
        return;
      }

      final fetched = await _fetchForCategory(1);
      setState(() {
        _items.addAll(fetched);
        _hasMore = fetched.isNotEmpty;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    setState(() => _loadingMore = true);
    try {
      final nextPage = _page + 1;
      final fetched = await _fetchForCategory(nextPage);
      setState(() {
        _page = nextPage;
        _items.addAll(fetched);
        _hasMore = fetched.isNotEmpty;
        _loadingMore = false;
      });
    } catch (_) {
      setState(() => _loadingMore = false);
    }
  }

  Future<List<AnimeItemModel>> _fetchForCategory(int page) async {
    final repo = ref.read(animeRepositoryProvider);
    switch (_selectedCategory) {
      case 'Ongoing':
        return repo.getOngoing(page: page);
      case 'Completed':
        return repo.getCompleted(page: page);
      case 'Movie':
      case 'TV':
      case 'OVA':
      case 'ONA':
        final list = await repo.getPopular(page: page);
        final filtered = list
            .where((e) => (e.type ?? '').toUpperCase().contains(_selectedCategory.toUpperCase()))
            .toList();
        return filtered.isNotEmpty ? filtered : list;
      default:
        return repo.getPopular(page: page);
    }
  }

  List<AnimeItemModel> get _sortedItems {
    final list = List<AnimeItemModel>.from(_items);
    if (_selectedSort == 'A-Z') {
      list.sort((a, b) => a.title.compareTo(b.title));
    } else if (_selectedSort == 'Rating') {
      list.sort((a, b) => (double.tryParse(b.rating ?? '') ?? 0)
          .compareTo(double.tryParse(a.rating ?? '') ?? 0));
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final sorted = _sortedItems;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Katalog Anime', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: () => context.push('/anime/search'),
            icon: const Icon(Icons.search_rounded),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort_rounded),
            onSelected: (val) => setState(() => _selectedSort = val),
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'Terbaru', child: Text('Urutkan: Default')),
              PopupMenuItem(value: 'A-Z', child: Text('Urutkan: Judul A-Z')),
              PopupMenuItem(value: 'Rating', child: Text('Urutkan: Rating Tertinggi')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final cat = _categories[idx];
                final selected = cat == _selectedCategory;
                return ChoiceChip(
                  label: Text(cat),
                  selected: selected,
                  onSelected: (_) {
                    setState(() => _selectedCategory = cat);
                    _loadInitial();
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: _loading
                ? GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.62,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 14,
                    ),
                    itemCount: 6,
                    itemBuilder: (_, __) => const ShimmerBox(width: 140, height: 220),
                  )
                : _error != null
                    ? ErrorStateView(message: _error!, onRetry: _loadInitial)
                    : _selectedCategory == 'Schedule'
                        ? _buildScheduleView()
                        : sorted.isEmpty
                            ? EmptyStateView(
                                assetPath: 'assets/illustrations/empty_anime.png',
                                title: 'Anime Tidak Ditemukan',
                                subtitle: 'Coba kategori atau filter lain untuk melihat anime.',
                                actionLabel: 'Muat Ulang',
                                onAction: _loadInitial,
                              )
                            : RefreshIndicator(
                                color: AppColors.primary,
                                onRefresh: _loadInitial,
                                child: GridView.builder(
                                  controller: _scrollController,
                                  padding: const EdgeInsets.all(16),
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    childAspectRatio: 0.58,
                                    crossAxisSpacing: 14,
                                    mainAxisSpacing: 16,
                                  ),
                                  itemCount: sorted.length + (_loadingMore ? 2 : 0),
                                  itemBuilder: (context, idx) {
                                    if (idx >= sorted.length) {
                                      return const ShimmerBox(width: 140, height: 220);
                                    }
                                    final anime = sorted[idx];
                                    return AnimePosterCard(
                                      width: double.infinity,
                                      anime: anime,
                                      onTap: () =>
                                          context.push('/anime/detail', extra: anime.link),
                                    );
                                  },
                                ),
                              ),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleView() {
    if (_schedule.isEmpty) {
      return const EmptyStateView(
        assetPath: 'assets/illustrations/empty_anime.png',
        title: 'Jadwal Belum Tersedia',
        subtitle: 'Jadwal rilis anime akan tampil di sini.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _schedule.length,
      itemBuilder: (context, idx) {
        final group = _schedule[idx];
        return Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                group.day,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 245,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: group.items.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, j) => AnimePosterCard(
                    anime: group.items[j],
                    onTap: () => context.push('/anime/detail', extra: group.items[j].link),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

import '../models/anime_model.dart';
import '../services/anime_api_service.dart';
import '../services/api_client.dart';

class AnimeRepository {
  final AnimeApiService _animeService;
  final ApiClient _api;

  AnimeRepository(this._animeService, this._api);

  Future<({String query, int total, List<AnimeItemModel> results})> search(String query) =>
      _animeService.search(query);

  Future<List<AnimeItemModel>> getPopular({int page = 1}) async {
    final res = await _animeService.fetchCategory('popular', page: page);
    return res.animeList;
  }

  Future<List<AnimeItemModel>> getOngoing({int page = 1}) async {
    final res = await _animeService.fetchCategory('ongoing', page: page);
    return res.animeList;
  }

  Future<List<AnimeItemModel>> getCompleted({int page = 1}) async {
    final res = await _animeService.fetchCategory('completed', page: page);
    return res.animeList;
  }

  Future<List<ScheduleGroupModel>> getSchedule() => _animeService.fetchSchedule();

  Future<AnimeDetailsModel> getDetails(String animeUrl) => _animeService.fetchDetails(animeUrl);

  Future<StreamResolutionModel> getStream(String episodeUrl) =>
      _animeService.fetchStream(episodeUrl);

  Future<List<WatchHistoryModel>> getWatchHistory() {
    return _api.get(
      '/anime/history',
      parser: (data) => (data as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(WatchHistoryModel.fromJson)
          .toList(),
    );
  }

  Future<void> recordWatchProgress({
    required String animeUrl,
    required String animeTitle,
    String? animeImage,
    required String episodeNumber,
    required String episodeTitle,
    required String episodeUrl,
    required int positionSeconds,
    required int durationSeconds,
    bool completed = false,
  }) async {
    await _api.post(
      '/anime/history',
      data: {
        'animeUrl': animeUrl,
        'animeTitle': animeTitle,
        'animeImage': animeImage,
        'episodeNumber': episodeNumber,
        'episodeTitle': episodeTitle,
        'episodeUrl': episodeUrl,
        'positionSeconds': positionSeconds,
        'durationSeconds': durationSeconds,
        'completed': completed,
      },
      parser: (d) => d,
    );
  }

  Future<void> upsertBookmark({
    required String animeUrl,
    required String title,
    String? image,
    String? type,
    String? watchStatus,
    bool? isFavorite,
  }) async {
    await _api.post(
      '/anime/bookmarks',
      data: {
        'animeUrl': animeUrl,
        'title': title,
        'image': image,
        'type': type,
        if (watchStatus != null) 'watchStatus': watchStatus,
        if (isFavorite != null) 'isFavorite': isFavorite,
      },
      parser: (d) => d,
    );
  }

  Future<void> submitRating({
    required String animeUrl,
    required String animeTitle,
    required double score,
    String? review,
  }) async {
    await _api.post(
      '/anime/ratings',
      data: {
        'animeUrl': animeUrl,
        'animeTitle': animeTitle,
        'score': score,
        if (review != null && review.isNotEmpty) 'review': review,
      },
      parser: (d) => d,
    );
  }
}

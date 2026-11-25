import 'package:dio/dio.dart';
import '../core/errors.dart';
import '../models/anime_model.dart';
import 'api_client.dart';

class _CachedItem {
  final dynamic data;
  final DateTime expiresAt;
  _CachedItem(this.data, Duration ttl) : expiresAt = DateTime.now().add(ttl);
  bool get isValid => DateTime.now().isBefore(expiresAt);
}

class AnimeApiService {
  final ApiClient _api;
  final Map<String, _CachedItem> _cache = {};

  AnimeApiService(this._api);

  Future<T> _withCacheAndRetry<T>(
    String cacheKey,
    Duration ttl,
    Future<T> Function() loader,
  ) async {
    final hit = _cache[cacheKey];
    if (hit != null && hit.isValid) {
      return hit.data as T;
    }

    Object? lastError;
    for (int attempt = 0; attempt < 2; attempt++) {
      try {
        final data = await loader();
        _cache[cacheKey] = _CachedItem(data, ttl);
        return data;
      } on AppException catch (e) {
        lastError = e;
        if (e.statusCode != null && e.statusCode! < 500) rethrow;
        await Future<void>.delayed(Duration(milliseconds: 300 * (attempt + 1)));
      } on DioException catch (e) {
        lastError = AppException.fromDio(e);
        await Future<void>.delayed(Duration(milliseconds: 300 * (attempt + 1)));
      }
    }
    throw lastError ?? const AppException('Gagal memuat data anime');
  }

  Future<({String query, int total, List<AnimeItemModel> results})> search(String query) {
    final trimmed = query.trim();
    return _withCacheAndRetry('search:$trimmed', const Duration(minutes: 5), () async {
      return _api.get(
        '/anime/search',
        queryParameters: {'q': trimmed},
        parser: (data) {
          final map = data as Map<String, dynamic>;
          final list = (map['results'] as List? ?? [])
              .whereType<Map<String, dynamic>>()
              .map(AnimeItemModel.fromJson)
              .toList();
          return (
            query: map['query']?.toString() ?? trimmed,
            total: (map['total'] as num?)?.toInt() ?? list.length,
            results: list,
          );
        },
      );
    });
  }

  Future<({int page, int total, List<AnimeItemModel> animeList})> fetchCategory(
    String category, {
    int page = 1,
  }) {
    return _withCacheAndRetry('$category:p$page', const Duration(minutes: 5), () async {
      return _api.get(
        '/anime/$category',
        queryParameters: {'page': page},
        parser: (data) {
          final map = data as Map<String, dynamic>;
          final list = (map['animeList'] as List? ?? [])
              .whereType<Map<String, dynamic>>()
              .map(AnimeItemModel.fromJson)
              .toList();
          return (
            page: (map['page'] as num?)?.toInt() ?? page,
            total: (map['total'] as num?)?.toInt() ?? list.length,
            animeList: list,
          );
        },
      );
    });
  }

  Future<AnimeDetailsModel> fetchDetails(String animeUrl) {
    return _withCacheAndRetry('details:$animeUrl', const Duration(minutes: 10), () async {
      return _api.get(
        '/anime/details',
        queryParameters: {'url': animeUrl},
        parser: (data) => AnimeDetailsModel.fromJson(data as Map<String, dynamic>),
      );
    });
  }

  Future<List<ScheduleGroupModel>> fetchSchedule() {
    return _withCacheAndRetry('schedule', const Duration(minutes: 15), () async {
      return _api.get(
        '/anime/schedule',
        parser: (data) {
          final map = data as Map<String, dynamic>;
          final groups = map['groups'] as List?;
          if (groups != null) {
            return groups.whereType<Map<String, dynamic>>().map((g) {
              final items = (g['items'] as List? ?? [])
                  .whereType<Map<String, dynamic>>()
                  .map(AnimeItemModel.fromJson)
                  .toList();
              return ScheduleGroupModel(day: g['day']?.toString() ?? 'Lainnya', items: items);
            }).toList();
          }

          final rawSchedule = map['schedule'] as Map<String, dynamic>? ?? {};
          return rawSchedule.entries.map((entry) {
            final items = (entry.value as List? ?? [])
                .whereType<Map<String, dynamic>>()
                .map(AnimeItemModel.fromJson)
                .toList();
            return ScheduleGroupModel(day: entry.key, items: items);
          }).toList();
        },
      );
    });
  }

  Future<StreamResolutionModel> fetchStream(String episodeUrl) {
    return _withCacheAndRetry('stream:$episodeUrl', const Duration(minutes: 2), () async {
      return _api.get(
        '/anime/stream',
        queryParameters: {'url': episodeUrl},
        parser: (data) => StreamResolutionModel.fromJson(data as Map<String, dynamic>),
      );
    });
  }
}

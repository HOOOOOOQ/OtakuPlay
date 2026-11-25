import 'package:dio/dio.dart';
import '../models/gamification_model.dart';
import '../models/tools_model.dart';
import 'api_client.dart';

class ToolsService {
  final ApiClient _api;
  ToolsService(this._api);

  Future<List<LeaderboardEntryModel>> getLeaderboard(String period) {
    return _api.get(
      '/leaderboard',
      queryParameters: {'period': period},
      parser: (data) {
        final map = data as Map<String, dynamic>;
        return (map['entries'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(LeaderboardEntryModel.fromJson)
            .toList();
      },
    );
  }

  Future<List<AchievementModel>> getMyAchievements() {
    return _api.get(
      '/users/me/achievements',
      parser: (data) => (data as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(AchievementModel.fromJson)
          .toList(),
    );
  }

  Future<({bool isVerified, String? pendingStatus})> getVerificationStatus() {
    return _api.get(
      '/verification/status',
      parser: (data) {
        final map = data as Map<String, dynamic>;
        final latest = map['latestRequest'] as Map<String, dynamic>?;
        return (
          isVerified: map['isVerified'] as bool? ?? false,
          pendingStatus: latest?['status']?.toString(),
        );
      },
    );
  }

  Future<void> submitVerificationRequest({
    required String fullName,
    required String category,
    required String reason,
    List<String> portfolioLinks = const [],
  }) async {
    await _api.post(
      '/verification/request',
      data: {
        'fullName': fullName,
        'category': category,
        'reason': reason,
        'portfolioLinks': portfolioLinks,
      },
      parser: (d) => d,
    );
  }

  Future<({List<AppNotificationModel> items, int unreadCount})> getNotifications() {
    return _api.get(
      '/notifications',
      parser: (data) {
        final map = data as Map<String, dynamic>;
        final items = (map['items'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(AppNotificationModel.fromJson)
            .toList();
        return (
          items: items,
          unreadCount: (map['unreadCount'] as num?)?.toInt() ?? 0,
        );
      },
    );
  }

  Future<void> markAllNotificationsRead() async {
    await _api.post('/notifications/read-all', parser: (d) => d);
  }

  Future<String> askOtakuAi(String question) {
    return _api.get(
      '/ai/chat',
      queryParameters: {'q': question},
      parser: (data) {
        final map = data as Map<String, dynamic>;
        final inner = map['data'] as Map<String, dynamic>? ?? {};
        return inner['message']?.toString() ?? 'Maaf, Otaku AI belum dapat menjawab.';
      },
    );
  }

  Future<({String attribution, List<KompasNewsModel> items})> getKompasNews() {
    return _api.get(
      '/news',
      parser: (data) {
        final map = data as Map<String, dynamic>;
        final items = (map['data'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(KompasNewsModel.fromJson)
            .toList();
        return (
          attribution: map['attribution']?.toString() ?? 'Sumber: Kompas.com',
          items: items,
        );
      },
    );
  }

  Future<TikTokResolveModel> resolveTikTok(String url) {
    return _api.post(
      '/tools/tiktok/resolve',
      data: {'url': url},
      parser: (data) => TikTokResolveModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> downloadFile(
    String url,
    String savePath, {
    void Function(int received, int total)? onProgress,
  }) async {
    final dio = Dio();
    await dio.download(url, savePath, onReceiveProgress: onProgress);
  }
}

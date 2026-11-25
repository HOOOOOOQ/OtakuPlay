import 'package:dio/dio.dart';
import '../models/community_model.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class CommunityService {
  final ApiClient _api;
  CommunityService(this._api);

  Future<List<PostModel>> getPosts({
    String feed = 'explore',
    String? hashtag,
    int page = 1,
  }) {
    return _api.get(
      '/posts',
      queryParameters: {
        'feed': feed,
        'page': page,
        if (hashtag != null && hashtag.isNotEmpty) 'hashtag': hashtag,
      },
      parser: (data) => (data as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(PostModel.fromJson)
          .toList(),
    );
  }

  Future<PostModel> createPost({
    required String caption,
    String? mediaUrl,
    String mediaType = 'none',
  }) {
    return _api.post(
      '/posts',
      data: {
        'caption': caption,
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
        'mediaType': mediaType,
      },
      parser: (data) => PostModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<({String url, String mediaType})> uploadMedia(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    final res = await _api.dio.post('/uploads/media', data: formData);
    final data = res.data['data'] as Map<String, dynamic>;
    return (
      url: data['url'].toString(),
      mediaType: data['mediaType']?.toString() ?? 'image',
    );
  }

  Future<({bool liked, int likesCount})> toggleLike(String postId) {
    return _api.post(
      '/posts/$postId/like',
      parser: (data) {
        final map = data as Map<String, dynamic>;
        return (
          liked: map['liked'] as bool? ?? false,
          likesCount: (map['likesCount'] as num?)?.toInt() ?? 0,
        );
      },
    );
  }

  Future<({bool bookmarked, int bookmarksCount})> toggleBookmark(String postId) {
    return _api.post(
      '/posts/$postId/bookmark',
      parser: (data) {
        final map = data as Map<String, dynamic>;
        return (
          bookmarked: map['bookmarked'] as bool? ?? false,
          bookmarksCount: (map['bookmarksCount'] as num?)?.toInt() ?? 0,
        );
      },
    );
  }

  Future<void> sharePost(String postId) async {
    await _api.post('/posts/$postId/share', parser: (d) => d);
  }

  Future<List<CommentModel>> getComments(String postId) {
    return _api.get(
      '/posts/$postId/comments',
      parser: (data) => (data as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(CommentModel.fromJson)
          .toList(),
    );
  }

  Future<CommentModel> addComment(String postId, String content, {String? parentId}) {
    return _api.post(
      '/posts/$postId/comments',
      data: {
        'content': content,
        if (parentId != null) 'parentId': parentId,
      },
      parser: (data) => CommentModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<UserModel> getPublicProfile(String username) {
    return _api.get(
      '/users/$username',
      parser: (data) => UserModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> followUser(String userId) async {
    await _api.post('/users/$userId/follow', parser: (d) => d);
  }

  Future<void> unfollowUser(String userId) async {
    await _api.delete('/users/$userId/follow', parser: (d) => d);
  }

  Future<void> reportTarget({
    required String targetType,
    required String targetId,
    required String reason,
    String? details,
  }) async {
    await _api.post(
      '/reports',
      data: {
        'targetType': targetType,
        'targetId': targetId,
        'reason': reason,
        if (details != null) 'details': details,
      },
      parser: (d) => d,
    );
  }
}

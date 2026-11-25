class PostAuthorModel {
  final String id;
  final String username;
  final String displayName;
  final String avatarUrl;
  final bool isVerified;
  final int level;
  final String levelTitle;

  const PostAuthorModel({
    required this.id,
    required this.username,
    required this.displayName,
    this.avatarUrl = '',
    this.isVerified = false,
    this.level = 1,
    this.levelTitle = 'Newbie',
  });

  factory PostAuthorModel.fromJson(dynamic raw) {
    if (raw is! Map<String, dynamic>) {
      return const PostAuthorModel(id: '', username: 'otaku', displayName: 'Otaku');
    }
    return PostAuthorModel(
      id: (raw['_id'] ?? raw['id'] ?? '').toString(),
      username: raw['username']?.toString() ?? 'otaku',
      displayName: raw['displayName']?.toString() ?? 'Otaku',
      avatarUrl: raw['avatarUrl']?.toString() ?? '',
      isVerified: raw['isVerified'] as bool? ?? false,
      level: (raw['level'] as num?)?.toInt() ?? 1,
      levelTitle: raw['levelTitle']?.toString() ?? 'Newbie',
    );
  }
}

class PostModel {
  final String id;
  final PostAuthorModel author;
  final String caption;
  final String? mediaUrl;
  final String mediaType;
  final List<String> hashtags;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final int bookmarksCount;
  final bool isLiked;
  final bool isBookmarked;
  final DateTime? createdAt;

  const PostModel({
    required this.id,
    required this.author,
    required this.caption,
    this.mediaUrl,
    this.mediaType = 'none',
    this.hashtags = const [],
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.bookmarksCount = 0,
    this.isLiked = false,
    this.isBookmarked = false,
    this.createdAt,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    final rawTags = json['hashtags'] as List? ?? [];
    return PostModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      author: PostAuthorModel.fromJson(json['authorId']),
      caption: json['caption']?.toString() ?? '',
      mediaUrl: json['mediaUrl']?.toString(),
      mediaType: json['mediaType']?.toString() ?? 'none',
      hashtags: rawTags.map((e) => e.toString()).toList(),
      likesCount: (json['likesCount'] as num?)?.toInt() ?? 0,
      commentsCount: (json['commentsCount'] as num?)?.toInt() ?? 0,
      sharesCount: (json['sharesCount'] as num?)?.toInt() ?? 0,
      bookmarksCount: (json['bookmarksCount'] as num?)?.toInt() ?? 0,
      isLiked: json['isLiked'] as bool? ?? false,
      isBookmarked: json['isBookmarked'] as bool? ?? false,
      createdAt:
          json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  PostModel copyWith({
    int? likesCount,
    int? commentsCount,
    int? sharesCount,
    int? bookmarksCount,
    bool? isLiked,
    bool? isBookmarked,
  }) {
    return PostModel(
      id: id,
      author: author,
      caption: caption,
      mediaUrl: mediaUrl,
      mediaType: mediaType,
      hashtags: hashtags,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      sharesCount: sharesCount ?? this.sharesCount,
      bookmarksCount: bookmarksCount ?? this.bookmarksCount,
      isLiked: isLiked ?? this.isLiked,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      createdAt: createdAt,
    );
  }
}

class CommentModel {
  final String id;
  final String postId;
  final PostAuthorModel author;
  final String? parentId;
  final String content;
  final DateTime? createdAt;

  const CommentModel({
    required this.id,
    required this.postId,
    required this.author,
    this.parentId,
    required this.content,
    this.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      postId: json['postId']?.toString() ?? '',
      author: PostAuthorModel.fromJson(json['authorId']),
      parentId: json['parentId']?.toString(),
      content: json['content']?.toString() ?? '',
      createdAt:
          json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}

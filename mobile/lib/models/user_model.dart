class UserPrivacySettings {
  final bool showOnlineStatus;
  final String allowPrivateMessages;
  final bool showWatchHistory;

  const UserPrivacySettings({
    this.showOnlineStatus = true,
    this.allowPrivateMessages = 'everyone',
    this.showWatchHistory = true,
  });

  factory UserPrivacySettings.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const UserPrivacySettings();
    return UserPrivacySettings(
      showOnlineStatus: json['showOnlineStatus'] as bool? ?? true,
      allowPrivateMessages: json['allowPrivateMessages']?.toString() ?? 'everyone',
      showWatchHistory: json['showWatchHistory'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'showOnlineStatus': showOnlineStatus,
        'allowPrivateMessages': allowPrivateMessages,
        'showWatchHistory': showWatchHistory,
      };
}

class UserStats {
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final int watchCount;

  const UserStats({
    this.followersCount = 0,
    this.followingCount = 0,
    this.postsCount = 0,
    this.watchCount = 0,
  });

  factory UserStats.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const UserStats();
    return UserStats(
      followersCount: (json['followersCount'] as num?)?.toInt() ?? 0,
      followingCount: (json['followingCount'] as num?)?.toInt() ?? 0,
      postsCount: (json['postsCount'] as num?)?.toInt() ?? 0,
      watchCount: (json['watchCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class LevelProgress {
  final int level;
  final String levelTitle;
  final int currentLevelXp;
  final int nextLevelXp;

  const LevelProgress({
    this.level = 1,
    this.levelTitle = 'Newbie',
    this.currentLevelXp = 0,
    this.nextLevelXp = 32,
  });

  factory LevelProgress.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const LevelProgress();
    return LevelProgress(
      level: (json['level'] as num?)?.toInt() ?? 1,
      levelTitle: json['levelTitle']?.toString() ?? 'Newbie',
      currentLevelXp: (json['currentLevelXp'] as num?)?.toInt() ?? 0,
      nextLevelXp: (json['nextLevelXp'] as num?)?.toInt() ?? 32,
    );
  }

  double progressRatio(int totalXp) {
    final span = (nextLevelXp - currentLevelXp).clamp(1, 1000000);
    return ((totalXp - currentLevelXp) / span).clamp(0.0, 1.0);
  }
}

class UserModel {
  final String id;
  final String username;
  final String email;
  final String displayName;
  final String avatarUrl;
  final String coverUrl;
  final String bio;
  final String role;
  final bool isVerified;
  final int xp;
  final int level;
  final String levelTitle;
  final bool hasPassword;
  final bool isGoogleLinked;
  final bool isFollowing;
  final bool isOnline;
  final DateTime? lastSeen;
  final UserPrivacySettings privacySettings;
  final UserStats stats;
  final LevelProgress levelProgress;

  const UserModel({
    required this.id,
    required this.username,
    this.email = '',
    required this.displayName,
    this.avatarUrl = '',
    this.coverUrl = '',
    this.bio = '',
    this.role = 'user',
    this.isVerified = false,
    this.xp = 0,
    this.level = 1,
    this.levelTitle = 'Newbie',
    this.hasPassword = false,
    this.isGoogleLinked = false,
    this.isFollowing = false,
    this.isOnline = false,
    this.lastSeen,
    this.privacySettings = const UserPrivacySettings(),
    this.stats = const UserStats(),
    this.levelProgress = const LevelProgress(),
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      username: json['username']?.toString() ?? 'otaku',
      email: json['email']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? json['username']?.toString() ?? 'Otaku',
      avatarUrl: json['avatarUrl']?.toString() ?? '',
      coverUrl: json['coverUrl']?.toString() ?? '',
      bio: json['bio']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
      isVerified: json['isVerified'] as bool? ?? false,
      xp: (json['xp'] as num?)?.toInt() ?? 0,
      level: (json['level'] as num?)?.toInt() ?? 1,
      levelTitle: json['levelTitle']?.toString() ?? 'Newbie',
      hasPassword: json['hasPassword'] as bool? ?? false,
      isGoogleLinked: json['isGoogleLinked'] as bool? ?? false,
      isFollowing: json['isFollowing'] as bool? ?? false,
      isOnline: json['isOnline'] as bool? ?? false,
      lastSeen: json['lastSeen'] != null ? DateTime.tryParse(json['lastSeen'].toString()) : null,
      privacySettings:
          UserPrivacySettings.fromJson(json['privacySettings'] as Map<String, dynamic>?),
      stats: UserStats.fromJson(json['stats'] as Map<String, dynamic>?),
      levelProgress: LevelProgress.fromJson(json['levelProgress'] as Map<String, dynamic>?),
    );
  }
}

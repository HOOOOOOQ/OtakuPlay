class LeaderboardEntryModel {
  final int rank;
  final String userId;
  final String username;
  final String displayName;
  final String avatarUrl;
  final bool isVerified;
  final int level;
  final String levelTitle;
  final int xp;

  const LeaderboardEntryModel({
    required this.rank,
    required this.userId,
    required this.username,
    required this.displayName,
    this.avatarUrl = '',
    this.isVerified = false,
    this.level = 1,
    this.levelTitle = 'Newbie',
    this.xp = 0,
  });

  factory LeaderboardEntryModel.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntryModel(
      rank: (json['rank'] as num?)?.toInt() ?? 1,
      userId: json['userId']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? '',
      avatarUrl: json['avatarUrl']?.toString() ?? '',
      isVerified: json['isVerified'] as bool? ?? false,
      level: (json['level'] as num?)?.toInt() ?? 1,
      levelTitle: json['levelTitle']?.toString() ?? 'Newbie',
      xp: (json['xp'] as num?)?.toInt() ?? 0,
    );
  }
}

class AchievementModel {
  final String id;
  final String code;
  final String name;
  final String description;
  final String icon;
  final int xpReward;
  final bool unlocked;
  final DateTime? unlockedAt;

  const AchievementModel({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.icon,
    this.xpReward = 0,
    this.unlocked = false,
    this.unlockedAt,
  });

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    return AchievementModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'award',
      xpReward: (json['xpReward'] as num?)?.toInt() ?? 0,
      unlocked: json['unlocked'] as bool? ?? false,
      unlockedAt:
          json['unlockedAt'] != null ? DateTime.tryParse(json['unlockedAt'].toString()) : null,
    );
  }
}

class AppNotificationModel {
  final String id;
  final String type;
  final String title;
  final String body;
  final bool isRead;
  final DateTime? createdAt;

  const AppNotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.isRead = false,
    this.createdAt,
  });

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      type: json['type']?.toString() ?? 'admin_announcement',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      isRead: json['isRead'] as bool? ?? false,
      createdAt:
          json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}

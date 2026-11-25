class ChatParticipantModel {
  final String id;
  final String username;
  final String displayName;
  final String avatarUrl;
  final bool isVerified;
  final bool isOnline;
  final DateTime? lastSeen;

  const ChatParticipantModel({
    required this.id,
    required this.username,
    required this.displayName,
    this.avatarUrl = '',
    this.isVerified = false,
    this.isOnline = false,
    this.lastSeen,
  });

  factory ChatParticipantModel.fromJson(Map<String, dynamic> json) {
    return ChatParticipantModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      username: json['username']?.toString() ?? 'user',
      displayName: json['displayName']?.toString() ?? 'User',
      avatarUrl: json['avatarUrl']?.toString() ?? '',
      isVerified: json['isVerified'] as bool? ?? false,
      isOnline: json['isOnline'] as bool? ?? false,
      lastSeen: json['lastSeen'] != null ? DateTime.tryParse(json['lastSeen'].toString()) : null,
    );
  }
}

class ConversationModel {
  final String id;
  final String type;
  final String? name;
  final String? description;
  final String? avatarUrl;
  final List<ChatParticipantModel> participants;
  final String? lastMessageText;
  final DateTime? lastMessageAt;
  final int unreadCount;

  const ConversationModel({
    required this.id,
    required this.type,
    this.name,
    this.description,
    this.avatarUrl,
    this.participants = const [],
    this.lastMessageText,
    this.lastMessageAt,
    this.unreadCount = 0,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final rawParts = json['participants'] as List? ?? [];
    return ConversationModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      type: json['type']?.toString() ?? 'private',
      name: json['name']?.toString(),
      description: json['description']?.toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      participants: rawParts
          .whereType<Map<String, dynamic>>()
          .map(ChatParticipantModel.fromJson)
          .toList(),
      lastMessageText: json['lastMessageText']?.toString(),
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.tryParse(json['lastMessageAt'].toString())
          : null,
      unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
    );
  }

  String titleFor(String myUserId) {
    if (type == 'group') return name ?? 'Grup OtakuPlay';
    final other = participants.where((p) => p.id != myUserId).firstOrNull;
    return other?.displayName ?? 'Obrolan';
  }

  ChatParticipantModel? otherParticipant(String myUserId) {
    if (type == 'group') return null;
    return participants.where((p) => p.id != myUserId).firstOrNull;
  }
}

class ChatMessageModel {
  final String id;
  final String conversationId;
  final ChatParticipantModel sender;
  final String content;
  final String? attachmentUrl;
  final String attachmentType;
  final String? replyPreview;
  final List<String> readByUserIds;
  final DateTime? createdAt;

  const ChatMessageModel({
    required this.id,
    required this.conversationId,
    required this.sender,
    required this.content,
    this.attachmentUrl,
    this.attachmentType = 'none',
    this.replyPreview,
    this.readByUserIds = const [],
    this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    final senderMap = json['senderId'] is Map<String, dynamic>
        ? json['senderId'] as Map<String, dynamic>
        : <String, dynamic>{};
    final replyMap = json['replyToId'] as Map<String, dynamic>?;
    final readByRaw = json['readBy'] as List? ?? [];

    return ChatMessageModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      conversationId: json['conversationId']?.toString() ?? '',
      sender: ChatParticipantModel.fromJson(senderMap),
      content: json['content']?.toString() ?? '',
      attachmentUrl: json['attachmentUrl']?.toString(),
      attachmentType: json['attachmentType']?.toString() ?? 'none',
      replyPreview: replyMap?['content']?.toString(),
      readByUserIds: readByRaw
          .whereType<Map<String, dynamic>>()
          .map((e) => e['userId']?.toString() ?? '')
          .where((id) => id.isNotEmpty)
          .toList(),
      createdAt:
          json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }
}

import '../models/chat_model.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class ChatService {
  final ApiClient _api;
  ChatService(this._api);

  Future<List<ConversationModel>> getConversations({String? query}) {
    return _api.get(
      '/conversations',
      queryParameters: {
        if (query != null && query.isNotEmpty) 'q': query,
      },
      parser: (data) => (data as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ConversationModel.fromJson)
          .toList(),
    );
  }

  Future<ConversationModel> createPrivateConversation(String recipientId) {
    return _api.post(
      '/conversations',
      data: {'type': 'private', 'recipientId': recipientId},
      parser: (data) => ConversationModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<ConversationModel> createGroupConversation({
    required String name,
    String? description,
    List<String> participantIds = const [],
  }) {
    return _api.post(
      '/conversations',
      data: {
        'type': 'group',
        'name': name,
        if (description != null && description.isNotEmpty) 'description': description,
        'participantIds': participantIds,
      },
      parser: (data) => ConversationModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<ChatMessageModel>> getMessages(String conversationId, {int page = 1}) {
    return _api.get(
      '/conversations/$conversationId/messages',
      queryParameters: {'page': page},
      parser: (data) => (data as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ChatMessageModel.fromJson)
          .toList(),
    );
  }

  Future<ChatMessageModel> sendMessage({
    required String conversationId,
    required String content,
    String? attachmentUrl,
    String? replyToId,
  }) {
    return _api.post(
      '/conversations/$conversationId/messages',
      data: {
        'content': content,
        if (attachmentUrl != null) ...{
          'attachmentUrl': attachmentUrl,
          'attachmentType': 'image',
        },
        if (replyToId != null) 'replyToId': replyToId,
      },
      parser: (data) => ChatMessageModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> deleteMessage(String messageId) async {
    await _api.delete('/conversations/messages/$messageId', parser: (d) => d);
  }

  Future<void> markAsRead(String conversationId) async {
    await _api.post('/conversations/$conversationId/read', parser: (d) => d);
  }

  Future<List<UserModel>> searchUsers(String query) {
    return _api.get(
      '/users/search',
      queryParameters: {'q': query},
      parser: (data) => (data as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(UserModel.fromJson)
          .toList(),
    );
  }
}

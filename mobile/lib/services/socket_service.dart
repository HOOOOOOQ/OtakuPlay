import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/env.dart';
import '../core/storage_service.dart';

class SocketService {
  final StorageService _storage;
  io.Socket? _socket;

  SocketService(this._storage);

  io.Socket? get socket => _socket;

  Future<void> connect() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) return;

    _socket?.dispose();
    _socket = io.io(
      AppEnv.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );
    _socket?.connect();
  }

  void joinConversation(String conversationId) {
    _socket?.emit('chat:join', conversationId);
  }

  void startTyping(String conversationId) {
    _socket?.emit('chat:typing:start', conversationId);
  }

  void stopTyping(String conversationId) {
    _socket?.emit('chat:typing:stop', conversationId);
  }

  void markRead(String conversationId) {
    _socket?.emit('chat:read', conversationId);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}

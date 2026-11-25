import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/formatters.dart';
import '../../models/chat_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';

class ChatRoomScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final ConversationModel? conversation;

  const ChatRoomScreen({super.key, required this.conversationId, this.conversation});

  @override
  ConsumerState<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends ConsumerState<ChatRoomScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<ChatMessageModel> _messages = [];
  bool _loading = true;
  bool _otherTyping = false;
  ChatMessageModel? _replyTo;

  @override
  void initState() {
    super.initState();
    _initRoom();
  }

  @override
  void dispose() {
    final socket = ref.read(socketServiceProvider).socket;
    socket?.off('chat:new_message');
    socket?.off('chat:typing');
    socket?.off('chat:message_deleted');
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _initRoom() async {
    final chatSvc = ref.read(chatServiceProvider);
    final socketSvc = ref.read(socketServiceProvider);
    socketSvc.joinConversation(widget.conversationId);

    try {
      final msgs = await chatSvc.getMessages(widget.conversationId);
      await chatSvc.markAsRead(widget.conversationId);
      setState(() {
        _messages = msgs;
        _loading = false;
      });
      _scrollToBottom();
    } catch (_) {
      setState(() => _loading = false);
    }

    final socket = socketSvc.socket;
    socket?.on('chat:new_message', (data) {
      if (!mounted || data is! Map<String, dynamic>) return;
      final incoming = ChatMessageModel.fromJson(data);
      if (incoming.conversationId == widget.conversationId &&
          !_messages.any((m) => m.id == incoming.id)) {
        setState(() => _messages.add(incoming));
        _scrollToBottom();
        socketSvc.markRead(widget.conversationId);
      }
    });

    socket?.on('chat:typing', (data) {
      if (!mounted || data is! Map<String, dynamic>) return;
      if (data['conversationId'] == widget.conversationId &&
          data['userId'] != ref.read(authProvider).user?.id) {
        setState(() => _otherTyping = data['isTyping'] == true);
      }
    });

    socket?.on('chat:message_deleted', (data) {
      if (!mounted || data is! Map<String, dynamic>) return;
      setState(() {
        _messages.removeWhere((m) => m.id == data['messageId']);
      });
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    _msgCtrl.clear();
    ref.read(socketServiceProvider).stopTyping(widget.conversationId);

    try {
      final created = await ref.read(chatServiceProvider).sendMessage(
            conversationId: widget.conversationId,
            content: text,
            replyToId: _replyTo?.id,
          );
      if (!_messages.any((m) => m.id == created.id)) {
        setState(() {
          _messages.add(created);
          _replyTo = null;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final myId = ref.watch(authProvider).user?.id ?? '';
    final title = widget.conversation?.titleFor(myId) ?? 'Obrolan';
    final other = widget.conversation?.otherParticipant(myId);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            if (_otherTyping)
              const Text(
                'Sedang mengetik...',
                style: TextStyle(fontSize: 11, color: AppColors.accent),
              )
            else if (other != null)
              Text(
                other.isOnline
                    ? 'Online'
                    : 'Terakhir dilihat ${AppFormatters.timeAgo(other.lastSeen)}',
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, idx) {
                      final msg = _messages[idx];
                      final isMe = msg.sender.id == myId;
                      return GestureDetector(
                        onLongPress: () {
                          showModalBottomSheet(
                            context: context,
                            backgroundColor: AppColors.surface,
                            builder: (ctx) => SafeArea(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  ListTile(
                                    leading: const Icon(Icons.reply_rounded),
                                    title: const Text('Balas Pesan'),
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      setState(() => _replyTo = msg);
                                    },
                                  ),
                                  if (isMe)
                                    ListTile(
                                      leading: const Icon(
                                        Icons.delete_outline_rounded,
                                        color: AppColors.error,
                                      ),
                                      title: const Text(
                                        'Hapus Pesan',
                                        style: TextStyle(color: AppColors.error),
                                      ),
                                      onTap: () async {
                                        Navigator.pop(ctx);
                                        await ref.read(chatServiceProvider).deleteMessage(msg.id);
                                        setState(() => _messages.removeWhere((m) => m.id == msg.id));
                                      },
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                        child: Align(
                          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.of(context).size.width * 0.74,
                            ),
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: isMe ? AppColors.primary : AppColors.surface,
                              borderRadius: BorderRadius.circular(16),
                              border: isMe ? null : Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (!isMe && widget.conversation?.type == 'group')
                                  Text(
                                    '@${msg.sender.username}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.accent,
                                    ),
                                  ),
                                if (msg.replyPreview != null)
                                  Container(
                                    margin: const EdgeInsets.only(bottom: 6),
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(
                                      color: Colors.black26,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      msg.replyPreview!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 11),
                                    ),
                                  ),
                                Text(msg.content, style: const TextStyle(fontSize: 14)),
                                const SizedBox(height: 4),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      AppFormatters.timeAgo(msg.createdAt),
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: isMe ? Colors.white70 : AppColors.textSecondary,
                                      ),
                                    ),
                                    if (isMe) ...[
                                      const SizedBox(width: 4),
                                      Icon(
                                        msg.readByUserIds.length > 1
                                            ? Icons.done_all_rounded
                                            : Icons.done_rounded,
                                        size: 13,
                                        color: Colors.white70,
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          if (_replyTo != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppColors.secondarySurface,
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Membalas: ${_replyTo!.content}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: AppColors.secondary),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _replyTo = null),
                    child: const Icon(Icons.close_rounded, size: 16),
                  ),
                ],
              ),
            ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgCtrl,
                      onChanged: (v) {
                        final socket = ref.read(socketServiceProvider);
                        if (v.isNotEmpty) {
                          socket.startTyping(widget.conversationId);
                        } else {
                          socket.stopTyping(widget.conversationId);
                        }
                      },
                      decoration: const InputDecoration(hintText: 'Tulis pesan...'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: AppColors.primary),
                    onPressed: _send,
                    icon: const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

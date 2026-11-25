import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/formatters.dart';
import '../../models/community_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/verified_badge.dart';

class CommentsSheet extends ConsumerStatefulWidget {
  final String postId;

  const CommentsSheet({super.key, required this.postId});

  @override
  ConsumerState<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends ConsumerState<CommentsSheet> {
  final _ctrl = TextEditingController();
  List<CommentModel> _comments = [];
  bool _loading = true;
  String? _replyToId;
  String? _replyToUsername;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await ref.read(communityServiceProvider).getComments(widget.postId);
      setState(() {
        _comments = list;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    try {
      final created = await ref
          .read(communityServiceProvider)
          .addComment(widget.postId, text, parentId: _replyToId);
      _ctrl.clear();
      setState(() {
        _comments.add(created);
        _replyToId = null;
        _replyToUsername = null;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.72,
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const Padding(
              padding: EdgeInsets.all(14),
              child: Text('Komentar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : _comments.isEmpty
                      ? const Center(
                          child: Text(
                            'Belum ada komentar. Jadilah yang pertama!',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _comments.length,
                          itemBuilder: (context, idx) {
                            final c = _comments[idx];
                            final isReply = c.parentId != null;
                            return Padding(
                              padding: EdgeInsets.only(
                                left: isReply ? 28 : 0,
                                bottom: 12,
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const CircleAvatar(
                                    radius: 15,
                                    backgroundImage:
                                        AssetImage('assets/avatars/default_avatar.png'),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              '@${c.author.username}',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: AppColors.secondary,
                                              ),
                                            ),
                                            if (c.author.isVerified) ...[
                                              const SizedBox(width: 4),
                                              const VerifiedBadge(size: 13),
                                            ],
                                            const SizedBox(width: 8),
                                            Text(
                                              AppFormatters.timeAgo(c.createdAt),
                                              style: const TextStyle(
                                                fontSize: 10,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 3),
                                        Text(c.content, style: const TextStyle(fontSize: 13)),
                                        TextButton(
                                          style: TextButton.styleFrom(
                                            padding: EdgeInsets.zero,
                                            minimumSize: const Size(0, 24),
                                          ),
                                          onPressed: () => setState(() {
                                            _replyToId = c.id;
                                            _replyToUsername = c.author.username;
                                          }),
                                          child: const Text(
                                            'Balas',
                                            style: TextStyle(fontSize: 11, color: AppColors.accent),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),
            if (_replyToUsername != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                color: AppColors.secondarySurface,
                child: Row(
                  children: [
                    Text(
                      'Membalas @$_replyToUsername',
                      style: const TextStyle(fontSize: 12, color: AppColors.secondary),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => setState(() {
                        _replyToId = null;
                        _replyToUsername = null;
                      }),
                      child: const Icon(Icons.close_rounded, size: 16),
                    ),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      decoration: const InputDecoration(hintText: 'Tulis komentar...'),
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
          ],
        ),
      ),
    );
  }
}

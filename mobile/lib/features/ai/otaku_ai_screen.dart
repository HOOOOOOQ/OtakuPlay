import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/tools_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';

class OtakuAiScreen extends ConsumerStatefulWidget {
  const OtakuAiScreen({super.key});

  @override
  ConsumerState<OtakuAiScreen> createState() => _OtakuAiScreenState();
}

class _OtakuAiScreenState extends ConsumerState<OtakuAiScreen> {
  final _ctrl = TextEditingController();
  final List<AiMessageModel> _messages = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final raw = await ref.read(storageServiceProvider).getAiHistoryJson();
    setState(() {
      _messages.addAll(
        raw.map((e) => AiMessageModel.fromJson(jsonDecode(e) as Map<String, dynamic>)),
      );
    });
  }

  Future<void> _saveHistory() async {
    final encoded = _messages.map((m) => jsonEncode(m.toJson())).toList();
    await ref.read(storageServiceProvider).saveAiHistoryJson(encoded);
  }

  Future<void> _ask([String? preset]) async {
    final q = (preset ?? _ctrl.text).trim();
    if (q.isEmpty || _loading) return;
    _ctrl.clear();

    setState(() {
      _messages.add(AiMessageModel(role: 'user', text: q, timestamp: DateTime.now()));
      _loading = true;
    });
    await _saveHistory();

    try {
      final answer = await ref.read(toolsServiceProvider).askOtakuAi(q);
      setState(() {
        _messages.add(
          AiMessageModel(role: 'assistant', text: answer, timestamp: DateTime.now()),
        );
        _loading = false;
      });
      await _saveHistory();
    } catch (e) {
      setState(() {
        _messages.add(
          AiMessageModel(
            role: 'assistant',
            text: 'Maaf, terjadi kendala: $e',
            timestamp: DateTime.now(),
          ),
        );
        _loading = false;
      });
    }
  }

  Future<void> _clear() async {
    await ref.read(storageServiceProvider).clearAiHistory();
    setState(() => _messages.clear());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome_rounded, color: AppColors.accent, size: 20),
            SizedBox(width: 8),
            Text('Otaku AI', style: TextStyle(fontWeight: FontWeight.w800)),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _clear,
            tooltip: 'Bersihkan Percakapan',
            icon: const Icon(Icons.delete_sweep_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_messages.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  'Rekomendasi anime fantasy terbaik',
                  'Apa arti istilah Isekai & Seinen?',
                  'Bantu jelaskan Riverpod di Flutter',
                ]
                    .map(
                      (prompt) => ActionChip(
                        label: Text(prompt),
                        onPressed: () => _ask(prompt),
                      ),
                    )
                    .toList(),
              ),
            ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_loading ? 1 : 0),
              itemBuilder: (context, idx) {
                if (idx >= _messages.length) {
                  return const Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 8),
                          Text('Otaku AI sedang mengetik...',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                        ],
                      ),
                    ),
                  );
                }

                final msg = _messages[idx];
                final isUser = msg.role == 'user';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.82,
                    ),
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isUser ? AppColors.primary : AppColors.surface,
                      borderRadius: BorderRadius.circular(18),
                      border: isUser ? null : Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(msg.text, style: const TextStyle(fontSize: 14, height: 1.45)),
                        if (!isUser)
                          Align(
                            alignment: Alignment.centerRight,
                            child: IconButton(
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              icon: const Icon(Icons.copy_rounded,
                                  size: 16, color: AppColors.textSecondary),
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: msg.text));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Jawaban disalin')),
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
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
                      controller: _ctrl,
                      onSubmitted: (_) => _ask(),
                      decoration: const InputDecoration(
                        hintText: 'Tanya anime, istilah, atau coding...',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: AppColors.primary),
                    onPressed: _loading ? null : () => _ask(),
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

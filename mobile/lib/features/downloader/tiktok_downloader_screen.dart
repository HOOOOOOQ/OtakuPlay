import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import '../../models/tools_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';

class TikTokDownloaderScreen extends ConsumerStatefulWidget {
  const TikTokDownloaderScreen({super.key});

  @override
  ConsumerState<TikTokDownloaderScreen> createState() => _TikTokDownloaderScreenState();
}

class _TikTokDownloaderScreenState extends ConsumerState<TikTokDownloaderScreen> {
  final _urlCtrl = TextEditingController();
  TikTokResolveModel? _preview;
  bool _loading = false;
  double? _downloadProgress;
  String? _error;

  @override
  void dispose() {
    _urlCtrl.dispose();
    super.dispose();
  }

  Future<void> _resolve() async {
    final url = _urlCtrl.text.trim();
    if (url.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
      _preview = null;
    });

    try {
      final result = await ref.read(toolsServiceProvider).resolveTikTok(url);
      setState(() {
        _preview = result;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _downloadOption(TikTokLinkOption opt) async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      final ext = opt.type == 'mp3_audio' ? 'mp3' : 'mp4';
      final path = '${dir.path}/otakuplay_tiktok_${DateTime.now().millisecondsSinceEpoch}.$ext';

      setState(() => _downloadProgress = 0);
      await ref.read(toolsServiceProvider).downloadFile(
        opt.url,
        path,
        onProgress: (received, total) {
          if (total > 0 && mounted) {
            setState(() => _downloadProgress = received / total);
          }
        },
      );

      if (mounted) {
        setState(() => _downloadProgress = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unduhan selesai disimpan ke: $path')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _downloadProgress = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengunduh: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TikTok Utility Downloader')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.secondarySurface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: const Text(
              'Gunakan alat ini hanya untuk konten yang Anda miliki atau memiliki izin resmi untuk diunduh dan disimpan. Hormati hak cipta dan ketentuan TikTok.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _urlCtrl,
            decoration: const InputDecoration(
              hintText: 'Tempel tautan TikTok (https://vt.tiktok.com/...)',
              prefixIcon: Icon(Icons.link_rounded),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: _loading ? null : _resolve,
            icon: const Icon(Icons.search_rounded),
            label: Text(_loading ? 'Memeriksa Tautan...' : 'Ambil Preview'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 14),
            Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
          ],
          if (_downloadProgress != null) ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: _downloadProgress,
              color: AppColors.primary,
              backgroundColor: AppColors.secondarySurface,
            ),
            const SizedBox(height: 4),
            Text(
              'Mengunduh: ${((_downloadProgress ?? 0) * 100).toStringAsFixed(0)}%',
              style: const TextStyle(fontSize: 12, color: AppColors.secondary),
            ),
          ],
          if (_preview != null) ...[
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_preview!.thumbnail != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: CachedNetworkImage(
                        imageUrl: _preview!.thumbnail!,
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  const SizedBox(height: 12),
                  Text(
                    _preview!.title,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Creator: ${_preview!.author}',
                    style: const TextStyle(fontSize: 12, color: AppColors.secondary),
                  ),
                  const SizedBox(height: 14),
                  ..._preview!.downloadLinks.map(
                    (opt) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () => _downloadOption(opt),
                          icon: Icon(
                            opt.type == 'mp3_audio'
                                ? Icons.music_note_rounded
                                : Icons.download_rounded,
                            color: AppColors.accent,
                          ),
                          label: Text(opt.label),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

import 'dart:async';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import '../../models/anime_model.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/state_views.dart';

class WatchScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> params;

  const WatchScreen({super.key, required this.params});

  @override
  ConsumerState<WatchScreen> createState() => _WatchScreenState();
}

class _WatchScreenState extends ConsumerState<WatchScreen> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  StreamResolutionModel? _stream;
  bool _loading = true;
  String? _error;
  Timer? _progressTimer;

  late String _animeUrl;
  late String _animeTitle;
  String? _animeImage;
  late String _episodeNumber;
  late String _episodeTitle;
  late String _episodeUrl;
  late List<AnimeEpisodeModel> _episodes;
  late int _episodeIndex;
  int _resumeSeconds = 0;

  @override
  void initState() {
    super.initState();
    _animeUrl = widget.params['animeUrl']?.toString() ?? '';
    _animeTitle = widget.params['animeTitle']?.toString() ?? 'Anime';
    _animeImage = widget.params['animeImage']?.toString();
    _episodeNumber = widget.params['episodeNumber']?.toString() ?? '1';
    _episodeTitle = widget.params['episodeTitle']?.toString() ?? 'Episode 1';
    _episodeUrl = widget.params['episodeUrl']?.toString() ?? '';
    _episodes = (widget.params['episodes'] as List<AnimeEpisodeModel>?) ?? [];
    _episodeIndex = (widget.params['episodeIndex'] as int?) ?? 0;
    _resumeSeconds = (widget.params['resumeSeconds'] as int?) ?? 0;
    _loadStream();
  }

  @override
  void dispose() {
    _saveWatchProgress();
    _progressTimer?.cancel();
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _loadStream() async {
    _progressTimer?.cancel();
    _chewieController?.dispose();
    _videoController?.dispose();
    _chewieController = null;
    _videoController = null;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await ref.read(animeRepositoryProvider).getStream(_episodeUrl);
      _stream = res;

      if (res.isDirectPlayable && res.streamUrl != null) {
        final vc = VideoPlayerController.networkUrl(Uri.parse(res.streamUrl!));
        await vc.initialize();
        if (_resumeSeconds > 0 && _resumeSeconds < vc.value.duration.inSeconds) {
          await vc.seekTo(Duration(seconds: _resumeSeconds));
        }

        final cc = ChewieController(
          videoPlayerController: vc,
          autoPlay: true,
          looping: false,
          allowFullScreen: true,
          allowMuting: true,
          materialProgressColors: ChewieProgressColors(
            playedColor: AppColors.primary,
            handleColor: AppColors.accent,
            bufferedColor: AppColors.secondary.withValues(alpha: 0.3),
            backgroundColor: AppColors.secondarySurface,
          ),
        );

        _videoController = vc;
        _chewieController = cc;
        _progressTimer = Timer.periodic(const Duration(seconds: 15), (_) {
          _saveWatchProgress();
        });
      }

      setState(() => _loading = false);
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _saveWatchProgress() async {
    if (!ref.read(authProvider).isAuthenticated) return;
    final pos = _videoController?.value.position.inSeconds ?? 0;
    final dur = _videoController?.value.duration.inSeconds ?? 0;
    try {
      await ref.read(animeRepositoryProvider).recordWatchProgress(
            animeUrl: _animeUrl,
            animeTitle: _animeTitle,
            animeImage: _animeImage,
            episodeNumber: _episodeNumber,
            episodeTitle: _episodeTitle,
            episodeUrl: _episodeUrl,
            positionSeconds: pos,
            durationSeconds: dur,
            completed: dur > 0 && pos >= dur - 15,
          );
    } catch (_) {}
  }

  void _switchEpisode(int newIndex) {
    if (newIndex < 0 || newIndex >= _episodes.length) return;
    _saveWatchProgress();
    final ep = _episodes[newIndex];
    setState(() {
      _episodeIndex = newIndex;
      _episodeNumber = ep.episode;
      _episodeTitle = ep.title;
      _episodeUrl = ep.episodeUrl;
      _resumeSeconds = 0;
    });
    _loadStream();
  }

  Future<void> _openExternalLink(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPrev = _episodes.isNotEmpty && _episodeIndex > 0;
    final hasNext = _episodes.isNotEmpty && _episodeIndex < _episodes.length - 1;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _animeTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            Text(
              _episodeTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11, color: AppColors.secondary),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              color: Colors.black,
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  : _error != null
                      ? ErrorStateView(message: _error!, onRetry: _loadStream)
                      : _chewieController != null
                          ? Chewie(controller: _chewieController!)
                          : Center(
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.ondemand_video_rounded,
                                      color: AppColors.accent,
                                      size: 40,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      _stream?.availabilityMessage ??
                                          'Stream langsung tidak tersedia.',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    if (_stream?.streamUrl != null) ...[
                                      const SizedBox(height: 10),
                                      ElevatedButton.icon(
                                        onPressed: () => _openExternalLink(_stream!.streamUrl!),
                                        icon: const Icon(Icons.open_in_browser_rounded, size: 18),
                                        label: const Text('Buka Sumber Resmi'),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_episodes.isNotEmpty)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: hasPrev ? () => _switchEpisode(_episodeIndex - 1) : null,
                          icon: const Icon(Icons.skip_previous_rounded),
                          label: const Text('Eps Sebelumnya'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: hasNext ? () => _switchEpisode(_episodeIndex + 1) : null,
                          icon: const Icon(Icons.skip_next_rounded),
                          label: const Text('Eps Selanjutnya'),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 16),
                if (_stream != null && _stream!.alternativeLinks.isNotEmpty) ...[
                  const Text(
                    'Sumber Alternatif Resmi',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _stream!.alternativeLinks
                        .map(
                          (alt) => ActionChip(
                            avatar: const Icon(Icons.link_rounded, size: 16),
                            label: Text(alt.label),
                            onPressed: () => _openExternalLink(alt.url),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String? _nullableStr(dynamic value) {
  if (value == null) return null;
  final s = value.toString().trim();
  if (s.isEmpty || s.toLowerCase() == 'null' || s.toLowerCase() == 'n/a') return null;
  return s;
}

class AnimeItemModel {
  final String title;
  final String link;
  final String? image;
  final String? latestEpisode;
  final String? type;
  final String? rating;

  const AnimeItemModel({
    required this.title,
    required this.link,
    this.image,
    this.latestEpisode,
    this.type,
    this.rating,
  });

  factory AnimeItemModel.fromJson(Map<String, dynamic> json) {
    return AnimeItemModel(
      title: json['title']?.toString() ?? 'Tanpa Judul',
      link: (json['link'] ?? json['url'] ?? '').toString(),
      image: _nullableStr(json['image']),
      latestEpisode: _nullableStr(json['latestEpisode'] ?? json['episode']),
      type: _nullableStr(json['type']),
      rating: _nullableStr(json['rating']),
    );
  }
}

class AnimeEpisodeModel {
  final String episode;
  final String title;
  final String episodeUrl;
  final String? date;

  const AnimeEpisodeModel({
    required this.episode,
    required this.title,
    required this.episodeUrl,
    this.date,
  });

  factory AnimeEpisodeModel.fromJson(Map<String, dynamic> json) {
    return AnimeEpisodeModel(
      episode: json['episode']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Episode',
      episodeUrl: json['episodeUrl']?.toString() ?? '',
      date: _nullableStr(json['date']),
    );
  }
}

class AnimeDetailsModel {
  final String title;
  final String? image;
  final Map<String, dynamic> info;
  final List<String> genres;
  final String sinopsis;
  final String? rating;
  final String? totalEpisodes;
  final List<AnimeEpisodeModel> episodes;
  final String url;

  const AnimeDetailsModel({
    required this.title,
    this.image,
    this.info = const {},
    this.genres = const [],
    this.sinopsis = '',
    this.rating,
    this.totalEpisodes,
    this.episodes = const [],
    required this.url,
  });

  factory AnimeDetailsModel.fromJson(Map<String, dynamic> json) {
    final rawGenres = json['genres'];
    final genres = rawGenres is List
        ? rawGenres.map((e) => e.toString()).where((e) => e.isNotEmpty).toList()
        : <String>[];
    final rawEpisodes = json['episodes'];
    final episodes = rawEpisodes is List
        ? rawEpisodes
            .whereType<Map<String, dynamic>>()
            .map(AnimeEpisodeModel.fromJson)
            .toList()
        : <AnimeEpisodeModel>[];

    return AnimeDetailsModel(
      title: json['title']?.toString() ?? 'Tanpa Judul',
      image: _nullableStr(json['image']),
      info: json['info'] is Map<String, dynamic>
          ? json['info'] as Map<String, dynamic>
          : <String, dynamic>{},
      genres: genres,
      sinopsis: json['sinopsis']?.toString() ?? 'Sinopsis belum tersedia.',
      rating: _nullableStr(json['rating']),
      totalEpisodes: _nullableStr(json['totalEpisodes']),
      episodes: episodes,
      url: json['url']?.toString() ?? '',
    );
  }

  String infoField(List<String> keys) {
    for (final k in keys) {
      for (final entry in info.entries) {
        if (entry.key.toLowerCase() == k.toLowerCase() && entry.value != null) {
          final val = entry.value.toString().trim();
          if (val.isNotEmpty) return val;
        }
      }
    }
    return 'Tidak diketahui';
  }
}

class StreamResolutionModel {
  final String? streamUrl;
  final List<({String label, String url})> alternativeLinks;
  final String episodeTitle;
  final String episodeHeading;
  final String format;
  final bool isDirectPlayable;
  final bool requiresExternalOrWebFallback;
  final String availabilityMessage;

  const StreamResolutionModel({
    this.streamUrl,
    this.alternativeLinks = const [],
    required this.episodeTitle,
    required this.episodeHeading,
    required this.format,
    required this.isDirectPlayable,
    required this.requiresExternalOrWebFallback,
    required this.availabilityMessage,
  });

  factory StreamResolutionModel.fromJson(Map<String, dynamic> json) {
    final epInfo = json['episodeInfo'] as Map<String, dynamic>? ?? {};
    final rawAlts = json['alternativeLinks'] as List? ?? [];
    final alts = rawAlts.whereType<Map<String, dynamic>>().map((item) {
      return (
        label: item['label']?.toString() ?? 'Server Alternatif',
        url: item['url']?.toString() ?? '',
      );
    }).where((a) => a.url.isNotEmpty).toList();

    return StreamResolutionModel(
      streamUrl: _nullableStr(json['streamUrl']),
      alternativeLinks: alts,
      episodeTitle: epInfo['title']?.toString() ?? 'Episode',
      episodeHeading: epInfo['heading']?.toString() ?? 'Pemutar Anime',
      format: json['format']?.toString() ?? 'unavailable',
      isDirectPlayable: json['isDirectPlayable'] as bool? ?? false,
      requiresExternalOrWebFallback: json['requiresExternalOrWebFallback'] as bool? ?? true,
      availabilityMessage:
          json['availabilityMessage']?.toString() ?? 'Memeriksa ketersediaan stream...',
    );
  }
}

class ScheduleGroupModel {
  final String day;
  final List<AnimeItemModel> items;

  const ScheduleGroupModel({required this.day, required this.items});
}

class WatchHistoryModel {
  final String animeUrl;
  final String animeTitle;
  final String? animeImage;
  final String episodeNumber;
  final String episodeTitle;
  final String episodeUrl;
  final int positionSeconds;
  final int durationSeconds;
  final bool completed;
  final DateTime? watchedAt;

  const WatchHistoryModel({
    required this.animeUrl,
    required this.animeTitle,
    this.animeImage,
    required this.episodeNumber,
    required this.episodeTitle,
    required this.episodeUrl,
    this.positionSeconds = 0,
    this.durationSeconds = 0,
    this.completed = false,
    this.watchedAt,
  });

  factory WatchHistoryModel.fromJson(Map<String, dynamic> json) {
    return WatchHistoryModel(
      animeUrl: json['animeUrl']?.toString() ?? '',
      animeTitle: json['animeTitle']?.toString() ?? '',
      animeImage: _nullableStr(json['animeImage']),
      episodeNumber: json['episodeNumber']?.toString() ?? '1',
      episodeTitle: json['episodeTitle']?.toString() ?? '',
      episodeUrl: json['episodeUrl']?.toString() ?? '',
      positionSeconds: (json['positionSeconds'] as num?)?.toInt() ?? 0,
      durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 0,
      completed: json['completed'] as bool? ?? false,
      watchedAt:
          json['watchedAt'] != null ? DateTime.tryParse(json['watchedAt'].toString()) : null,
    );
  }
}

class KompasNewsModel {
  final String title;
  final String url;
  final String category;
  final String? image;
  final String time;
  final String published;
  final String description;

  const KompasNewsModel({
    required this.title,
    required this.url,
    required this.category,
    this.image,
    required this.time,
    required this.published,
    required this.description,
  });

  factory KompasNewsModel.fromJson(Map<String, dynamic> json) {
    return KompasNewsModel(
      title: json['title']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
      category: json['category']?.toString() ?? 'Umum',
      image: json['image']?.toString(),
      time: json['time']?.toString() ?? '',
      published: json['published']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
    );
  }
}

class TikTokLinkOption {
  final String label;
  final String type;
  final String url;

  const TikTokLinkOption({
    required this.label,
    required this.type,
    required this.url,
  });

  factory TikTokLinkOption.fromJson(Map<String, dynamic> json) {
    return TikTokLinkOption(
      label: json['label']?.toString() ?? 'Unduh',
      type: json['type']?.toString() ?? 'other',
      url: json['url']?.toString() ?? '',
    );
  }
}

class TikTokResolveModel {
  final String author;
  final String title;
  final String? thumbnail;
  final List<TikTokLinkOption> downloadLinks;
  final String legalNotice;

  const TikTokResolveModel({
    required this.author,
    required this.title,
    this.thumbnail,
    this.downloadLinks = const [],
    this.legalNotice = '',
  });

  factory TikTokResolveModel.fromJson(Map<String, dynamic> json) {
    final rawLinks = json['download_links'] as List? ?? [];
    return TikTokResolveModel(
      author: json['author']?.toString() ?? 'TikTok',
      title: json['title']?.toString() ?? 'Video TikTok',
      thumbnail: json['thumbnail']?.toString(),
      downloadLinks: rawLinks
          .whereType<Map<String, dynamic>>()
          .map(TikTokLinkOption.fromJson)
          .toList(),
      legalNotice: json['legalNotice']?.toString() ?? '',
    );
  }
}

class AiMessageModel {
  final String role; // 'user' | 'assistant'
  final String text;
  final DateTime timestamp;

  const AiMessageModel({
    required this.role,
    required this.text,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'role': role,
        'text': text,
        'timestamp': timestamp.toIso8601String(),
      };

  factory AiMessageModel.fromJson(Map<String, dynamic> json) {
    return AiMessageModel(
      role: json['role']?.toString() ?? 'assistant',
      text: json['text']?.toString() ?? '',
      timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

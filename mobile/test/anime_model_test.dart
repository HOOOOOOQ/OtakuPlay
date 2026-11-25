import 'package:flutter_test/flutter_test.dart';
import 'package:otakuplay/core/formatters.dart';
import 'package:otakuplay/models/anime_model.dart';

void main() {
  group('AnimeItemModel & StreamResolutionModel', () {
    test('handles null rating safely as Belum tersedia', () {
      final item = AnimeItemModel.fromJson({
        'title': 'Frieren: Beyond Journey\'s End',
        'link': 'https://animasu.example/anime/frieren',
        'image': 'https://img.example/frieren.jpg',
        'latestEpisode': 'Episode 28',
        'type': 'TV',
        'rating': null,
      });

      expect(item.rating, isNull);
      expect(AppFormatters.formatRating(item.rating), 'Belum tersedia');
    });

    test('parses StreamResolutionModel with alternativeLinks fallback', () {
      final stream = StreamResolutionModel.fromJson({
        'streamUrl': null,
        'alternativeLinks': [
          {'label': 'Server Resmi', 'url': 'https://mirror.example/ep1'}
        ],
        'episodeInfo': {'title': 'Episode 1', 'heading': 'Frieren Ep 1'},
        'format': 'unavailable',
        'isDirectPlayable': false,
        'requiresExternalOrWebFallback': true,
        'availabilityMessage': 'Gunakan server alternatif.',
      });

      expect(stream.isDirectPlayable, isFalse);
      expect(stream.alternativeLinks.length, 1);
      expect(stream.episodeTitle, 'Episode 1');
    });
  });
}

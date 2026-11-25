import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:otakuplay/models/anime_model.dart';
import 'package:otakuplay/theme/app_theme.dart';
import 'package:otakuplay/widgets/anime_poster_card.dart';
import 'package:otakuplay/widgets/verified_badge.dart';

void main() {
  testWidgets('VerifiedBadge renders blue verification icon', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const Scaffold(body: Center(child: VerifiedBadge())),
      ),
    );
    expect(find.byIcon(Icons.verified_rounded), findsOneWidget);
  });

  testWidgets('AnimePosterCard displays fallback rating when null', (tester) async {
    const anime = AnimeItemModel(
      title: 'Solo Leveling',
      link: 'https://animasu.example/solo',
      type: 'TV',
      latestEpisode: 'Episode 12',
      rating: null,
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: Scaffold(
          body: AnimePosterCard(anime: anime, onTap: () {}),
        ),
      ),
    );

    expect(find.text('Solo Leveling'), findsOneWidget);
    expect(find.text('Rating: Belum tersedia'), findsOneWidget);
  });
}

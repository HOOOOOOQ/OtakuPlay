import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/ai/otaku_ai_screen.dart';
import '../features/anime/anime_detail_screen.dart';
import '../features/anime/anime_screen.dart';
import '../features/anime/anime_search_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/onboarding_screen.dart';
import '../features/auth/splash_screen.dart';
import '../features/chat/chat_room_screen.dart';
import '../features/chat/inbox_screen.dart';
import '../features/community/community_screen.dart';
import '../features/community/create_post_screen.dart';
import '../features/downloader/tiktok_downloader_screen.dart';
import '../features/home/home_screen.dart';
import '../features/leaderboard/leaderboard_screen.dart';
import '../features/news/news_reader_screen.dart';
import '../features/news/news_screen.dart';
import '../features/player/watch_screen.dart';
import '../features/profile/account_settings_screen.dart';
import '../features/profile/edit_profile_screen.dart';
import '../features/profile/notifications_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/profile/verification_request_screen.dart';
import '../models/chat_model.dart';
import '../models/tools_model.dart';
import '../widgets/main_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
    GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),

    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) => MainShell(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [GoRoute(path: '/home', builder: (_, __) => const HomeScreen())],
        ),
        StatefulShellBranch(
          routes: [GoRoute(path: '/anime', builder: (_, __) => const AnimeScreen())],
        ),
        StatefulShellBranch(
          routes: [GoRoute(path: '/community', builder: (_, __) => const CommunityScreen())],
        ),
        StatefulShellBranch(
          routes: [GoRoute(path: '/inbox', builder: (_, __) => const InboxScreen())],
        ),
        StatefulShellBranch(
          routes: [GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen())],
        ),
      ],
    ),

    GoRoute(
      path: '/anime/search',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const AnimeSearchScreen(),
    ),
    GoRoute(
      path: '/anime/detail',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, state) => AnimeDetailScreen(animeUrl: state.extra?.toString() ?? ''),
    ),
    GoRoute(
      path: '/watch',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, state) => WatchScreen(params: (state.extra as Map<String, dynamic>?) ?? {}),
    ),
    GoRoute(
      path: '/community/create',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const CreatePostScreen(),
    ),
    GoRoute(
      path: '/chat/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, state) => ChatRoomScreen(
        conversationId: state.pathParameters['id'] ?? '',
        conversation: state.extra is ConversationModel ? state.extra as ConversationModel : null,
      ),
    ),
    GoRoute(
      path: '/profile/edit',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const EditProfileScreen(),
    ),
    GoRoute(
      path: '/profile/settings',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const AccountSettingsScreen(),
    ),
    GoRoute(
      path: '/profile/verification',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const VerificationRequestScreen(),
    ),
    GoRoute(
      path: '/notifications',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/leaderboard',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const LeaderboardScreen(),
    ),
    GoRoute(
      path: '/tools/ai',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const OtakuAiScreen(),
    ),
    GoRoute(
      path: '/tools/tiktok',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const TikTokDownloaderScreen(),
    ),
    GoRoute(
      path: '/tools/news',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, __) => const NewsScreen(),
    ),
    GoRoute(
      path: '/tools/news/read',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, state) => NewsReaderScreen(article: state.extra as KompasNewsModel),
    ),
  ],
);

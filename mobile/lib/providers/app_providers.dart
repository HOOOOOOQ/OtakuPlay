import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/storage_service.dart';
import '../models/anime_model.dart';
import '../models/chat_model.dart';
import '../models/community_model.dart';
import '../models/gamification_model.dart';
import '../models/tools_model.dart';
import '../models/user_model.dart';
import '../repositories/anime_repository.dart';
import '../services/anime_api_service.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import '../services/community_service.dart';
import '../services/socket_service.dart';
import '../services/tools_service.dart';

final storageServiceProvider = Provider((ref) => StorageService());
final apiClientProvider = Provider((ref) => ApiClient(ref.watch(storageServiceProvider)));
final authServiceProvider = Provider(
  (ref) => AuthService(ref.watch(apiClientProvider), ref.watch(storageServiceProvider)),
);
final animeApiServiceProvider = Provider((ref) => AnimeApiService(ref.watch(apiClientProvider)));
final animeRepositoryProvider = Provider(
  (ref) => AnimeRepository(ref.watch(animeApiServiceProvider), ref.watch(apiClientProvider)),
);
final communityServiceProvider = Provider((ref) => CommunityService(ref.watch(apiClientProvider)));
final chatServiceProvider = Provider((ref) => ChatService(ref.watch(apiClientProvider)));
final socketServiceProvider = Provider((ref) => SocketService(ref.watch(storageServiceProvider)));
final toolsServiceProvider = Provider((ref) => ToolsService(ref.watch(apiClientProvider)));

class AuthState {
  final bool loading;
  final UserModel? user;
  final String? error;

  const AuthState({this.loading = false, this.user, this.error});

  bool get isAuthenticated => user != null;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _auth;
  final StorageService _storage;
  final SocketService _socket;

  AuthNotifier(this._auth, this._storage, this._socket) : super(const AuthState(loading: true)) {
    restoreSession();
  }

  Future<void> restoreSession() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) {
      state = const AuthState(loading: false, user: null);
      return;
    }
    try {
      final user = await _auth.fetchMe();
      await _socket.connect();
      state = AuthState(loading: false, user: user);
    } catch (_) {
      state = const AuthState(loading: false, user: null);
    }
  }

  Future<void> loginWithGoogle() async {
    state = AuthState(loading: true, user: state.user);
    try {
      final user = await _auth.signInWithGoogle();
      await _socket.connect();
      state = AuthState(loading: false, user: user);
    } catch (e) {
      state = AuthState(loading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> loginWithPassword(String identifier, String password) async {
    state = AuthState(loading: true, user: state.user);
    try {
      final user = await _auth.loginWithPassword(identifier: identifier, password: password);
      await _socket.connect();
      state = AuthState(loading: false, user: user);
    } catch (e) {
      state = AuthState(loading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> registerWithPassword({
    required String email,
    required String username,
    required String displayName,
    required String password,
  }) async {
    state = AuthState(loading: true, user: state.user);
    try {
      final user = await _auth.registerWithPassword(
        email: email,
        username: username,
        displayName: displayName,
        password: password,
      );
      await _socket.connect();
      state = AuthState(loading: false, user: user);
    } catch (e) {
      state = AuthState(loading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> refreshProfile() async {
    try {
      final user = await _auth.fetchMe();
      state = AuthState(loading: false, user: user);
    } catch (_) {}
  }

  Future<void> logout() async {
    _socket.disconnect();
    await _auth.logout();
    state = const AuthState(loading: false, user: null);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authServiceProvider),
    ref.watch(storageServiceProvider),
    ref.watch(socketServiceProvider),
  );
});

final homeDataProvider = FutureProvider.autoDispose((ref) async {
  final repo = ref.watch(animeRepositoryProvider);
  final community = ref.watch(communityServiceProvider);
  final tools = ref.watch(toolsServiceProvider);
  final auth = ref.watch(authProvider);

  final results = await Future.wait([
    repo.getPopular(page: 1),
    repo.getOngoing(page: 1),
    repo.getCompleted(page: 1),
    community.getPosts(feed: 'trending').catchError((_) => <PostModel>[]),
    tools
        .getKompasNews()
        .catchError((_) => (attribution: 'Kompas.com', items: <KompasNewsModel>[])),
    auth.isAuthenticated
        ? repo.getWatchHistory().catchError((_) => <WatchHistoryModel>[])
        : Future.value(<WatchHistoryModel>[]),
  ]);

  return (
    popular: results[0] as List<AnimeItemModel>,
    ongoing: results[1] as List<AnimeItemModel>,
    completed: results[2] as List<AnimeItemModel>,
    trendingPosts: results[3] as List<PostModel>,
    news: (results[4] as ({String attribution, List<KompasNewsModel> items})).items,
    history: results[5] as List<WatchHistoryModel>,
  );
});

final communityFeedProvider =
    FutureProvider.autoDispose.family<List<PostModel>, String>((ref, feed) {
  return ref.watch(communityServiceProvider).getPosts(feed: feed);
});

final conversationsProvider = FutureProvider.autoDispose<List<ConversationModel>>((ref) {
  return ref.watch(chatServiceProvider).getConversations();
});

final leaderboardProvider =
    FutureProvider.autoDispose.family<List<LeaderboardEntryModel>, String>((ref, period) {
  return ref.watch(toolsServiceProvider).getLeaderboard(period);
});

final newsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(toolsServiceProvider).getKompasNews();
});

import 'package:google_sign_in/google_sign_in.dart';
import '../config/env.dart';
import '../core/errors.dart';
import '../core/storage_service.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _api;
  final StorageService _storage;

  late final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: const ['email', 'profile'],
    serverClientId: AppEnv.googleServerClientId.isEmpty ? null : AppEnv.googleServerClientId,
  );

  AuthService(this._api, this._storage);

  Future<UserModel> signInWithGoogle() async {
    final account = await _googleSignIn.signIn();
    if (account == null) {
      throw const AppException('Masuk dengan Google dibatalkan');
    }
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw const AppException(
        'Google ID Token tidak tersedia. Periksa konfigurasi GOOGLE_SERVER_CLIENT_ID.',
      );
    }

    return _api.post(
      '/auth/google',
      data: {
        'idToken': idToken,
        'platform': 'android',
        'deviceName': 'OtakuPlay Android',
      },
      parser: (data) async {
        final map = data as Map<String, dynamic>;
        await _storage.saveTokens(
          accessToken: map['accessToken'].toString(),
          refreshToken: map['refreshToken'].toString(),
        );
        return UserModel.fromJson(map['user'] as Map<String, dynamic>);
      },
    ).then((futureUser) => futureUser);
  }

  Future<UserModel> loginWithPassword({
    required String identifier,
    required String password,
  }) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      data: {
        'identifier': identifier,
        'password': password,
        'platform': 'android',
        'deviceName': 'OtakuPlay Android',
      },
      parser: (data) => data as Map<String, dynamic>,
    );

    await _storage.saveTokens(
      accessToken: res['accessToken'].toString(),
      refreshToken: res['refreshToken'].toString(),
    );
    return UserModel.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<UserModel> registerWithPassword({
    required String email,
    required String username,
    required String displayName,
    required String password,
  }) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/auth/register',
      data: {
        'email': email,
        'username': username,
        'displayName': displayName,
        'password': password,
      },
      parser: (data) => data as Map<String, dynamic>,
    );

    await _storage.saveTokens(
      accessToken: res['accessToken'].toString(),
      refreshToken: res['refreshToken'].toString(),
    );
    return UserModel.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<UserModel> fetchMe() {
    return _api.get(
      '/users/me',
      parser: (data) => UserModel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> updateProfile(Map<String, dynamic> body) async {
    await _api.patch('/users/me', data: body, parser: (d) => d);
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await _api.post(
      '/auth/change-password',
      data: {'currentPassword': currentPassword, 'newPassword': newPassword},
      parser: (d) => d,
    );
  }

  Future<void> requestEmailChange(String newEmail) async {
    await _api.post(
      '/auth/change-email/request',
      data: {'newEmail': newEmail},
      parser: (d) => d,
    );
  }

  Future<void> logout() async {
    try {
      final refresh = await _storage.getRefreshToken();
      await _api.post('/auth/logout', data: {'refreshToken': refresh}, parser: (d) => d);
      await _googleSignIn.signOut();
    } catch (_) {
      // ignore network error on logout
    } finally {
      await _storage.clearTokens();
    }
  }

  Future<void> logoutAllDevices() async {
    await _api.post('/auth/logout-all', parser: (d) => d);
    await _storage.clearTokens();
  }

  Future<void> deleteAccount() async {
    await _api.delete('/users/me', parser: (d) => d);
    await _storage.clearTokens();
  }
}

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _accessTokenKey = 'op_access_token';
  static const _refreshTokenKey = 'op_refresh_token';
  static const _onboardingKey = 'op_onboarding_done';
  static const _aiHistoryKey = 'op_ai_history';

  final FlutterSecureStorage _secure = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _secure.write(key: _accessTokenKey, value: accessToken),
      _secure.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _secure.read(key: _accessTokenKey);
  Future<String?> getRefreshToken() => _secure.read(key: _refreshTokenKey);

  Future<void> clearTokens() async {
    await Future.wait([
      _secure.delete(key: _accessTokenKey),
      _secure.delete(key: _refreshTokenKey),
    ]);
  }

  Future<bool> isOnboardingCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  Future<void> setOnboardingCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, true);
  }

  Future<List<String>> getAiHistoryJson() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_aiHistoryKey) ?? [];
  }

  Future<void> saveAiHistoryJson(List<String> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_aiHistoryKey, items);
  }

  Future<void> clearAiHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_aiHistoryKey);
  }
}

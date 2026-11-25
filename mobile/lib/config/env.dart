import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  AppEnv._();

  static String get apiBaseUrl {
    const defined = String.fromEnvironment('API_BASE_URL');
    if (defined.isNotEmpty) return defined;
    return dotenv.env['API_BASE_URL'] ?? 'https://api.otakuplay.app/api/v1';
  }

  static String get socketUrl {
    const defined = String.fromEnvironment('SOCKET_URL');
    if (defined.isNotEmpty) return defined;
    return dotenv.env['SOCKET_URL'] ?? 'https://api.otakuplay.app';
  }

  static String get googleServerClientId {
    const defined = String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID');
    if (defined.isNotEmpty) return defined;
    return dotenv.env['GOOGLE_SERVER_CLIENT_ID'] ?? '';
  }

  static bool get animasuDirectFallback {
    return (dotenv.env['ANIMASU_DIRECT_FALLBACK'] ?? 'false').toLowerCase() == 'true';
  }
}

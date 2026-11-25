import 'package:dio/dio.dart';
import '../config/env.dart';
import '../core/errors.dart';
import '../core/storage_service.dart';

class ApiClient {
  final StorageService storage;
  late final Dio dio;
  bool _isRefreshing = false;

  ApiClient(this.storage) {
    dio = Dio(
      BaseOptions(
        baseUrl: AppEnv.apiBaseUrl,
        connectTimeout: const Duration(seconds: 12),
        receiveTimeout: const Duration(seconds: 20),
        sendTimeout: const Duration(seconds: 20),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await storage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 &&
              !_isRefreshing &&
              !error.requestOptions.path.contains('/auth/refresh') &&
              !error.requestOptions.path.contains('/auth/login') &&
              !error.requestOptions.path.contains('/auth/google')) {
            _isRefreshing = true;
            try {
              final refreshToken = await storage.getRefreshToken();
              if (refreshToken != null && refreshToken.isNotEmpty) {
                final refreshDio = Dio(BaseOptions(baseUrl: AppEnv.apiBaseUrl));
                final res = await refreshDio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );
                final data = res.data['data'] as Map<String, dynamic>?;
                final newAccess = data?['accessToken']?.toString();
                final newRefresh = data?['refreshToken']?.toString();

                if (newAccess != null && newRefresh != null) {
                  await storage.saveTokens(
                    accessToken: newAccess,
                    refreshToken: newRefresh,
                  );
                  error.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
                  final retried = await dio.fetch(error.requestOptions);
                  _isRefreshing = false;
                  handler.resolve(retried);
                  return;
                }
              }
            } catch (_) {
              await storage.clearTokens();
            } finally {
              _isRefreshing = false;
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    required T Function(dynamic data) parser,
  }) async {
    try {
      final res = await dio.get(path, queryParameters: queryParameters);
      return parser(res.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<T> post<T>(
    String path, {
    dynamic data,
    required T Function(dynamic data) parser,
  }) async {
    try {
      final res = await dio.post(path, data: data);
      return parser(res.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<T> patch<T>(
    String path, {
    dynamic data,
    required T Function(dynamic data) parser,
  }) async {
    try {
      final res = await dio.patch(path, data: data);
      return parser(res.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<T> delete<T>(
    String path, {
    required T Function(dynamic data) parser,
  }) async {
    try {
      final res = await dio.delete(path);
      return parser(res.data['data']);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }
}

import 'package:dio/dio.dart';

class AppException implements Exception {
  final String message;
  final int? statusCode;
  final String? code;

  const AppException(this.message, {this.statusCode, this.code});

  factory AppException.fromDio(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return const AppException('Koneksi timeout. Periksa jaringan internet kamu.');
    }
    if (e.type == DioExceptionType.connectionError) {
      return const AppException('Tidak dapat terhubung ke server OtakuPlay.');
    }
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      return AppException(
        data['message']?.toString() ?? 'Terjadi kesalahan pada server.',
        statusCode: e.response?.statusCode,
        code: data['code']?.toString(),
      );
    }
    return AppException(
      e.message ?? 'Terjadi kesalahan jaringan.',
      statusCode: e.response?.statusCode,
    );
  }

  @override
  String toString() => message;
}

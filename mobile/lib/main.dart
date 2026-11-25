import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'routing/app_router.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: '.env.example');
  } catch (_) {}

  runApp(const ProviderScope(child: OtakuPlayApp()));
}

class OtakuPlayApp extends StatelessWidget {
  const OtakuPlayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'OtakuPlay',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: appRouter,
    );
  }
}

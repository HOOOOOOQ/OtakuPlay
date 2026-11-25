import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/otaku_logo.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await Future<void>.delayed(const Duration(milliseconds: 1100));
    if (!mounted) return;
    final storage = ref.read(storageServiceProvider);
    final onboarded = await storage.isOnboardingCompleted();
    if (!mounted) return;
    if (!onboarded) {
      context.go('/onboarding');
      return;
    }
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/banners/splash_bg.png', fit: BoxFit.cover),
          Container(color: AppColors.background.withValues(alpha: 0.35)),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const OtakuPlayLogo(height: 52),
                const SizedBox(height: 14),
                const Text(
                  'Your Anime. Your Community. Your Universe.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.secondary,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 36),
                SizedBox(
                  width: 30,
                  height: 30,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppColors.accent.withValues(alpha: 0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

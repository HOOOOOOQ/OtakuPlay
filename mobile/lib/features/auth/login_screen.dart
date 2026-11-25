import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';
import '../../widgets/otaku_logo.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _identifierCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _displayNameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showEmailForm = false;
  bool _isRegister = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _emailCtrl.dispose();
    _usernameCtrl.dispose();
    _displayNameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _googleSignIn() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).loginWithGoogle();
      if (mounted) context.go('/home');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _submitEmailAuth() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final notifier = ref.read(authProvider.notifier);
      if (_isRegister) {
        await notifier.registerWithPassword(
          email: _emailCtrl.text.trim(),
          username: _usernameCtrl.text.trim(),
          displayName: _displayNameCtrl.text.trim(),
          password: _passwordCtrl.text,
        );
      } else {
        await notifier.loginWithPassword(
          _identifierCtrl.text.trim(),
          _passwordCtrl.text,
        );
      }
      if (mounted) context.go('/home');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/banners/login_bg.png', fit: BoxFit.cover),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppColors.background.withValues(alpha: 0.45),
                  AppColors.background.withValues(alpha: 0.96),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const OtakuPlayLogo(height: 44),
                    const SizedBox(height: 10),
                    const Text(
                      'Your Anime. Your Community. Your Universe.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppColors.secondary),
                    ),
                    const SizedBox(height: 36),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surface.withValues(alpha: 0.92),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: AppColors.border),
                        boxShadow: AppColors.subtlePurpleGlow,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'Masuk ke OtakuPlay',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Sinkronkan riwayat tontonan, XP, komunitas, dan obrolan kamu.',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: _busy ? null : _googleSignIn,
                            icon: const Icon(Icons.g_mobiledata_rounded, size: 28),
                            label: Text(_busy ? 'Memproses...' : 'Continue with Google'),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: _busy
                                ? null
                                : () => setState(() => _showEmailForm = !_showEmailForm),
                            child: Text(
                              _showEmailForm
                                  ? 'Tutup Form Email'
                                  : 'Masuk / Daftar dengan Email',
                            ),
                          ),
                          if (_showEmailForm) ...[
                            const SizedBox(height: 16),
                            if (_isRegister) ...[
                              TextField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(hintText: 'Email'),
                              ),
                              const SizedBox(height: 10),
                              TextField(
                                controller: _usernameCtrl,
                                decoration: const InputDecoration(hintText: 'Username unik'),
                              ),
                              const SizedBox(height: 10),
                              TextField(
                                controller: _displayNameCtrl,
                                decoration: const InputDecoration(hintText: 'Nama Tampilan'),
                              ),
                            ] else
                              TextField(
                                controller: _identifierCtrl,
                                decoration:
                                    const InputDecoration(hintText: 'Email atau Username'),
                              ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _passwordCtrl,
                              obscureText: true,
                              decoration: const InputDecoration(hintText: 'Kata Sandi'),
                            ),
                            const SizedBox(height: 14),
                            ElevatedButton(
                              onPressed: _busy ? null : _submitEmailAuth,
                              child: Text(_isRegister ? 'Buat Akun' : 'Masuk'),
                            ),
                            TextButton(
                              onPressed: () => setState(() => _isRegister = !_isRegister),
                              child: Text(
                                _isRegister
                                    ? 'Sudah punya akun? Masuk'
                                    : 'Belum punya akun? Daftar',
                                style: const TextStyle(color: AppColors.secondary, fontSize: 12),
                              ),
                            ),
                          ],
                          if (_error != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.error.withValues(alpha: 0.14),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                _error!,
                                style: const TextStyle(color: AppColors.error, fontSize: 12),
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () => context.go('/home'),
                            child: const Text(
                              'Jelajahi sebagai Tamu',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

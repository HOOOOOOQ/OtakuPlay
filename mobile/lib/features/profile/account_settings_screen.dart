import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';

class AccountSettingsScreen extends ConsumerStatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  ConsumerState<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends ConsumerState<AccountSettingsScreen> {
  late bool _showOnline;
  late bool _showWatchHistory;
  late String _allowDm;

  @override
  void initState() {
    super.initState();
    final privacy = ref.read(authProvider).user?.privacySettings;
    _showOnline = privacy?.showOnlineStatus ?? true;
    _showWatchHistory = privacy?.showWatchHistory ?? true;
    _allowDm = privacy?.allowPrivateMessages ?? 'everyone';
  }

  Future<void> _savePrivacy() async {
    await ref.read(authServiceProvider).updateProfile({
      'privacySettings': {
        'showOnlineStatus': _showOnline,
        'showWatchHistory': _showWatchHistory,
        'allowPrivateMessages': _allowDm,
      },
    });
    await ref.read(authProvider.notifier).refreshProfile();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pengaturan privasi diperbarui')),
      );
    }
  }

  void _openChangePassword() {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Ubah Kata Sandi'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentCtrl,
              obscureText: true,
              decoration: const InputDecoration(hintText: 'Kata sandi saat ini'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: newCtrl,
              obscureText: true,
              decoration: const InputDecoration(hintText: 'Kata sandi baru (min 8 karakter)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              try {
                await ref
                    .read(authServiceProvider)
                    .changePassword(currentCtrl.text, newCtrl.text);
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Kata sandi berhasil diubah')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const Scaffold();

    return Scaffold(
      appBar: AppBar(title: const Text('Pengaturan Akun & Privasi')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('Tampilkan Status Online'),
            value: _showOnline,
            activeThumbColor: AppColors.primary,
            onChanged: (v) {
              setState(() => _showOnline = v);
              _savePrivacy();
            },
          ),
          SwitchListTile(
            title: const Text('Tampilkan Riwayat Tontonan di Profil'),
            value: _showWatchHistory,
            activeThumbColor: AppColors.primary,
            onChanged: (v) {
              setState(() => _showWatchHistory = v);
              _savePrivacy();
            },
          ),
          ListTile(
            title: const Text('Siapa yang dapat mengirim pesan pribadi'),
            trailing: DropdownButton<String>(
              value: _allowDm,
              dropdownColor: AppColors.surface,
              items: const [
                DropdownMenuItem(value: 'everyone', child: Text('Semua')),
                DropdownMenuItem(value: 'followers', child: Text('Pengikut')),
                DropdownMenuItem(value: 'nobody', child: Text('Tidak Ada')),
              ],
              onChanged: (v) {
                if (v == null) return;
                setState(() => _allowDm = v);
                _savePrivacy();
              },
            ),
          ),
          const Divider(height: 28),
          if (user.hasPassword)
            ListTile(
              leading: const Icon(Icons.password_rounded),
              title: const Text('Ubah Kata Sandi'),
              onTap: _openChangePassword,
            ),
          ListTile(
            leading: const Icon(Icons.devices_rounded),
            title: const Text('Keluar dari Semua Perangkat'),
            onTap: () async {
              await ref.read(authServiceProvider).logoutAllDevices();
              if (context.mounted) context.go('/login');
            },
          ),
          ListTile(
            leading: const Icon(Icons.delete_forever_rounded, color: AppColors.error),
            title: const Text('Hapus Akun Permanen', style: TextStyle(color: AppColors.error)),
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  backgroundColor: AppColors.surface,
                  title: const Text('Hapus Akun?'),
                  content: const Text(
                    'Tindakan ini permanen dan menghapus akses akun Anda di semua perangkat.',
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Hapus Permanen'),
                    ),
                  ],
                ),
              );
              if (confirm == true) {
                await ref.read(authServiceProvider).deleteAccount();
                if (context.mounted) context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }
}

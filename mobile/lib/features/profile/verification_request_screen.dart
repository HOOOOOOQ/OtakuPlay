import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/app_providers.dart';
import '../../theme/app_colors.dart';

class VerificationRequestScreen extends ConsumerStatefulWidget {
  const VerificationRequestScreen({super.key});

  @override
  ConsumerState<VerificationRequestScreen> createState() => _VerificationRequestScreenState();
}

class _VerificationRequestScreenState extends ConsumerState<VerificationRequestScreen> {
  final _nameCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  final _linkCtrl = TextEditingController();
  String _category = 'creator';
  bool _loading = true;
  bool _isVerified = false;
  String? _status;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _reasonCtrl.dispose();
    _linkCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadStatus() async {
    try {
      final res = await ref.read(toolsServiceProvider).getVerificationStatus();
      setState(() {
        _isVerified = res.isVerified;
        _status = res.pendingStatus;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    try {
      await ref.read(toolsServiceProvider).submitVerificationRequest(
            fullName: _nameCtrl.text.trim(),
            category: _category,
            reason: _reasonCtrl.text.trim(),
            portfolioLinks:
                _linkCtrl.text.trim().isNotEmpty ? [_linkCtrl.text.trim()] : const [],
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Permohonan verifikasi berhasil dikirim!')),
        );
      }
      _loadStatus();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verifikasi Centang Biru')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.verified_rounded, color: AppColors.verifiedBlue),
                          SizedBox(width: 8),
                          Text(
                            'Status Verifikasi Akun',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isVerified
                            ? 'Akun Anda telah terverifikasi resmi oleh tim OtakuPlay.'
                            : _status == 'pending'
                                ? 'Permohonan verifikasi Anda sedang ditinjau oleh Admin.'
                                : 'Ajukan verifikasi identitas kreator atau tokoh komunitas. Persetujuan dilakukan manual oleh Admin.',
                        style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                if (!_isVerified && _status != 'pending') ...[
                  const SizedBox(height: 18),
                  TextField(
                    controller: _nameCtrl,
                    decoration: const InputDecoration(labelText: 'Nama Lengkap / Nama Kreator'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _category,
                    dropdownColor: AppColors.surface,
                    decoration: const InputDecoration(labelText: 'Kategori'),
                    items: const [
                      DropdownMenuItem(value: 'creator', child: Text('Content Creator')),
                      DropdownMenuItem(value: 'community_leader', child: Text('Community Leader')),
                      DropdownMenuItem(value: 'cosplayer', child: Text('Cosplayer')),
                      DropdownMenuItem(value: 'reviewer', child: Text('Anime Reviewer')),
                      DropdownMenuItem(value: 'other', child: Text('Lainnya')),
                    ],
                    onChanged: (v) => setState(() => _category = v ?? 'creator'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _reasonCtrl,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'Alasan & Kontribusi Komunitas (min 20 karakter)',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _linkCtrl,
                    decoration: const InputDecoration(labelText: 'Tautan Portofolio / Sosial Media'),
                  ),
                  const SizedBox(height: 18),
                  ElevatedButton(
                    onPressed: _submit,
                    child: const Text('Ajukan Verifikasi Biru'),
                  ),
                ],
              ],
            ),
    );
  }
}

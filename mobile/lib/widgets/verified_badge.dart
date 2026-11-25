import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class VerifiedBadge extends StatelessWidget {
  final double size;

  const VerifiedBadge({super.key, this.size = 16});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'Akun Terverifikasi OtakuPlay',
      child: Icon(
        Icons.verified_rounded,
        size: size,
        color: AppColors.verifiedBlue,
      ),
    );
  }
}

import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color background = Color(0xFF090811);
  static const Color surface = Color(0xFF12111D);
  static const Color secondarySurface = Color(0xFF1B1928);
  static const Color primary = Color(0xFF8B5CF6);
  static const Color secondary = Color(0xFFA78BFA);
  static const Color accent = Color(0xFFC084FC);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFA5A1B5);
  static const Color success = Color(0xFF22C55E);
  static const Color error = Color(0xFFEF4444);
  static const Color verifiedBlue = Color(0xFF38BDF8);
  static const Color border = Color(0xFF262338);

  static const LinearGradient violetGlowGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, primary, Color(0xFF6D28D9)],
  );

  static List<BoxShadow> get subtlePurpleGlow => [
        BoxShadow(
          color: primary.withValues(alpha: 0.22),
          blurRadius: 20,
          spreadRadius: 1,
          offset: const Offset(0, 6),
        ),
      ];
}

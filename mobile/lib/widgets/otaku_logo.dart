import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class OtakuPlayLogo extends StatelessWidget {
  final double height;
  final bool iconOnly;

  const OtakuPlayLogo({super.key, this.height = 32, this.iconOnly = false});

  @override
  Widget build(BuildContext context) {
    if (iconOnly) {
      return SvgPicture.asset(
        'assets/logos/otakuplay_icon.svg',
        height: height,
        width: height,
      );
    }
    return SvgPicture.asset(
      'assets/logos/otakuplay_logo.svg',
      height: height,
      fit: BoxFit.contain,
    );
  }
}

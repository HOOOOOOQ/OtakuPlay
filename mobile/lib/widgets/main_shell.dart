import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/haptics.dart';
import '../theme/app_colors.dart';

class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    final currentIndex = navigationShell.currentIndex;

    return Scaffold(
      body: navigationShell,
      floatingActionButton: currentIndex <= 1
          ? FloatingActionButton.small(
              heroTag: 'quick_search_fab',
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              elevation: 4,
              onPressed: () {
                AppHaptics.light();
                context.push('/anime/search');
              },
              tooltip: 'Cari Anime',
              child: const Icon(Icons.search_rounded),
            )
          : null,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border, width: 1)),
        ),
        child: NavigationBar(
          height: 68,
          backgroundColor: AppColors.surface,
          indicatorColor: AppColors.primary.withValues(alpha: 0.22),
          selectedIndex: currentIndex,
          onDestinationSelected: (idx) {
            AppHaptics.selection();
            navigationShell.goBranch(
              idx,
              initialLocation: idx == navigationShell.currentIndex,
            );
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded, color: AppColors.accent),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.play_circle_outline_rounded),
              selectedIcon: Icon(Icons.play_circle_rounded, color: AppColors.accent),
              label: 'Anime',
            ),
            NavigationDestination(
              icon: Icon(Icons.explore_outlined),
              selectedIcon: Icon(Icons.explore_rounded, color: AppColors.accent),
              label: 'Community',
            ),
            NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline_rounded),
              selectedIcon: Icon(Icons.chat_bubble_rounded, color: AppColors.accent),
              label: 'Inbox',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded, color: AppColors.accent),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

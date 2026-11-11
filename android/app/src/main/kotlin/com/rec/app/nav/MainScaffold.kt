package com.rec.app.nav

import androidx.annotation.StringRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Style
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.rec.app.R
import com.rec.app.di.LocalAppContainer
import com.rec.app.di.ViewModelFactory
import com.rec.app.ui.components.GlassNavBar
import com.rec.app.ui.components.GlassNavBarHeight
import com.rec.app.ui.components.LocalBottomBarInset
import com.rec.app.ui.components.NavItem
import com.rec.app.ui.screens.dictionary.DictionaryRoute
import com.rec.app.ui.screens.dictionary.DictionaryViewModel
import com.rec.app.ui.screens.home.HomeRoute
import com.rec.app.ui.screens.home.HomeViewModel
import com.rec.app.ui.screens.lesson.LessonRoute
import com.rec.app.ui.screens.lesson.LessonViewModel
import com.rec.app.ui.screens.profile.ProfileRoute
import com.rec.app.ui.screens.profile.ProfileViewModel
import com.rec.app.ui.screens.vocabulary.FlashcardsRoute
import com.rec.app.ui.screens.vocabulary.FlashcardsViewModel
import com.rec.app.ui.theme.Motion
import com.rec.app.ui.theme.RecTheme

private data class BottomTab(val route: String, @StringRes val labelRes: Int, val icon: ImageVector)

private val bottomTabs = listOf(
    BottomTab(Routes.HOME, R.string.nav_home, Icons.Filled.AutoStories),
    BottomTab(Routes.VOCABULARY, R.string.nav_vocabulary, Icons.Filled.Style),
    BottomTab(Routes.PROFILE, R.string.nav_profile, Icons.Filled.Person),
)

/** Switches top-level tabs the standard way: one copy of each, state kept across switches. */
private fun NavHostController.navigateToTab(route: String) = navigate(route) {
    popUpTo(graph.findStartDestination().id) { saveState = true }
    launchSingleTop = true
    restoreState = true
}

@Composable
fun MainScaffold() {
    val container = LocalAppContainer.current
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val destination = backStackEntry?.destination
    val selectedTab = bottomTabs.indexOfFirst { tab -> destination?.hierarchy?.any { it.route == tab.route } == true }
    // The bar belongs to the tabs only; pushed screens (lesson, flashcards) take the full height.
    val showBottomBar = destination == null || selectedTab >= 0
    val navItems = bottomTabs.map { NavItem(it.icon, stringResource(it.labelRes)) }

    val systemNavInset = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    // The bar floats over the content instead of sitting in its own strip, so
    // nothing behind it is cut off; tab screens pad their scrolling content by
    // LocalBottomBarInset to let the last item clear it.
    Box(modifier = Modifier.fillMaxSize().background(RecTheme.colors.ground)) {
      CompositionLocalProvider(LocalBottomBarInset provides GlassNavBarHeight + systemNavInset) {
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.fillMaxSize().statusBarsPadding(),
            // Tabs are peers, so they crossfade; pushed screens override this with a slide.
            enterTransition = { fadeIn(Motion.base()) },
            exitTransition = { fadeOut(Motion.fast()) },
            popEnterTransition = { fadeIn(Motion.base()) },
            popExitTransition = { fadeOut(Motion.fast()) },
        ) {
            composable(Routes.HOME) {
                val viewModel: HomeViewModel = viewModel(factory = ViewModelFactory { HomeViewModel(container.getHomeOverview, container.userRepository) })
                HomeRoute(
                    viewModel = viewModel,
                    onLessonClick = { navController.navigate(Routes.lesson(it)) },
                    onProfileClick = { navController.navigateToTab(Routes.PROFILE) },
                )
            }
            composable(Routes.VOCABULARY) {
                val viewModel: DictionaryViewModel = viewModel(
                    factory = ViewModelFactory { DictionaryViewModel(container.vocabularyRepository, container.userRepository) },
                )
                DictionaryRoute(viewModel = viewModel, onOpenFlashcards = { navController.navigate(Routes.FLASHCARDS) })
            }
            composable(Routes.PROFILE) {
                val viewModel: ProfileViewModel = viewModel(
                    factory = ViewModelFactory {
                        ProfileViewModel(container.getProfileOverview, container.userRepository, container.authRepository)
                    },
                )
                ProfileRoute(viewModel = viewModel)
            }
            composable(
                Routes.FLASHCARDS,
                // A deck opened from the dictionary: it slides in from the side and back out.
                enterTransition = { slideInHorizontally(Motion.slow()) { it / 4 } + fadeIn(Motion.base()) },
                popExitTransition = { slideOutHorizontally(Motion.base()) { it / 4 } + fadeOut(Motion.fast()) },
            ) {
                val viewModel: FlashcardsViewModel = viewModel(
                    factory = ViewModelFactory { FlashcardsViewModel(container.vocabularyRepository) },
                )
                Box(Modifier.navigationBarsPadding()) {
                    FlashcardsRoute(viewModel = viewModel, onBack = { navController.popBackStack() })
                }
            }
            composable(
                Routes.LESSON,
                // A lesson is a focused session on top of the path: it rises like a sheet.
                enterTransition = { slideInVertically(Motion.slow()) { it / 6 } + fadeIn(Motion.base()) },
                popExitTransition = { slideOutVertically(Motion.base()) { it / 6 } + fadeOut(Motion.fast()) },
            ) { entry ->
                val lessonId = entry.arguments?.getString(Routes.LESSON_ID_ARG) ?: return@composable
                val viewModel: LessonViewModel = viewModel(
                    factory = ViewModelFactory { LessonViewModel(container.contentRepository, container.userRepository) },
                )
                Box(Modifier.navigationBarsPadding()) {
                    LessonRoute(lessonId = lessonId, viewModel = viewModel, onClose = { navController.popBackStack() })
                }
            }
        }
      }

        AnimatedVisibility(
            visible = showBottomBar,
            modifier = Modifier.align(Alignment.BottomCenter),
            enter = slideInVertically(Motion.base()) { it } + fadeIn(Motion.base()),
            exit = slideOutVertically(Motion.base()) { it } + fadeOut(Motion.fast()),
        ) {
            GlassNavBar(
                items = navItems,
                selectedIndex = selectedTab.coerceAtLeast(0),
                onSelect = { index ->
                    if (index != selectedTab) navController.navigateToTab(bottomTabs[index].route)
                },
            )
        }
    }
}

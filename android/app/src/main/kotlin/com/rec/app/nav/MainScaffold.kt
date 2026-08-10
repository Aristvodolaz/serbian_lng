package com.rec.app.nav

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Style
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rec.app.di.LocalAppContainer
import com.rec.app.di.ViewModelFactory
import com.rec.app.ui.screens.home.HomeScreen
import com.rec.app.ui.screens.home.HomeViewModel
import com.rec.app.ui.screens.lesson.LessonScreen
import com.rec.app.ui.screens.lesson.LessonViewModel
import com.rec.app.ui.screens.profile.ProfileScreen
import com.rec.app.ui.screens.profile.ProfileViewModel
import com.rec.app.ui.screens.vocabulary.VocabularyScreen
import com.rec.app.ui.screens.vocabulary.VocabularyViewModel

private data class BottomTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

private val bottomTabs = listOf(
    BottomTab(Routes.HOME, "Учење", Icons.Filled.AutoStories),
    BottomTab(Routes.VOCABULARY, "Речник", Icons.Filled.Style),
    BottomTab(Routes.PROFILE, "Профил", Icons.Filled.Person),
)

@Composable
fun MainScaffold(onLoggedOut: () -> Unit) {
    val container = LocalAppContainer.current
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination
    val showBottomBar = bottomTabs.any { tab -> currentRoute?.hierarchy?.any { it.route == tab.route } == true }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomTabs.forEach { tab ->
                        val selected = currentRoute?.hierarchy?.any { it.route == tab.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.HOME) {
                val vm: HomeViewModel = viewModel(
                    factory = ViewModelFactory { HomeViewModel(container.contentRepository, container.userRepository) },
                )
                HomeScreen(viewModel = vm, onLessonClick = { navController.navigate(Routes.lesson(it)) })
            }
            composable(Routes.VOCABULARY) {
                val vm: VocabularyViewModel = viewModel(
                    factory = ViewModelFactory { VocabularyViewModel(container.vocabularyRepository) },
                )
                VocabularyScreen(viewModel = vm)
            }
            composable(Routes.PROFILE) {
                val vm: ProfileViewModel = viewModel(
                    factory = ViewModelFactory {
                        ProfileViewModel(container.userRepository, container.badgesRepository, container.authRepository)
                    },
                )
                ProfileScreen(viewModel = vm, onLoggedOut = onLoggedOut)
            }
            composable(Routes.LESSON) { entry ->
                val lessonId = entry.arguments?.getString("lessonId") ?: return@composable
                val vm: LessonViewModel = viewModel(
                    factory = ViewModelFactory { LessonViewModel(container.contentRepository) },
                )
                LessonScreen(
                    lessonId = lessonId,
                    viewModel = vm,
                    onClose = { navController.popBackStack() },
                    onFinished = { navController.popBackStack() },
                )
            }
        }
    }
}

package com.rec.app.ui

import com.rec.app.FakeContentRepository
import com.rec.app.FakeUserRepository
import com.rec.app.domain.model.LessonStatus
import com.rec.app.domain.usecase.GetHomeOverviewUseCase
import com.rec.app.lessonSummary
import com.rec.app.pathOf
import com.rec.app.ui.components.LessonPathStatus
import com.rec.app.ui.screens.home.HomeViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import java.io.IOException

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {
    private val content = FakeContentRepository(
        Result.success(
            pathOf(
                lessonSummary("2", LessonStatus.CURRENT, order = 1),
                lessonSummary("1", LessonStatus.DONE, order = 0),
                lessonSummary("3", LessonStatus.LOCKED, order = 2),
                checkpoint = lessonSummary("cp", LessonStatus.LOCKED),
            ),
        ),
    )
    private val users = FakeUserRepository()
    private lateinit var viewModel: HomeViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        viewModel = HomeViewModel(GetHomeOverviewUseCase(content, users), users)
    }

    @After
    fun tearDown() = Dispatchers.resetMain()

    @Test
    fun `refresh orders lessons, appends the checkpoint and picks the next lesson`() = runTest {
        viewModel.refresh()

        val loaded = viewModel.state.value.content
        assertNotNull(loaded)
        val lessons = loaded!!.units.single().lessons
        assertEquals(listOf("1", "2", "3", "cp"), lessons.map { it.id })
        assertEquals("2", loaded.nextLesson?.id)
        assertEquals(1, loaded.completedLessons)
        assertEquals(4, loaded.totalLessons)
        assertEquals(LessonPathStatus.DONE, lessons.first().status)
        // The test user's language is English, so translations come from the English field.
        assertEquals("Lesson 1", lessons.first().titleTranslation)
        assertFalse(viewModel.state.value.isLoading)
    }

    @Test
    fun `a language change re-renders the loaded path without a reload`() = runTest {
        viewModel.refresh()

        users.user.value = users.user.value?.copy(languagePreference = "ru")

        assertEquals("Урок 1", viewModel.state.value.content!!.units.single().lessons.first().titleTranslation)
    }

    @Test
    fun `a failed first load reports an error and no content`() = runTest {
        content.path = Result.failure(IOException())

        viewModel.refresh()

        assertNull(viewModel.state.value.content)
        assertNotNull(viewModel.state.value.error)
    }

    @Test
    fun `a failed refresh keeps the content that is already on screen`() = runTest {
        viewModel.refresh()
        content.path = Result.failure(IOException())

        viewModel.refresh()

        assertNotNull(viewModel.state.value.content)
        assertFalse(viewModel.state.value.isLoading)
    }
}

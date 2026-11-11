package com.rec.app.domain

import com.rec.app.FakeBadgesRepository
import com.rec.app.FakeContentRepository
import com.rec.app.FakeUserRepository
import com.rec.app.domain.model.EarnedBadge
import com.rec.app.domain.model.LessonStatus
import com.rec.app.domain.usecase.GetHomeOverviewUseCase
import com.rec.app.domain.usecase.GetProfileOverviewUseCase
import com.rec.app.lessonSummary
import com.rec.app.pathOf
import com.rec.app.testUser
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

class OverviewUseCasesTest {
    private val path = pathOf(lessonSummary("1", LessonStatus.CURRENT))

    @Test
    fun `home overview combines the path and the user`() = runTest {
        val useCase = GetHomeOverviewUseCase(FakeContentRepository(Result.success(path)), FakeUserRepository())

        val overview = useCase().getOrThrow()

        assertEquals(path, overview.path)
        assertEquals(testUser, overview.user)
    }

    @Test
    fun `home overview fails when either half fails`() = runTest {
        val noPath = GetHomeOverviewUseCase(FakeContentRepository(Result.failure(IOException())), FakeUserRepository())
        val noUser = GetHomeOverviewUseCase(FakeContentRepository(Result.success(path)), FakeUserRepository(me = Result.failure(IOException())))

        assertTrue(noPath().isFailure)
        assertTrue(noUser().isFailure)
    }

    @Test
    fun `profile overview survives a failed badge request`() = runTest {
        val useCase = GetProfileOverviewUseCase(FakeUserRepository(), FakeBadgesRepository(Result.failure(IOException())))

        val overview = useCase().getOrThrow()

        assertEquals(testUser, overview.user)
        assertTrue(overview.badges.isEmpty())
    }

    @Test
    fun `profile overview includes badges and fails without stats`() = runTest {
        val badge = EarnedBadge("Значка", "Značka")
        val withBadges = GetProfileOverviewUseCase(FakeUserRepository(), FakeBadgesRepository(Result.success(listOf(badge))))
        val noStats = GetProfileOverviewUseCase(
            FakeUserRepository(stats = Result.failure(IOException())),
            FakeBadgesRepository(Result.success(emptyList())),
        )

        assertEquals(listOf(badge), withBadges().getOrThrow().badges)
        assertTrue(noStats().isFailure)
    }
}

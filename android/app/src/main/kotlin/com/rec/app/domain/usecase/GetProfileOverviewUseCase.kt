package com.rec.app.domain.usecase

import com.rec.app.domain.model.ProfileOverview
import com.rec.app.domain.repository.BadgesRepository
import com.rec.app.domain.repository.UserRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

/**
 * Loads the profile in four parallel requests instead of four sequential ones.
 * User, stats and week are required; a failed badge request only leaves the
 * badge row empty.
 */
class GetProfileOverviewUseCase(
    private val userRepository: UserRepository,
    private val badgesRepository: BadgesRepository,
) {
    suspend operator fun invoke(): Result<ProfileOverview> = coroutineScope {
        val user = async { userRepository.getMe() }
        val stats = async { userRepository.getStats() }
        val week = async { userRepository.getWeek() }
        val badges = async { badgesRepository.getMyBadges() }
        val userResult = user.await()
        val statsResult = stats.await()
        val weekResult = week.await()
        val badgesResult = badges.await()
        userResult.mapCatching {
            ProfileOverview(
                user = it,
                stats = statsResult.getOrThrow(),
                week = weekResult.getOrThrow(),
                badges = badgesResult.getOrDefault(emptyList()),
            )
        }
    }
}

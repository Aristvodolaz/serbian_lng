package com.rec.app.domain.usecase

import com.rec.app.domain.model.HomeOverview
import com.rec.app.domain.repository.ContentRepository
import com.rec.app.domain.repository.UserRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

class GetHomeOverviewUseCase(
    private val contentRepository: ContentRepository,
    private val userRepository: UserRepository,
) {
    suspend operator fun invoke(): Result<HomeOverview> = coroutineScope {
        val path = async { contentRepository.getPath() }
        val user = async { userRepository.getMe() }
        val pathResult = path.await()
        val userResult = user.await()
        pathResult.mapCatching { HomeOverview(it, userResult.getOrThrow()) }
    }
}

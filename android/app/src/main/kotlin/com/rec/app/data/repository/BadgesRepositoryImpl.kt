package com.rec.app.data.repository

import com.rec.app.data.mapper.toDomain
import com.rec.app.data.remote.RecApi
import com.rec.app.domain.model.EarnedBadge
import com.rec.app.domain.repository.BadgesRepository

class BadgesRepositoryImpl(private val api: RecApi) : BadgesRepository {
    override suspend fun getMyBadges(): Result<List<EarnedBadge>> =
        runCatching { api.getMyBadges().map { it.toDomain() } }
}

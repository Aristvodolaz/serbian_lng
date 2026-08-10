package com.rec.app.data.repository

import com.rec.app.data.remote.RecApi
import com.rec.app.data.remote.dto.BadgeDto
import com.rec.app.data.remote.dto.EarnedBadgeDto

class BadgesRepository(private val api: RecApi) {
    suspend fun getCatalog(): Result<List<BadgeDto>> = runCatching { api.getBadgeCatalog() }
    suspend fun getMyBadges(): Result<List<EarnedBadgeDto>> = runCatching { api.getMyBadges() }
}

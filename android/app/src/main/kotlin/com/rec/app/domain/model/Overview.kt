package com.rec.app.domain.model

data class HomeOverview(val path: Path, val user: User)

data class ProfileOverview(
    val user: User,
    val stats: UserStats,
    val week: List<DayActivity>,
    val badges: List<EarnedBadge>,
)

package com.rec.app.domain.model

/** The lesson sits in a section whose checkpoint has not been passed yet. */
class SectionLockedException : RuntimeException("SECTION_LOCKED")

/** Failures the auth screens need to tell apart; transport details stay in the data layer. */
sealed class AuthException : RuntimeException() {
    data object InvalidCredentials : AuthException()
    data object EmailTaken : AuthException()
    data class Server(val code: Int) : AuthException()
    data object Network : AuthException()
}

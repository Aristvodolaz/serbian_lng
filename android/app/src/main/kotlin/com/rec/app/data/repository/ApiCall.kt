package com.rec.app.data.repository

import kotlinx.coroutines.CancellationException

internal inline fun <T> apiCall(block: () -> T): Result<T> = try {
    Result.success(block())
} catch (e: CancellationException) {
    throw e
} catch (e: Exception) {
    Result.failure(e)
}

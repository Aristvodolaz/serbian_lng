package com.rec.app

import android.app.Application
import com.rec.app.di.AppContainer

class RecApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}

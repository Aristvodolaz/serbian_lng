package com.rec.app.ui.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

// Layout, shape, elevation and motion tokens. Components and screens take
// their numbers from here so the same rhythm holds across the app.

/** 4dp-based spacing scale. */
object Spacing {
    val xxs = 2.dp
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val xl = 20.dp
    val xxl = 24.dp
    val xxxl = 32.dp

    /** Horizontal inset of screen content. */
    val screen = 20.dp
}

/** Corner radii: the reference UI is soft, so even the smallest step is generous. */
object Radius {
    val sm = 12.dp
    val md = 18.dp
    val lg = 24.dp
    val xl = 28.dp
}

/** Fully rounded capsule for buttons, chips and the navigation bar. */
val PillShape = RoundedCornerShape(percent = 50)

val RecShapes = Shapes(
    extraSmall = RoundedCornerShape(Radius.sm),
    small = RoundedCornerShape(Radius.sm),
    medium = RoundedCornerShape(Radius.md),
    large = RoundedCornerShape(Radius.lg),
    extraLarge = RoundedCornerShape(Radius.xl),
)

object Elevation {
    /** Resting cards and list rows. */
    val card = 3.dp
    /** Primary buttons and hero cards. */
    val raised = 8.dp
    /** The floating navigation bar. */
    val floating = 16.dp
}

object Sizes {
    /** Minimum interactive size. */
    val touchTarget = 48.dp
    val button = 56.dp
    val avatar = 48.dp
    val navItem = 52.dp
    val icon = 22.dp
}

/** Durations in milliseconds and the shared easing/springs. */
object Motion {
    /** State changes inside a control: color, alpha. */
    const val Fast = 160
    /** Most transitions: content swaps, expanding elements. */
    const val Base = 240
    /** Screen-level entrances. */
    const val Slow = 360

    /** Quick out, gentle settle. */
    val Emphasized = CubicBezierEasing(0.2f, 0f, 0f, 1f)

    fun <T> fast(): FiniteAnimationSpec<T> = tween(Fast, easing = Emphasized)
    fun <T> base(): FiniteAnimationSpec<T> = tween(Base, easing = Emphasized)
    fun <T> slow(): FiniteAnimationSpec<T> = tween(Slow, easing = Emphasized)

    /** Press feedback: a small overshoot so controls feel physical. */
    val Press = spring<Float>(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium)

    /** Selection and layout changes that should settle without bounce. */
    fun <T> settle() = spring<T>(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMediumLow)
}

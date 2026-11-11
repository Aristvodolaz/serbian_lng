package com.rec.app.data

import com.rec.app.data.mapper.toDomain
import com.rec.app.data.remote.dto.ExerciseAnswerDto
import com.rec.app.data.remote.dto.ExercisePayloadDto
import com.rec.app.data.remote.dto.ExercisePublicDto
import com.rec.app.data.remote.dto.ExerciseTextDto
import com.rec.app.data.remote.dto.LessonDetailResponse
import com.rec.app.data.remote.dto.LessonSummaryDto
import com.rec.app.data.remote.dto.PathResponse
import com.rec.app.data.remote.dto.SectionPathDto
import com.rec.app.data.remote.dto.UnitPathDto
import com.rec.app.domain.model.LessonStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MappersTest {
    private fun lessonDto(id: String, status: String) = LessonSummaryDto(
        id = id,
        title = "t",
        titleLatin = "t",
        titleTranslationRu = "ru",
        titleTranslationEn = "en",
        order = 0,
        xpReward = 10,
        status = status,
    )

    @Test
    fun `lesson status strings map to the enum and unknown values lock the lesson`() {
        val path = PathResponse(
            listOf(
                SectionPathDto(
                    id = "s",
                    titleCyrillic = "c",
                    titleLatin = "l",
                    titleTranslationRu = "ru",
                    titleTranslationEn = "en",
                    order = 0,
                    units = listOf(
                        UnitPathDto(
                            id = "u",
                            titleCyrillic = "c",
                            titleLatin = "l",
                            titleTranslationRu = "ru",
                            titleTranslationEn = "en",
                            order = 0,
                            lessons = listOf(
                                lessonDto("1", "done"),
                                lessonDto("2", "current"),
                                lessonDto("3", "locked"),
                                lessonDto("4", "something-new"),
                            ),
                        ),
                    ),
                    checkpoint = lessonDto("cp", "locked"),
                ),
            ),
        ).toDomain()

        val section = path.sections.single()
        assertEquals(
            listOf(LessonStatus.DONE, LessonStatus.CURRENT, LessonStatus.LOCKED, LessonStatus.LOCKED),
            section.units.single().lessons.map { it.status },
        )
        assertEquals("cp", section.checkpoint?.id)
    }

    @Test
    fun `exercise prompt prefers the question and falls back to the sentence`() {
        fun exercise(id: String, payload: ExercisePayloadDto) = ExercisePublicDto(id = id, type = "fill_word", order = 0, payload = payload)

        val lesson = LessonDetailResponse(
            id = "l",
            title = "t",
            titleLatin = "t",
            xpReward = 10,
            exercises = listOf(
                exercise("q", ExercisePayloadDto(question = ExerciseTextDto(srCyr = "питање"), sentence = ExerciseTextDto(srCyr = "реченица"))),
                exercise("s", ExercisePayloadDto(sentence = ExerciseTextDto(srCyr = "реченица"), answers = listOf(ExerciseAnswerDto(id = "a", ru = "да")))),
                exercise("none", ExercisePayloadDto()),
            ),
        ).toDomain()

        assertEquals("питање", lesson.exercises[0].prompt?.srCyr)
        assertEquals("реченица", lesson.exercises[1].prompt?.srCyr)
        assertEquals("a", lesson.exercises[1].answers.single().id)
        assertNull(lesson.exercises[2].prompt)
    }
}

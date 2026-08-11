"""Сборка курса в JSON для клиентов.

Упражнения генерируются здесь, а не в приложении: тогда iOS и Android получают
идентичный урок, а порядок вариантов не может разъехаться между платформами.
Любая случайность засеяна id упражнения, поэтому сборка воспроизводима.
"""

from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path
from typing import Callable, Optional

from content import (
    CONTENT_DIR,
    Course,
    Lesson,
    Lexeme,
    Sentence,
    build_form_index,
    build_phrase_index,
    load_course,
    resolve_tokens,
    source_fingerprint,
)
from transliterate import latin_to_cyrillic

BUILD_DIR = CONTENT_DIR / "build"
FORMAT_VERSION = 1
DISTRACTOR_COUNT = 3
BANK_DISTRACTORS = 2
MATCH_PAIRS = 5

# Состав урока: восемь упражнений с чередованием форматов, чтобы подряд не шли
# два однотипных. Индексы указывают, какой по счёту элемент урока брать.
LESSON_TEMPLATE: list[tuple[str, int]] = [
    ("choose_translation_ru_sr", 0),
    ("choose_translation_ru_sr", 1),
    ("match_pairs", 0),
    ("word_bank", 0),
    ("choose_translation_sr_ru", 2),
    ("listen_word_bank", 1),
    ("word_bank", 2),
    ("choose_translation_sr_ru", 3),
]


def lessons_up_to(course: Course, lesson_id: str) -> list[Lesson]:
    """Уроки в порядке курса до указанного включительно.

    Отвлекающие варианты берутся только отсюда: показывать в первом уроке слово
    из четвёртого — значит спрашивать то, чего пользователь ещё не видел.
    """
    seen: list[Lesson] = []
    for lesson in course.lessons():
        seen.append(lesson)
        if lesson.id == lesson_id:
            break
    return seen


def seeded(exercise_id: str) -> random.Random:
    digest = hashlib.sha256(exercise_id.encode("utf-8")).digest()
    return random.Random(int.from_bytes(digest[:8], "big"))


def pick_distractors(
    target: Lexeme, pool: list[Lexeme], rng: random.Random, count: int
) -> list[Lexeme]:
    same_pos = [lex for lex in pool if lex.id != target.id and lex.pos == target.pos]
    others = [lex for lex in pool if lex.id != target.id and lex.pos != target.pos]
    rng.shuffle(same_pos)
    rng.shuffle(others)
    return (same_pos + others)[:count]


def make_choose_translation(
    lesson: Lesson, lexeme: Lexeme, pool: list[Lexeme], direction: str, ordinal: int
) -> dict:
    exercise_id = f"{lesson.id}.{ordinal}.choose.{direction}.{lexeme.id}"
    rng = seeded(exercise_id)
    distractors = pick_distractors(lexeme, pool, rng, DISTRACTOR_COUNT)

    if direction == "ru_sr":
        prompt = lexeme.translations[0]
        options = [lexeme.lemma] + [d.lemma for d in distractors]
        options_cyrillic = [latin_to_cyrillic(option) for option in options]
    else:
        prompt = lexeme.lemma
        options = [lexeme.translations[0]] + [d.translations[0] for d in distractors]
        options_cyrillic = None

    order = list(range(len(options)))
    rng.shuffle(order)
    exercise = {
        "id": exercise_id,
        "type": "choose_translation",
        "direction": direction,
        "prompt": prompt,
        "options": [options[i] for i in order],
        "correctIndex": order.index(0),
        "lexemeIds": [lexeme.id],
        "audio": lexeme.audio,
    }
    if direction == "ru_sr":
        exercise["promptCyrillic"] = None
        exercise["optionsCyrillic"] = [options_cyrillic[i] for i in order]
    else:
        exercise["promptCyrillic"] = latin_to_cyrillic(prompt)
    return exercise


# Python 3.9 не понимает `str | None` в выражении псевдонима, только в аннотации.
TokenResolver = Callable[[list[str]], list[tuple[str, Optional[str]]]]


def make_word_bank(
    lesson: Lesson,
    sentence: Sentence,
    seen_sentences: list[Sentence],
    resolve: TokenResolver,
    listening: bool,
    ordinal: int,
) -> dict:
    kind = "listen_word_bank" if listening else "word_bank"
    exercise_id = f"{lesson.id}.{ordinal}.{kind}.{sentence.id}"
    rng = seeded(exercise_id)

    answer = sentence.words()
    answer_lower = {word.lower() for word in answer}

    def words_from(sentences: list[Sentence]) -> list[str]:
        pool = [
            word
            for other in sentences
            if other.id != sentence.id
            for word in other.words()
            if word.lower() not in answer_lower
        ]
        unique = list(dict.fromkeys(pool))
        rng.shuffle(unique)
        return unique

    # Сначала слова текущего урока — они ближе по теме и потому сложнее как
    # отвлекающие; добираем из более ранних уроков только при нехватке.
    candidates = words_from(lesson.sentences)
    if len(candidates) < BANK_DISTRACTORS:
        earlier = [s for s in seen_sentences if s.lesson != lesson.id]
        candidates += [w for w in words_from(earlier) if w not in candidates]
    bank = answer + candidates[:BANK_DISTRACTORS]
    rng.shuffle(bank)

    lexeme_ids = list(
        dict.fromkeys(
            lexeme_id for _, lexeme_id in resolve(answer) if lexeme_id is not None
        )
    )
    return {
        "id": exercise_id,
        "type": kind,
        "sentenceId": sentence.id,
        "prompt": sentence.translations[0],
        "answer": answer,
        "answerCyrillic": [latin_to_cyrillic(word) for word in answer],
        "bank": bank,
        "bankCyrillic": [latin_to_cyrillic(word) for word in bank],
        "audio": sentence.audio,
        "hideTextUntilAnswered": listening,
        "lexemeIds": lexeme_ids,
    }


def make_match_pairs(lesson: Lesson, lexemes: list[Lexeme], ordinal: int) -> dict:
    exercise_id = f"{lesson.id}.{ordinal}.match.{lesson.id}"
    rng = seeded(exercise_id)
    chosen = lexemes[:MATCH_PAIRS]
    right_order = list(range(len(chosen)))
    rng.shuffle(right_order)
    return {
        "id": exercise_id,
        "type": "match_pairs",
        "left": [lex.lemma for lex in chosen],
        "leftCyrillic": [latin_to_cyrillic(lex.lemma) for lex in chosen],
        "right": [chosen[i].translations[0] for i in right_order],
        "solution": [right_order.index(i) for i in range(len(chosen))],
        "audio": [lex.audio for lex in chosen],
        "lexemeIds": [lex.id for lex in chosen],
    }


def build_lesson_exercises(
    course: Course, lesson: Lesson, resolve: TokenResolver
) -> list[dict]:
    seen = lessons_up_to(course, lesson.id)
    pool = [lex for seen_lesson in seen for lex in seen_lesson.lexemes]
    seen_sentences = [sent for seen_lesson in seen for sent in seen_lesson.sentences]

    exercises: list[dict] = []
    for ordinal, (kind, position) in enumerate(LESSON_TEMPLATE, start=1):
        if kind.startswith("choose_translation"):
            direction = "ru_sr" if kind.endswith("ru_sr") else "sr_ru"
            lexeme = lesson.lexemes[position % len(lesson.lexemes)]
            exercises.append(
                make_choose_translation(lesson, lexeme, pool, direction, ordinal)
            )
        elif kind == "match_pairs":
            exercises.append(make_match_pairs(lesson, lesson.lexemes, ordinal))
        else:
            sentence = lesson.sentences[position % len(lesson.sentences)]
            exercises.append(
                make_word_bank(
                    lesson,
                    sentence,
                    seen_sentences,
                    resolve,
                    listening=kind == "listen_word_bank",
                    ordinal=ordinal,
                )
            )
    return exercises


def serialize_lexeme(lexeme: Lexeme) -> dict:
    return {
        "id": lexeme.id,
        "lemma": lexeme.lemma,
        "lemmaCyrillic": latin_to_cyrillic(lexeme.lemma),
        "translations": lexeme.translations,
        "pos": lexeme.pos,
        "gender": lexeme.gender or None,
        "aspect": lexeme.aspect or None,
        "lesson": lexeme.lesson,
        "audio": lexeme.audio,
    }


def serialize_sentence(sentence: Sentence, resolve: TokenResolver) -> dict:
    tokens = [
        {"text": word, "lexemeId": lexeme_id}
        for word, lexeme_id in resolve(sentence.words())
    ]
    return {
        "id": sentence.id,
        "text": sentence.text,
        "textCyrillic": latin_to_cyrillic(sentence.text),
        "translations": sentence.translations,
        "tokens": tokens,
        "lesson": sentence.lesson,
        "audio": sentence.audio,
    }


def build() -> dict:
    course = load_course()
    form_index = build_form_index(course.lexemes)
    phrase_index = build_phrase_index(course.lexemes)

    def resolve(words: list[str]) -> list[tuple[str, str | None]]:
        return resolve_tokens(words, phrase_index, form_index)

    sections = []
    for section in course.sections:
        units = []
        for unit in section.units:
            lessons = []
            for lesson in unit.lessons:
                lessons.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "titleCyrillic": latin_to_cyrillic(lesson.title),
                        "titleRu": lesson.title_ru,
                        "grammarNote": lesson.grammar_note,
                        "newLexemeIds": [lex.id for lex in lesson.lexemes],
                        "exercises": build_lesson_exercises(course, lesson, resolve),
                    }
                )
            units.append(
                {
                    "id": unit.id,
                    "title": unit.title,
                    "titleCyrillic": latin_to_cyrillic(unit.title),
                    "titleRu": unit.title_ru,
                    "grammarNote": unit.grammar_note,
                    "lessons": lessons,
                }
            )
        sections.append({"id": section.id, "title": section.title, "units": units})

    return {
        "formatVersion": FORMAT_VERSION,
        "contentVersion": source_fingerprint(),
        "courseId": course.id,
        "from": course.from_lang,
        "to": course.to_lang,
        "title": course.title,
        "variant": course.variant,
        "lexemes": [serialize_lexeme(lex) for lex in course.lexemes],
        "sentences": [serialize_sentence(sent, resolve) for sent in course.sentences],
        "sections": sections,
    }


def build_audio_manifest(bundle: dict) -> dict:
    audio_dir = CONTENT_DIR / "audio"
    entries = []
    for lexeme in bundle["lexemes"]:
        entries.append({"path": lexeme["audio"], "text": lexeme["lemma"]})
    for sentence in bundle["sentences"]:
        entries.append({"path": sentence["audio"], "text": sentence["text"]})
    missing = [e for e in entries if not (audio_dir.parent / e["path"]).exists()]
    return {"total": len(entries), "missing": missing}


def main() -> None:
    bundle = build()
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    bundle_path = BUILD_DIR / f"course-{bundle['from']}-{bundle['to']}.json"
    bundle_path.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    manifest = build_audio_manifest(bundle)
    manifest_path = BUILD_DIR / "audio_manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    exercises = sum(
        len(lesson["exercises"])
        for section in bundle["sections"]
        for unit in section["units"]
        for lesson in unit["lessons"]
    )
    size_kb = bundle_path.stat().st_size / 1024
    print(f"Собрано: {bundle_path.relative_to(Path.cwd().parent)} ({size_kb:.1f} КБ)")
    print(f"  версия контента: {bundle['contentVersion']}")
    print(f"  лексем: {len(bundle['lexemes'])}, предложений: {len(bundle['sentences'])}")
    print(f"  упражнений: {exercises}")
    print(f"  аудио не озвучено: {len(manifest['missing'])} из {manifest['total']}")


if __name__ == "__main__":
    main()

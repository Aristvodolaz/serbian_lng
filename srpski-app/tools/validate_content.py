"""Проверка источников контента. Ошибки блокируют сборку, предупреждения — нет."""

from __future__ import annotations

import sys

from content import (
    VALID_POS,
    WORD_RE,
    build_form_index,
    build_phrase_index,
    load_course,
    load_stoplist,
    resolve_tokens,
)

MAX_A1_WORDS = 8
MIN_LEXEMES_PER_LESSON = 5
MIN_SENTENCES_PER_LESSON = 3


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, message: str) -> None:
        self.errors.append(message)

    def warn(self, message: str) -> None:
        self.warnings.append(message)


def check_ids(course, report: Report) -> None:
    seen: dict[str, str] = {}
    for lexeme in course.lexemes:
        if not lexeme.id:
            report.error(f"лексема без id: {lexeme.lemma!r}")
        elif lexeme.id in seen:
            report.error(f"дубликат id лексемы: {lexeme.id}")
        else:
            seen[lexeme.id] = lexeme.lemma

    sentence_ids: set[str] = set()
    for sentence in course.sentences:
        if sentence.id in sentence_ids:
            report.error(f"дубликат id предложения: {sentence.id}")
        sentence_ids.add(sentence.id)

    lemmas: dict[str, str] = {}
    for lexeme in course.lexemes:
        key = lexeme.lemma.lower()
        if key in lemmas:
            report.error(f"лемма {lexeme.lemma!r} встречается дважды: {lemmas[key]} и {lexeme.id}")
        lemmas[key] = lexeme.id


def check_required_fields(course, report: Report) -> None:
    for lexeme in course.lexemes:
        if not lexeme.translations:
            report.error(f"{lexeme.id}: нет перевода")
        if lexeme.pos not in VALID_POS:
            report.error(f"{lexeme.id}: неизвестная часть речи {lexeme.pos!r}")
        if lexeme.pos == "noun" and lexeme.gender not in {"m", "f", "n"}:
            report.error(f"{lexeme.id}: у существительного не указан род")
        if lexeme.pos == "verb" and lexeme.aspect not in {"impf", "pf"}:
            report.error(f"{lexeme.id}: у глагола не указан вид")
    for sentence in course.sentences:
        if not sentence.translations:
            report.error(f"{sentence.id}: нет перевода")
        if not sentence.text:
            report.error(f"{sentence.id}: пустой текст")


def check_lesson_refs(course, report: Report) -> None:
    known = {lesson.id for lesson in course.lessons()}
    for lexeme in course.lexemes:
        if lexeme.lesson not in known:
            report.error(f"{lexeme.id}: урок {lexeme.lesson!r} отсутствует в course.json")
    for sentence in course.sentences:
        if sentence.lesson not in known:
            report.error(f"{sentence.id}: урок {sentence.lesson!r} отсутствует в course.json")


def check_lesson_volume(course, report: Report) -> None:
    for lesson in course.lessons():
        if len(lesson.lexemes) < MIN_LEXEMES_PER_LESSON:
            report.error(
                f"урок {lesson.id}: {len(lesson.lexemes)} лексем, "
                f"для упражнения на пары нужно минимум {MIN_LEXEMES_PER_LESSON}"
            )
        if len(lesson.sentences) < MIN_SENTENCES_PER_LESSON:
            report.error(
                f"урок {lesson.id}: {len(lesson.sentences)} предложений, "
                f"нужно минимум {MIN_SENTENCES_PER_LESSON}"
            )


def check_variant(course, report: Report) -> None:
    stoplist = load_stoplist()
    if not stoplist:
        report.warn("стоп-лист пуст — проверка на хорватизмы и иекавицу не выполнена")
        return
    banned = {row["wrong"].lower(): row for row in stoplist}
    targets = [(lex.id, lex.lemma) for lex in course.lexemes]
    targets += [(sent.id, sent.text) for sent in course.sentences]
    for owner, text in targets:
        for word in WORD_RE.findall(text.lower()):
            hit = banned.get(word)
            if hit:
                report.error(
                    f"{owner}: {word!r} — {hit['reason']}, нужно {hit['right']!r}"
                )


def check_tokens(course, report: Report) -> None:
    form_index = build_form_index(course.lexemes)
    phrase_index = build_phrase_index(course.lexemes)
    for sentence in course.sentences:
        words = sentence.words()
        if len(words) > MAX_A1_WORDS:
            report.warn(
                f"{sentence.id}: {len(words)} слов — длинновато для A1 "
                f"(порог {MAX_A1_WORDS})"
            )
        for word, lexeme_id in resolve_tokens(words, phrase_index, form_index):
            if lexeme_id is None:
                report.warn(
                    f"{sentence.id}: слово {word!r} не найдено в словаре — "
                    "не будет подсказки при тапе"
                )


def check_lesson_progression(course, report: Report) -> None:
    """Предложение не должно опираться на слова из более поздних уроков.

    Самая частая ошибка при генерации контента моделью: фраза выглядит
    естественно, но требует лексики, которую пользователь ещё не проходил.
    """
    order = {lesson.id: i for i, lesson in enumerate(course.lessons())}
    lexeme_lesson = {lex.id: lex.lesson for lex in course.lexemes}
    form_index = build_form_index(course.lexemes)
    phrase_index = build_phrase_index(course.lexemes)

    for sentence in course.sentences:
        position = order.get(sentence.lesson)
        if position is None:
            continue
        for word, lexeme_id in resolve_tokens(sentence.words(), phrase_index, form_index):
            if not lexeme_id:
                continue
            source_lesson = lexeme_lesson[lexeme_id]
            if order.get(source_lesson, 0) > position:
                report.error(
                    f"{sentence.id} (урок {sentence.lesson}): слово {word!r} "
                    f"вводится позже, в уроке {source_lesson}"
                )


def check_lexeme_coverage(course, report: Report) -> None:
    form_index = build_form_index(course.lexemes)
    phrase_index = build_phrase_index(course.lexemes)
    used: set[str] = set()
    for sentence in course.sentences:
        for _, lexeme_id in resolve_tokens(sentence.words(), phrase_index, form_index):
            if lexeme_id:
                used.add(lexeme_id)
    for lexeme in course.lexemes:
        if lexeme.id not in used:
            report.warn(
                f"{lexeme.id} ({lexeme.lemma}): не встречается ни в одном предложении"
            )


def main() -> int:
    course = load_course()
    report = Report()

    check_ids(course, report)
    check_required_fields(course, report)
    check_lesson_refs(course, report)
    check_lesson_volume(course, report)
    check_variant(course, report)
    check_tokens(course, report)
    check_lesson_progression(course, report)
    check_lexeme_coverage(course, report)

    lessons = course.lessons()
    print(
        f"Курс {course.id}: {len(lessons)} уроков, "
        f"{len(course.lexemes)} лексем, {len(course.sentences)} предложений"
    )

    for warning in report.warnings:
        print(f"  ПРЕДУПРЕЖДЕНИЕ  {warning}")
    for error in report.errors:
        print(f"  ОШИБКА          {error}")

    if report.errors:
        print(f"\nПровалено: {len(report.errors)} ошибок, {len(report.warnings)} предупреждений")
        return 1
    print(f"\nПройдено, предупреждений: {len(report.warnings)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

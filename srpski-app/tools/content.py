"""Загрузка источников контента и построение индекса словоформ."""

from __future__ import annotations

import csv
import hashlib
import json
import re
from dataclasses import dataclass, field
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"
LEXEMES_CSV = CONTENT_DIR / "lexemes.csv"
SENTENCES_CSV = CONTENT_DIR / "sentences.csv"
COURSE_JSON = CONTENT_DIR / "course.json"
STOPLIST_CSV = CONTENT_DIR / "stoplist.csv"

WORD_RE = re.compile(r"[A-Za-zČĆĐŠŽČćčćđšž\u0100-\u024f'’-]+")

# AAC в контейнере m4a: нативно поддерживается iOS и Android, весит меньше mp3
# и собирается на macOS без сторонних утилит.
AUDIO_EXT = ".m4a"

VALID_POS = {
    "noun", "verb", "adj", "adv", "pron", "prep",
    "conj", "particle", "interj", "phrase", "name",
}


def split_list(value: str) -> list[str]:
    return [part.strip() for part in value.split(";") if part.strip()]


@dataclass
class Lexeme:
    id: str
    lesson: str
    lemma: str
    translations: list[str]
    pos: str
    gender: str
    aspect: str
    forms: list[str]
    notes: str

    @property
    def audio(self) -> str:
        return f"audio/lex/{self.id}{AUDIO_EXT}"


@dataclass
class Sentence:
    id: str
    lesson: str
    text: str
    translations: list[str]
    notes: str

    @property
    def audio(self) -> str:
        return f"audio/sent/{self.id}{AUDIO_EXT}"

    def words(self) -> list[str]:
        return WORD_RE.findall(self.text)


@dataclass
class Lesson:
    id: str
    title: str
    title_ru: str
    grammar_note: str
    unit_id: str
    lexemes: list[Lexeme] = field(default_factory=list)
    sentences: list[Sentence] = field(default_factory=list)


@dataclass
class Unit:
    id: str
    title: str
    title_ru: str
    grammar_note: str
    lessons: list[Lesson]


@dataclass
class Section:
    id: str
    title: str
    units: list[Unit]


@dataclass
class Course:
    id: str
    from_lang: str
    to_lang: str
    title: str
    variant: str
    sections: list[Section]
    lexemes: list[Lexeme]
    sentences: list[Sentence]

    def lessons(self) -> list[Lesson]:
        return [
            lesson
            for section in self.sections
            for unit in section.units
            for lesson in unit.lessons
        ]

    def unit_of(self, lesson_id: str) -> Unit | None:
        for section in self.sections:
            for unit in section.units:
                if any(lesson.id == lesson_id for lesson in unit.lessons):
                    return unit
        return None


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return [
            {key: (value or "").strip() for key, value in row.items()}
            for row in csv.DictReader(handle)
        ]


def load_lexemes() -> list[Lexeme]:
    return [
        Lexeme(
            id=row["id"],
            lesson=row["lesson"],
            lemma=row["lemma"],
            translations=split_list(row["translation_ru"]),
            pos=row["pos"],
            gender=row.get("gender", ""),
            aspect=row.get("aspect", ""),
            forms=split_list(row.get("forms", "")),
            notes=row.get("notes", ""),
        )
        for row in _read_csv(LEXEMES_CSV)
    ]


def load_sentences() -> list[Sentence]:
    return [
        Sentence(
            id=row["id"],
            lesson=row["lesson"],
            text=row["text"],
            translations=split_list(row["translation_ru"]),
            notes=row.get("notes", ""),
        )
        for row in _read_csv(SENTENCES_CSV)
    ]


def load_stoplist() -> list[dict[str, str]]:
    if not STOPLIST_CSV.exists():
        return []
    return _read_csv(STOPLIST_CSV)


def load_course() -> Course:
    raw = json.loads(COURSE_JSON.read_text(encoding="utf-8"))
    lexemes = load_lexemes()
    sentences = load_sentences()

    by_lesson_lex: dict[str, list[Lexeme]] = {}
    for lexeme in lexemes:
        by_lesson_lex.setdefault(lexeme.lesson, []).append(lexeme)
    by_lesson_sent: dict[str, list[Sentence]] = {}
    for sentence in sentences:
        by_lesson_sent.setdefault(sentence.lesson, []).append(sentence)

    sections: list[Section] = []
    for raw_section in raw["sections"]:
        units: list[Unit] = []
        for raw_unit in raw_section["units"]:
            lessons = [
                Lesson(
                    id=raw_lesson["id"],
                    title=raw_lesson["title"],
                    title_ru=raw_lesson.get("titleRu", ""),
                    grammar_note=raw_lesson.get("grammarNote", ""),
                    unit_id=raw_unit["id"],
                    lexemes=by_lesson_lex.get(raw_lesson["id"], []),
                    sentences=by_lesson_sent.get(raw_lesson["id"], []),
                )
                for raw_lesson in raw_unit["lessons"]
            ]
            units.append(
                Unit(
                    id=raw_unit["id"],
                    title=raw_unit["title"],
                    title_ru=raw_unit.get("titleRu", ""),
                    grammar_note=raw_unit.get("grammarNote", ""),
                    lessons=lessons,
                )
            )
        sections.append(
            Section(id=raw_section["id"], title=raw_section["title"], units=units)
        )

    return Course(
        id=raw["id"],
        from_lang=raw["from"],
        to_lang=raw["to"],
        title=raw["title"],
        variant=raw.get("variant", "ekavica"),
        sections=sections,
        lexemes=lexemes,
        sentences=sentences,
    )


def build_form_index(lexemes: list[Lexeme]) -> dict[str, str]:
    """Отобразить словоформу в id лексемы.

    Приоритет при коллизиях: однословная лемма → указанная словоформа →
    отдельное слово из многословной леммы. Иначе `dobro` из фразы
    `dobro veče` перекрыл бы самостоятельное наречие `dobro`.
    """
    from_lemma: dict[str, str] = {}
    from_forms: dict[str, str] = {}
    from_phrase: dict[str, str] = {}

    for lexeme in lexemes:
        words = WORD_RE.findall(lexeme.lemma.lower())
        if len(words) == 1:
            from_lemma.setdefault(words[0], lexeme.id)
        else:
            for word in words:
                from_phrase.setdefault(word, lexeme.id)
        for form in lexeme.forms:
            for word in WORD_RE.findall(form.lower()):
                from_forms.setdefault(word, lexeme.id)

    index = dict(from_phrase)
    index.update(from_forms)
    index.update(from_lemma)
    return index


def build_phrase_index(lexemes: list[Lexeme]) -> dict[tuple[str, ...], str]:
    """Отобразить последовательность слов многословной леммы в id лексемы."""
    phrases: dict[tuple[str, ...], str] = {}
    for lexeme in lexemes:
        words = tuple(WORD_RE.findall(lexeme.lemma.lower()))
        if len(words) > 1:
            phrases[words] = lexeme.id
        for form in lexeme.forms:
            form_words = tuple(WORD_RE.findall(form.lower()))
            if len(form_words) > 1:
                phrases.setdefault(form_words, lexeme.id)
    return phrases


def resolve_tokens(
    words: list[str],
    phrase_index: dict[tuple[str, ...], str],
    form_index: dict[str, str],
) -> list[tuple[str, str | None]]:
    """Сопоставить слова предложения с лексемами, отдавая приоритет фразам.

    Без этого `dobro` в `dobro jutro` привязалось бы к самостоятельному наречию
    `dobro` вместо фразы, а тап по слову показал бы неверную подсказку.
    Все слова найденной фразы ссылаются на одну лексему, поэтому список токенов
    остаётся один к одному со словами.
    """
    max_phrase = max((len(key) for key in phrase_index), default=1)
    tokens: list[tuple[str, str | None]] = []
    position = 0
    while position < len(words):
        matched = False
        longest = min(max_phrase, len(words) - position)
        for size in range(longest, 1, -1):
            key = tuple(word.lower() for word in words[position : position + size])
            lexeme_id = phrase_index.get(key)
            if lexeme_id:
                tokens.extend((word, lexeme_id) for word in words[position : position + size])
                position += size
                matched = True
                break
        if matched:
            continue
        word = words[position]
        tokens.append((word, form_index.get(word.lower())))
        position += 1
    return tokens


def source_fingerprint() -> str:
    digest = hashlib.sha256()
    for path in (COURSE_JSON, LEXEMES_CSV, SENTENCES_CSV):
        digest.update(path.read_bytes())
    return digest.hexdigest()[:12]

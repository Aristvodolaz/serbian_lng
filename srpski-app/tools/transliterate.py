"""Латиница → кириллица для сербского.

Соответствие однозначное, кроме диграфов lj, nj, dž: в них два латинских символа
дают одну кириллическую букву, но на стыке морфем те же пары читаются раздельно
(nadživeti = nad + živeti → надживети, а не наџивети). Такие слова перечислены в
SPLIT_DIGRAPH_WORDS.
"""

from __future__ import annotations

DIGRAPHS: dict[str, str] = {
    "dž": "џ",
    "lj": "љ",
    "nj": "њ",
}

SINGLES: dict[str, str] = {
    "a": "а", "b": "б", "c": "ц", "č": "ч", "ć": "ћ", "d": "д", "đ": "ђ",
    "e": "е", "f": "ф", "g": "г", "h": "х", "i": "и", "j": "ј", "k": "к",
    "l": "л", "m": "м", "n": "н", "o": "о", "p": "п", "r": "р", "s": "с",
    "š": "ш", "t": "т", "u": "у", "v": "в", "z": "з", "ž": "ж",
}

# Слова, в которых lj / nj / dž стоят на стыке морфем и читаются раздельно.
# Список пополняется по мере роста курса; валидатор не может вывести это сам.
SPLIT_DIGRAPH_WORDS: frozenset[str] = frozenset(
    {
        "nadživeti",
        "nadživela",
        "nadživeo",
        "nadživljavati",
        "injekcija",
        "injektor",
        "konjunkcija",
        "konjugacija",
        "izvanjezički",
        "vanjezički",
        "podžanr",
        "odživeti",
    }
)

_WORD_CHARS = set(SINGLES) | {c.upper() for c in SINGLES} | {"-", "'"}


def _match_case(cyrillic: str, first: str, second: str) -> str:
    """Подобрать регистр кириллической буквы по регистру латинской пары."""
    if first.isupper() and second.isupper():
        return cyrillic.upper()
    if first.isupper():
        return cyrillic.upper()
    return cyrillic


def _transliterate_word(word: str, *, split_digraphs: bool) -> str:
    out: list[str] = []
    i = 0
    while i < len(word):
        pair = word[i : i + 2].lower()
        if not split_digraphs and len(pair) == 2 and pair in DIGRAPHS:
            out.append(_match_case(DIGRAPHS[pair], word[i], word[i + 1]))
            i += 2
            continue
        char = word[i]
        lower = char.lower()
        if lower in SINGLES:
            cyrillic = SINGLES[lower]
            out.append(cyrillic.upper() if char.isupper() else cyrillic)
        else:
            out.append(char)
        i += 1
    return "".join(out)


def latin_to_cyrillic(text: str) -> str:
    """Транслитерировать текст, обрабатывая каждое слово отдельно.

    Разбиение на слова нужно, чтобы проверить слово по списку исключений и
    сохранить пунктуацию и пробелы как есть.
    """
    result: list[str] = []
    buffer: list[str] = []

    def flush() -> None:
        if not buffer:
            return
        word = "".join(buffer)
        split = word.lower() in SPLIT_DIGRAPH_WORDS
        result.append(_transliterate_word(word, split_digraphs=split))
        buffer.clear()

    for char in text:
        if char in _WORD_CHARS:
            buffer.append(char)
        else:
            flush()
            result.append(char)
    flush()
    return "".join(result)


if __name__ == "__main__":
    samples = [
        "Zdravo! Kako se zoveš?",
        "Njegovo ime je Đorđe.",
        "Ljubav i džem",
        "NJEGOV LJUBIMAC",
        "nadživeti",
        "Srpski jezik je lep.",
    ]
    for sample in samples:
        print(f"{sample}  →  {latin_to_cyrillic(sample)}")

"""Черновая озвучка для разработки.

В macOS нет сербского голоса — доступен только хорватский `Lana` (hr_HR).
Фонетика близка, но интонация и часть звуков не сербские, поэтому такие файлы
годятся только чтобы не ждать студию во время разработки. Флаг в манифесте
помечает их как черновые, и релизная сборка обязана их заменить.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from content import CONTENT_DIR

BUILD_DIR = CONTENT_DIR / "build"
DEV_VOICE = "Lana"
MANIFEST = BUILD_DIR / "audio_manifest.json"


def has_voice(name: str) -> bool:
    result = subprocess.run(["say", "-v", "?"], capture_output=True, text=True)
    return any(line.startswith(name) for line in result.stdout.splitlines())


def synthesize(text: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as workdir:
        raw = Path(workdir) / "speech.aiff"
        subprocess.run(
            ["say", "-v", DEV_VOICE, "-o", str(raw), text],
            check=True,
            capture_output=True,
        )
        subprocess.run(
            ["afconvert", "-f", "m4af", "-d", "aac", str(raw), str(destination)],
            check=True,
            capture_output=True,
        )


def main() -> int:
    if not MANIFEST.exists():
        print("Сначала соберите контент: make build")
        return 1
    if not has_voice(DEV_VOICE):
        print(f"Голос {DEV_VOICE} не установлен — поставьте его в Настройках macOS")
        return 1

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    missing = manifest["missing"]
    if not missing:
        print("Всё уже озвучено")
        return 0

    print(f"Черновая озвучка голосом {DEV_VOICE} (hr_HR), файлов: {len(missing)}")
    for entry in missing:
        destination = CONTENT_DIR / entry["path"]
        synthesize(entry["text"], destination)
    print(f"Готово. Файлы черновые, в релиз не идут: {CONTENT_DIR / 'audio'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

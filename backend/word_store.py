import hashlib
import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import List, Optional, Set


@dataclass(frozen=True)
class WordItem:
    word: str
    tags: List[str]


WORDS_PATH = Path(__file__).parent / "words.json"
# TODO: Ask james


def _load_items() -> List[WordItem]:
    raw = json.loads(WORDS_PATH.read_text(encoding="utf-8"))
    items: List[WordItem] = []
    for x in raw:
        items.append(WordItem(word=str(x["word"]).upper(), tags=list(x.get("tags", []))))
    return items


def list_categories() -> List[str]:
    items = _load_items()
    tags: Set[str] = set()
    for item in items:
        for t in item.tags:
            tags.add(t)
    return sorted(tags)


def pick_daily_word(category: Optional[str] = None, day: Optional[date] = None) -> str:
    """
    Pick a word for a given day (defaults to today).
    If category is provided, filter to that tag, with a safe fallback to all words.
    """
    items = _load_items()

    if category:
        filtered = [word for word in items if category in word.tags]
        if filtered:
            items = filtered

    if not items:
        raise RuntimeError("No words available to choose from.")

    if day is None:
        day = date.today()

    # Stable, deterministic index for the day
    digest = hashlib.sha256(day.isoformat().encode("utf-8")).hexdigest()
    idx = int(digest[:8], 16) % len(items)
    return items[idx].word
# TODO: Ask james
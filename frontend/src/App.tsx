import { useEffect, useMemo, useState } from "react";
import "./App.css";

type LetterStatus = "correct" | "present" | "absent";
type GameStatus = "playing" | "won" | "lost";

type Row = {
  letters: string;
  statuses: LetterStatus[] | null;
};

const WORD_LEN = 5;
const MAX_GUESSES = 6;

function emptyRows(): Row[] {
  return Array.from({ length: MAX_GUESSES }, () => ({
    letters: "",
    statuses: null,
  }));
}

async function fetchCategories(): Promise<string[]> {
  const res = await fetch("/api/categories");

  if (!res.ok) {
    throw new Error("Failed to load categories");
  }

  const data = await res.json();
  return data.categories ?? [];
}

async function submitGuess(
  guess: string,
  category: string
): Promise<LetterStatus[]> {
  const url =
    category === "All"
      ? "/api/guess"
      : `/api/guess?category=${encodeURIComponent(category)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guess }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.detail || "Guess failed");
  }

  const data = (await res.json()) as { result: LetterStatus[] };
  return data.result;
}

export default function App() {
  const [rows, setRows] = useState<Row[]>(() => emptyRows());
  const [activeRow, setActiveRow] = useState(0);
  const [toast, setToast] = useState("Choose a category and start guessing.");
  const [busy, setBusy] = useState(false);

  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");

  const current = rows[activeRow];

  const grid = useMemo(() => {
    return rows.map((row) => {
      const letters = row.letters.padEnd(WORD_LEN, " ");

      return letters.split("").map((ch, idx) => ({
        ch,
        status: row.statuses ? row.statuses[idx] : null,
      }));
    });
  }, [rows]);

  useEffect(() => {
    fetchCategories()
      .then((loadedCategories) => {
        const uniqueCategories = Array.from(new Set(["All", ...loadedCategories]));
        setCategories(uniqueCategories);
      })
      .catch(() => {
        setCategories(["All"]);
        setToast("Could not load categories. Using All mode.");
      });
  }, []);

  function resetGame(message = "New game started.") {
    setRows(emptyRows());
    setActiveRow(0);
    setGameStatus("playing");
    setToast(message);
    setBusy(false);
  }

  function handleCategoryChange(category: string) {
    setSelectedCategory(category);
    resetGame(`Category changed to ${category}.`);
  }

  function pushLetter(letter: string) {
    if (busy || gameStatus !== "playing") return;

    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[activeRow] };

      if (row.statuses) return prev;
      if (row.letters.length >= WORD_LEN) return prev;

      row.letters += letter.toUpperCase();
      next[activeRow] = row;

      return next;
    });
  }

  function backspace() {
    if (busy || gameStatus !== "playing") return;

    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[activeRow] };

      if (row.statuses) return prev;

      row.letters = row.letters.slice(0, -1);
      next[activeRow] = row;

      return next;
    });
  }

  async function enter() {
    if (busy || gameStatus !== "playing") return;

    const guess = current.letters;

    if (guess.length !== WORD_LEN) {
      setToast("Not enough letters.");
      return;
    }

    setBusy(true);
    setToast("");

    try {
      const statuses = await submitGuess(guess, selectedCategory);
      const didWin = statuses.every((status) => status === "correct");
      const isLastGuess = activeRow === MAX_GUESSES - 1;

      setRows((prev) => {
        const next = [...prev];
        next[activeRow] = { letters: guess, statuses };
        return next;
      });

      if (didWin) {
        setGameStatus("won");
        setToast(
          `You won in ${activeRow + 1} guess${activeRow + 1 === 1 ? "" : "es"}!`
        );
        return;
      }

      if (isLastGuess) {
        setGameStatus("lost");
        setToast("Game over. Try again or switch categories.");
        return;
      }

      setActiveRow((row) => row + 1);
      setToast("Keep going.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setToast(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Backspace") {
        backspace();
        return;
      }

      if (e.key === "Enter") {
        void enter();
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        pushLetter(e.key);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, gameStatus, activeRow, current.letters, selectedCategory]);

  return (
    <div className="page">
      <div className="card">
        <h1>Word Sprint</h1>

        <p className="muted">
          A daily Wordle-style game powered by React and FastAPI.
        </p>

        <div className="toolbar">
          <label htmlFor="category">Category</label>

          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => {
              handleCategoryChange(e.target.value);
              e.currentTarget.blur();
            }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="statusBar">
          <span>{toast}</span>
        </div>

        <div className="grid">
          {grid.map((row, rowIndex) => (
            <div className="row" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <div key={cellIndex} className={`tile ${cell.status ?? ""}`}>
                  {cell.ch.trim()}
                </div>
              ))}
            </div>
          ))}
        </div>

        {gameStatus !== "playing" && (
          <button
            className="playAgain"
            onClick={() => resetGame("New game started.")}
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
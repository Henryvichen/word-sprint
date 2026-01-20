import { useEffect, useMemo, useState } from "react";
import "./App.css";

type LetterStatus = "correct" | "present" | "absent";

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

async function submitGuess(guess: string): Promise<LetterStatus[]> {
  const res = await fetch("/api/guess", {
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
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const current = rows[activeRow];

  const grid = useMemo(() => {
    return rows.map((r) => {
      const letters = r.letters.padEnd(WORD_LEN, " ");
      return letters.split("").map((ch, idx) => ({
        ch,
        status: r.statuses ? r.statuses[idx] : null,
      }));
    });
  }, [rows]);

  function pushLetter(letter: string) {
    if (busy) return;
    setRows((prev) => {
      const next = [...prev];
      const r = { ...next[activeRow] };
      if (r.statuses) return prev;
      if (r.letters.length >= WORD_LEN) return prev;
      r.letters += letter.toUpperCase();
      next[activeRow] = r;
      return next;
    });
  }

  function backspace() {
    if (busy) return;
    setRows((prev) => {
      const next = [...prev];
      const r = { ...next[activeRow] };
      if (r.statuses) return prev;
      r.letters = r.letters.slice(0, -1);
      next[activeRow] = r;
      return next;
    });
  }

  async function enter() {
    if (busy) return;
    if (current.letters.length !== WORD_LEN) {
      setToast("Not enough letters");
      return;
    }

    setBusy(true);
    setToast("");

    try {
      const statuses = await submitGuess(current.letters);
      setRows((prev) => {
        const next = [...prev];
        next[activeRow] = { letters: current.letters, statuses };
        return next;
      });
      setActiveRow((r) => Math.min(r + 1, MAX_GUESSES - 1));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setToast(msg);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Backspace") backspace();
      if (e.key === "Enter") enter();
      if (/^[a-zA-Z]$/.test(e.key)) pushLetter(e.key);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="page">
      <div className="card">
        <h1>Word Sprint</h1>
        <p className="muted">React + FastAPI Wordle-style game</p>
        <div className="boardFrame">
          <div className="grid">
            {grid.map((row, rIdx) => (
              <div className="row" key={rIdx}>
                {row.map((cell, cIdx) => (
                  <div
                    key={cIdx}
                    className={`tile ${cell.status ?? ""}`}
                  >
                    {cell.ch.trim()}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}

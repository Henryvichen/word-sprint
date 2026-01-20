from typing import List, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

LetterStatus = Literal["correct", "present", "absent"]

app = FastAPI(title="Word Sprint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary hardcoded answer
ANSWER = "CRANE"


class GuessIn(BaseModel):
    guess: str = Field(min_length=5, max_length=5)


class GuessOut(BaseModel):
    result: List[LetterStatus]


@app.get("/api/health")
def health():
    return {"ok": True}


def evaluate_guess(answer: str, guess: str) -> List[LetterStatus]:
    """
    Wordle-style evaluation with duplicate handling.
    Two-pass algorithm:
      1) mark correct letters and reserve remaining counts
      2) mark present if letter still available, else absent
    """
    answer = answer.upper()
    guess = guess.upper()

    result: List[LetterStatus] = ["absent"] * len(guess)

    # Count letters in answer that are not already matched as correct
    remaining = {}

    # Pass 1: correct
    for i, (a, g) in enumerate(zip(answer, guess)):
        if g == a:
            result[i] = "correct"
        else:
            remaining[a] = remaining.get(a, 0) + 1

    # Pass 2: present or absent
    for i, g in enumerate(guess):
        if result[i] == "correct":
            continue
        if remaining.get(g, 0) > 0:
            result[i] = "present"
            remaining[g] -= 1
        else:
            result[i] = "absent"

    return result


@app.post("/api/guess", response_model=GuessOut)
def guess(payload: GuessIn):
    g = payload.guess.strip().upper()
    if len(g) != 5 or not g.isalpha():
        raise HTTPException(status_code=400, detail="Guess must be 5 letters A-Z.")
    return {"result": evaluate_guess(ANSWER, g)}

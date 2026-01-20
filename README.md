# Word Sprint

Word Sprint is a Wordle-style word game built with a React (TypeScript) frontend and a Python FastAPI backend.  
The project demonstrates full-stack development, API design, and correct duplicate-letter evaluation logic.

---

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite

**Backend**
- Python
- FastAPI
- Pydantic

---

## How It Works

- The frontend renders a 6×5 grid and captures keyboard input.
- Each guess is sent to the backend via a REST API.
- The backend evaluates the guess using a Wordle-accurate two-pass algorithm:
  - First pass marks correct letters.
  - Second pass marks present vs absent letters while handling duplicates correctly.
- The frontend updates tile colors based on the response.

---

## API Overview

### `POST /api/guess`

**Request**
```json
{
  "guess": "CRANE"
}

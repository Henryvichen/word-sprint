# Word Sprint

Word Sprint is a Wordle-style word game built with a React (TypeScript) frontend and a Python FastAPI backend.  
The project demonstrates full-stack development, API design, and correct duplicate-letter evaluation logic.

The project was developed as part of my AI-Enhanced Projects portfolio work, where AI was used to accelerate scaffolding, planning, and iterative development while I refined the frontend behavior, backend validation, game state flow, and application architecture.

<img width="576" height="743" alt="wordsprint" src="https://github.com/user-attachments/assets/42c67643-464b-447a-980e-d730b93150ba" />

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
- Players can switch between multiple word categories.
- Each guess is sent to the backend via a REST API.
- The backend selects a deterministic daily word based on the current date and category.
- The backend evaluates guesses using a Wordle-accurate two-pass algorithm:
  - First pass marks correct letters.
  - Second pass marks present vs absent letters while handling duplicates correctly.
- The frontend updates tile colors and game state based on the API response.
- The game supports win/loss states and replay flow.

---

## API Overview

### `POST /api/guess`

**Request**
```json
{
  "guess": "CRANE"
}
```

**Response**
```json
{
  "result": ["correct", "absent", "present", "absent", "correct"]
}
```

---

### `GET /api/categories`

Returns the available gameplay categories.

**Response**
```json
{
  "categories": ["common", "fantasy", "gaming", "food", "spooky"]
}
```

---

## Running the Project

### Backend

```bash
cd backend
source .venv/Scripts/activate
uvicorn app:app --reload --port 8000
```

Backend runs on:

```text
http://localhost:8000
```

---

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

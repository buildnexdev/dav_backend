# Portfolio Node.js Backend

Express API base for the MyPortfolio site.

## Setup

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Server starts at `http://localhost:5000`.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | API index |
| GET | `/api/health` | Health check |
| GET | `/api/chat` | Chat service status |
| POST | `/api/chat` | `{ "message": "...", "history": [] }` |
| POST | `/api/contact` | `{ "name", "email", "message" }` |

Chat uses OpenAI, Gemini, or Groq when `AI_API_KEY` is set. Without a key it uses the local portfolio knowledge fallback.

## Frontend

Point the chatbot to:

```
http://localhost:5000/api/chat
```

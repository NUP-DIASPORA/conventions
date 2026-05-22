# NUP Diaspora Convention 2025 — Conference App

A full-stack conference app for the NUP diaspora convention (July 28 – August 3, 2025).

## Structure

```
conventions/
├── backend/    # FastAPI (Python) — you own this
└── frontend/   # React + Vite — your friend owns this
```

---

## Backend Setup (Python / FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL and a SECRET_KEY

# Run the server
uvicorn app.main:app --reload
```

API runs at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### First-time admin setup
After running the server, create your admin account via:
```
POST http://localhost:8000/api/auth/register
{ "email": "you@example.com", "full_name": "Your Name", "password": "yourpassword" }
```
Then protect or remove that endpoint in `routers/auth.py`.

---

## Frontend Setup (React / Vite)

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

App runs at **http://localhost:5173**

### Build for production
```bash
npm run build
```

---

## Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy your **connection string** from Project Settings → Database
3. Paste it as `DATABASE_URL` in `backend/.env`
4. Tables are created automatically when the FastAPI server starts

---

## Deployment

| Part | Platform | Cost |
|------|----------|------|
| Frontend | [Vercel](https://vercel.com) | Free |
| Backend | [Railway](https://railway.app) or [Render](https://render.com) | Free tier |
| Database | [Supabase](https://supabase.com) | Free tier |

---

## API Overview

| Resource | Public | Admin |
|----------|--------|-------|
| `GET /api/speakers` | ✅ | — |
| `GET /api/programs` | ✅ | — |
| `POST /api/registrants` | — | ✅ |
| `GET /api/registrants` | — | ✅ |
| `POST /api/checkins` | — | ✅ |
| `GET /api/checkins/stats` | — | ✅ |

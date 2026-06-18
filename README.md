# NUP Diaspora Convention 2026 — Conference App

A full-stack progressive web app (PWA) for the NUP Diaspora Convention, Los Angeles, August 12–16, 2026.

## Structure

```
conventions/
├── backend/    # FastAPI (Python) — API, database, Stripe webhook
└── frontend/   # React + Vite PWA — delegate-facing app + admin panel
```

---

## Backend Setup (Python / FastAPI)

### Requirements
- Python 3.11.9 (managed via pyenv)
- pip

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Run the server
uvicorn app.main:app --reload --port 8000
```

API runs at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

### First-time admin setup
```bash
python create_admin.py
```

---

## Frontend Setup (React / Vite)

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**  
The Vite dev server proxies all `/api` requests to `http://localhost:8000` automatically.

### Build for production
```bash
npm run build
```

---

## Environment Variables

### Production (set in Render dashboard)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret |
| `FRONTEND_URL` | Live frontend URL (for CORS) |
| `STRIPE_SECRET_KEY` | Stripe live secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_LINK_CONVENTION_FULL` | Slug from `buy.stripe.com/<slug>` for $300 link |
| `STRIPE_LINK_CONVENTION_HALF` | Slug for $150 half payment link |
| `STRIPE_LINK_BOAT_CRUISE_FULL` | Slug for $220 boat cruise link |
| `STRIPE_LINK_BOAT_CRUISE_PARTIAL` | Slug for $110 partial boat cruise link |

### Local development
Create `backend/.env.local` to override values without touching production:

```bash
# backend/.env.local  (git-ignored, never deployed)
DATABASE_URL=sqlite:///./local_dev.db
```

All other values are inherited from `backend/.env`. Render ignores `.env.local` entirely.

---

## Database

- **Production:** Supabase (PostgreSQL) — connection string set in Render
- **Local dev:** SQLite via `backend/.env.local` (safe sandbox, no real data)
- Tables are created automatically when the server starts — no migrations needed

---

## Stripe Webhook Automation

When a delegate pays via any of the 4 Stripe payment links, Stripe fires a `checkout.session.completed` event to:

```
https://app.diasporanup.org/api/webhooks/stripe
```

The webhook automatically:
- Creates a new `Registrant` record (with QR code) if the email isn't in the database yet
- Or updates an existing registrant's `convention` / `boat_cruise` flags
- Records the `Payment` with the Stripe payment intent ID
- Prevents duplicate processing if the same event fires twice

### Payment links
| Link | Amount | Type |
|---|---|---|
| NUP Convention LA 2026 | $300 | Convention full payment |
| NUP LA 2026 – Half Payment | $150 | Convention partial (installment 1) |
| Boat Cruise | $220 | Boat cruise full payment |
| Boat Cruise – Partial Payment | $110 | Boat cruise partial (installment 1) |

### Setup
1. Add `STRIPE_WEBHOOK_SECRET` from Stripe Dashboard → Developers → Webhooks → your endpoint
2. Add the 4 `STRIPE_LINK_*` slugs (the part after `buy.stripe.com/`) to your environment
3. The webhook endpoint must be active and reachable at the URL above

---

## Running Tests

```bash
cd backend
source venv/bin/activate

DATABASE_URL="sqlite:////tmp/test_nup.db" SECRET_KEY="test" pytest tests/ -v
```

| File | What it covers |
|---|---|
| `test_auth.py` | Login, register admin, change password |
| `test_registrants.py` | CRUD, search, QR lookup, audit log |
| `test_payments.py` | Create, link unattributed, summary, delete |
| `test_checkins.py` | Check-in, duplicate prevention, stats |
| `test_speakers.py` | CRUD, public vs auth access |
| `test_programs.py` | CRUD, date filter, speaker join |
| `test_stripe_webhook.py` | All 4 payment types, new/existing registrant, security |
| `test_integration.py` | End-to-end journeys across multiple routers |

> **Note:** 2 breakdown tests are skipped on SQLite (they use a Postgres-only function). They run automatically against the real database.

---

## Deployment

| Part | Platform |
|---|---|
| Frontend | Hostinger (static file hosting) |
| Backend | Render (web service) |
| Database | Supabase (PostgreSQL) |

### Frontend — Hostinger

The frontend is a static Vite build uploaded to Hostinger.

```bash
cd frontend
npm run build
```

This outputs to `frontend/dist/`. Upload the contents of `dist/` to your Hostinger public root (e.g. `public_html/`) via FTP or the Hostinger File Manager.

The repo includes `frontend/htaccess` — rename it to `.htaccess` inside `public_html/` so that client-side routing works (all paths fall back to `index.html`).

All API calls hit `https://conventions.onrender.com/api` (set in `frontend/.env.production` via `VITE_API_URL`).

### Backend — Render

The backend auto-deploys from GitHub. Push to the `stripe-automation` branch and Render picks it up automatically.

```bash
git push origin stripe-automation
```

Environment variables are managed in the Render dashboard (not committed to the repo). See the Environment Variables section above for the full list.

---

## API Reference

| Endpoint | Public | Admin |
|---|---|---|
| `POST /api/auth/login` | ✅ | — |
| `GET /api/auth/me` | — | ✅ |
| `POST /api/auth/register` | — | ✅ |
| `POST /api/auth/change-password` | — | ✅ |
| `GET /api/speakers` | ✅ | — |
| `POST /api/speakers` | — | ✅ |
| `PATCH /api/speakers/:id` | — | ✅ |
| `DELETE /api/speakers/:id` | — | ✅ |
| `GET /api/programs` | ✅ | — |
| `POST /api/programs` | — | ✅ |
| `PATCH /api/programs/:id` | — | ✅ |
| `DELETE /api/programs/:id` | — | ✅ |
| `GET /api/registrants` | — | ✅ |
| `POST /api/registrants` | — | ✅ |
| `PATCH /api/registrants/:id` | — | ✅ |
| `DELETE /api/registrants/:id` | — | ✅ |
| `GET /api/registrants/by-email` | ✅ | — |
| `GET /api/registrants/lookup/by-qr` | — | ✅ |
| `GET /api/payments/summary` | — | ✅ |
| `GET /api/payments/unattributed` | — | ✅ |
| `POST /api/payments` | — | ✅ |
| `PATCH /api/payments/:id/link` | — | ✅ |
| `DELETE /api/payments/:id` | — | ✅ |
| `POST /api/checkins` | — | ✅ |
| `GET /api/checkins` | — | ✅ |
| `GET /api/checkins/stats` | — | ✅ |
| `GET /api/checkins/breakdown` | — | ✅ |
| `POST /api/webhooks/stripe` | ✅ (Stripe only) | — |

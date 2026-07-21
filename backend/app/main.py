from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base, ensure_schema
from .config import settings
from .routers import auth, registrants, checkins, speakers, programs, payments, stripe_webhook

# Create all tables / add missing columns (no-ops if already present)
Base.metadata.create_all(bind=engine)
ensure_schema()

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the NUP Diaspora Convention conference app",
    version="1.0.0",
    redirect_slashes=False,
)

# CORS - allow the React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def read_only_guard(request: Request, call_next):
    """Block writes when READ_ONLY=true (for safe local browsing of production)."""
    if settings.READ_ONLY and request.method in ("POST", "PUT", "PATCH", "DELETE"):
        # Allow login only
        if request.url.path.rstrip("/") != "/api/auth/login":
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "READ_ONLY mode is on — writes to the database are blocked. "
                    "Set READ_ONLY=false in .env.local when finished browsing production."
                },
            )
    return await call_next(request)


# Routers
app.include_router(auth.router)
app.include_router(registrants.router)
app.include_router(checkins.router)
app.include_router(payments.router)
app.include_router(speakers.router)
app.include_router(programs.router)
app.include_router(stripe_webhook.router)


@app.get("/")
def root():
    return {
        "message": f"Welcome to the {settings.APP_NAME} API",
        "docs": "/docs",
        "read_only": settings.READ_ONLY,
    }


@app.get("/health")
def health():
    return {"status": "ok", "read_only": settings.READ_ONLY}

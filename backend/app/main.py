from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .config import settings
from .routers import auth, registrants, checkins, speakers, programs, payments

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the NUP Diaspora Convention conference app",
    version="1.0.0",
    redirect_slashes=False,
)

# CORS - allow the React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(registrants.router)
app.include_router(checkins.router)
app.include_router(payments.router)
app.include_router(speakers.router)
app.include_router(programs.router)


@app.get("/")
def root():
    return {"message": f"Welcome to the {settings.APP_NAME} API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}

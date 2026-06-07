from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_db_and_tables
from app.models.cache import FileSummaryCache
from app.api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database and tables are created on startup
    create_db_and_tables()
    yield

app = FastAPI(
    title="Repomap Analyzer API",
    lifespan=lifespan
)

# CORS Middleware allowing the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

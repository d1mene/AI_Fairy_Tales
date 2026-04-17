from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.config import settings
import contextlib
import asyncio
from sqlalchemy.exc import OperationalError
from alembic.config import Config
from alembic import command

from app.handlers.users import router as users_router
from app.handlers.tales import router as tales_router
from app.handlers.profile import router as profile_router
from app.handlers.register import router as register_router
from app.handlers.login import router as login_router

def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

async def init_db():
    retries = 5
    delay = 3

    while retries > 0:
        try:
            async with engine.begin() as conn:
                pass 

            await asyncio.to_thread(run_migrations)

            return 
            
        except OperationalError as e:
            retries -= 1
            await asyncio.sleep(delay)


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="API для генерации сказок",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(tales_router)
app.include_router(profile_router)
app.include_router(register_router)
app.include_router(login_router)

@app.get('/')
async def root():
    return {'message': 'AI Fairy Tales API', 'docs': '/docs', 'health': '/health'}

@app.get('/health')
async def health():
    return {'status': 'healthy'}
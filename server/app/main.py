from fastapi import FastAPI
from app.db.session import engine, get_db
import contextlib
import asyncio
from sqlalchemy.exc import OperationalError
from alembic.config import Config
from alembic import command

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

app = FastAPI(lifespan=lifespan)

@app.get('/')
async def root():
    return {'message': 'success'}
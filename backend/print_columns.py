from backend.app.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("PRAGMA table_info('quotes')")).fetchall()
    print([ (r[1], r[2]) for r in rows ])


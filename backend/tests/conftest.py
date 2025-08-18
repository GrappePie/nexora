# Ensure repository root is on sys.path so `import backend` works when running pytest from various cwd
import os
import sys
import warnings

# Silenciar DeprecationWarning del adaptador por defecto de datetime en sqlite3/SQLAlchemy (Python 3.12)
warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    message=r"The default datetime adapter is deprecated.*",
    module=r"sqlalchemy\.engine\.default",
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Forzar DB limpia en SQLite por cambios de esquema durante desarrollo
DB_PATH = os.path.join(ROOT, "backend.db")
try:
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
except Exception:
    pass

# Ejecutar migraciones Alembic a head para tener el esquema actualizado
try:
    from alembic.config import Config
    from alembic import command
    ini_path = os.path.join(ROOT, 'backend', 'alembic.ini')
    cfg = Config(ini_path)
    if 'DATABASE_URL' not in os.environ:
        os.environ['DATABASE_URL'] = 'sqlite:///backend.db'
    command.upgrade(cfg, 'head')
except Exception as _e:
    print(f"[WARN] Alembic upgrade skipped or failed: {_e}")

# Limpiar rate limiter entre pruebas
import pytest

def _try_clear_rate_limiter():
    try:
        from backend.app.quotes import _RATE_BUCKETS  # type: ignore
        _RATE_BUCKETS.clear()
    except Exception:
        pass

@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    _try_clear_rate_limiter()
    yield
    _try_clear_rate_limiter()

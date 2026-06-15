# Backend

FastAPI training API with SQLite, bcrypt, JWT access tokens, and refresh tokens.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Swagger UI: http://localhost:8000/docs

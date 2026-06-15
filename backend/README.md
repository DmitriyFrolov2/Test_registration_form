# Backend

FastAPI training API with SQLite, bcrypt, JWT access tokens, and refresh tokens.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 9124
```

Swagger UI: http://localhost:9124/docs

# Training registration form

Учебное приложение для проверки цепочки:

`сырой ввод в форме -> обработка/валидация на фронте -> JSON payload -> запрос на бэкенд -> JSON response`.

## Что внутри

- `backend/` - FastAPI, SQLite, bcrypt, JWT access + refresh.
- `frontend/` - React + Vite, React Hook Form, Zod, React Router, axios interceptors.
- Ручки API:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /me`
  - `GET /admin/users`

## Требования

- Node.js 20+.
- Python 3.11+.

## Запуск бэкенда

```powershell
cd E:\Python\Test_registration_form\backend
```

```powershell
python -m venv .venv
```
```powershell
.\.venv\Scripts\Activate.ps1
```
```powershell
pip install -r requirements.txt
```
```powershell
uvicorn main:app --reload --port 9124
```

После запуска:

- API: http://localhost:9124
- Swagger: http://localhost:9124/docs
- Health check: http://localhost:9124/health

SQLite база появится в `backend/app.db`.

## Запуск фронтенда

Во втором терминале:

```powershell
cd E:\Python\Test_registration_form\frontend
```
```powershell
npm install
```
```powershell
npm run dev
```

После запуска:

- Frontend: http://127.0.0.1:5173

## Как проверять промежуточный этап на фронте

1. Открой http://127.0.0.1:5173.
2. Открой DevTools в браузере.
3. Перейди во вкладку `Network`.
4. Включи фильтр `Fetch/XHR`.
5. Заполни форму регистрации.
6. Нажми отправку формы.
7. В `Network` открой запрос `auth/register`.
8. Смотри:
   - `Payload` - что реально ушло с фронта на бэк.
   - `Response` - что реально вернул бэк.
   - `Headers` - метод, URL, статус, content-type, authorization.

Дополнительно в самом приложении справа есть панель `Trace`. Она показывает:

- `rawForm` - сырые значения, которые React Hook Form получил из input/select.
- `parsedPayload` - результат Zod-валидации и преобразования.
- `requestBody` - тело, которое axios отправил на API.
- `responseBody` - ответ FastAPI.

Именно это помогает увидеть, например, что email был введен как ` Ada@Example.COM `, а на бэк ушел уже как `ada@example.com`.

## Тренировочный сценарий

1. Зарегистрируй пользователя с ролью `user`.
2. Сравни `rawForm`, `parsedPayload`, `requestBody`, `responseBody`.
3. Открой `/me` и проверь, что axios отправляет `Authorization: Bearer <access_token>`.
4. Открой `/admin/users` под обычным пользователем - должен быть `403`.
5. Зарегистрируй пользователя с ролью `admin`.
6. Открой `/admin/users` под admin - должен вернуться список пользователей.
7. Сравни ответы в Swagger и во фронтовом `Network/Trace`.

## Таблица сравнения

Можно вести такую таблицу:

| Действие | Frontend route | API endpoint | Raw form | Request JSON | Response JSON | Статус | Совпадает со Swagger? | Комментарий |
|---|---|---|---|---|---|---|---|---|
| Регистрация | `/register` | `POST /auth/register` | данные из формы | payload после Zod | user + tokens | 201 | да/нет | email trim/lowercase |
| Логин | `/login` | `POST /auth/login` | email/password | payload после Zod | user + tokens | 200 | да/нет | access/refresh сохранены |
| Кабинет | `/me` | `GET /me` | нет | нет body | user | 200 | да/нет | нужен Bearer token |
| Пользователи | `/admin/users` | `GET /admin/users` | нет | нет body | users[] | 200/403 | да/нет | зависит от роли |

## Полезные места в коде

- Фронтовая обработка формы: `frontend/src/main.tsx`.
- Zod-преобразования: `frontend/src/schemas.ts`.
- Axios interceptors и trace-запросы: `frontend/src/api.ts`.
- FastAPI ручки: `backend/main.py`.

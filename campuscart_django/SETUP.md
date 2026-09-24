# CampusCart Backend — Auth Module (Django + MongoDB via Djongo)

## What changed from the old Java version
- MySQL -> MongoDB (via Djongo, so you still write normal Django models)
- Java Servlets/JDBC -> Python + Django + Django REST Framework
- Hand-rolled JWT -> djangorestframework-simplejwt (standard, well-tested)
- Separate `roles` table -> a `role` field directly on the User document
  (more natural for a document database — no join needed)

## What's included
```
campuscart_django/
  manage.py
  requirements.txt
  campuscart_backend/
    settings.py    -> Djongo/MongoDB config, JWT config, installed apps
    urls.py        -> routes /api/auth/ to the accounts app
    wsgi.py
  accounts/
    models.py      -> custom User model (email login, role field)
    serializers.py -> RegisterSerializer, LoginSerializer (JWT)
    views.py        -> RegisterView, LoginView
    urls.py         -> /register/, /login/, /login/refresh/
    admin.py        -> manage users at /admin/
```

## 1. Install MongoDB
Download MongoDB Community Server and install it, then make sure the
MongoDB service is running (it listens on port 27017 by default).
You do **not** need to manually create the `campuscart` database —
Django/Djongo creates it automatically when you run migrations.

## 2. Set up a Python virtual environment
```
cd campuscart_django
python -m venv venv
venv\Scripts\activate        (Windows)
source venv/bin/activate     (Mac/Linux)
```

## 3. Install dependencies
```
pip install -r requirements.txt
```
If you hit an error about `sqlparse` version conflicts, that's the known
Djongo issue — the pinned `sqlparse==0.2.4` in requirements.txt already
handles it, just make sure nothing else upgraded it afterward.

## 4. Run migrations
This is what actually creates the collections in MongoDB:
```
python manage.py makemigrations accounts
python manage.py migrate
```

## 5. Create an admin account (optional, for /admin/ access)
```
python manage.py createsuperuser
```
It will ask for email, full name, and password (no username, since we
log in with email).

## 6. Run the server
```
python manage.py runserver
```
Your API is now live at http://localhost:8000/

## 7. Test the two endpoints
**Register:**
```
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{"full_name":"Kapil Kapse","email":"kapil@example.com","password":"test12345","college_id":"1272251110","phone":"9999999999"}
```

**Login:**
```
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{"email":"kapil@example.com","password":"test12345"}
```
A successful login returns `access` and `refresh` JWTs, plus `userId`,
`fullName`, and `role`. The React app should store the `access` token and
send it as `Authorization: Bearer <token>` on protected requests.

## Common pitfalls to know about upfront
- **Django/Djongo version drift**: if you `pip install` anything without
  specifying a version and it pulls in Django 4.x or 5.x, Djongo will
  break with confusing SQL-parsing errors. Stick to the versions pinned
  in requirements.txt.
- **MongoDB not running**: if `migrate` hangs or times out, check the
  MongoDB service is actually running before troubleshooting Django.
- **Djongo doesn't support every Django ORM feature** (some advanced
  aggregations, some `Meta` options) — for the Auth module this doesn't
  matter, but keep it in mind for later modules with more complex queries.

## What's next
Once register -> login -> token is confirmed working, the next module is
**Product Listings**. In MongoDB terms, product images can be embedded
directly as a list field on the product document instead of a separate
collection — a good example of "thinking in documents" instead of
directly translating the old relational tables one-for-one.

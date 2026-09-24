# CampusCart 🛒🎓

CampusCart is a full-stack campus marketplace platform allowing students to buy and sell used books, electronics, bicycles, stationery, and other items within their university community.

---

## 🛠️ Tech Stack

### Frontend
- **React (Vite)**
- **Tailwind CSS**
- **React Router DOM**
- **Axios**

### Backend
- **Python / Django REST Framework**
- **Authentication & Token Management**
- **MongoDB**

---

## 📁 Project Structure

```text
CampusCart/
├── campuscart-frontend/     # React + Vite frontend application
└── campuscart_django/       # Django REST framework backend
```

---

## 🚀 Getting Started

### 1. Backend Setup (Django)

```bash
cd campuscart_django
# Create & activate virtual environment (optional)
python -m venv venv
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start backend server
python manage.py runserver
```
Backend runs at `http://127.0.0.1:8000`.

### 2. Frontend Setup (React + Vite)

```bash
cd campuscart-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend runs at `http://localhost:5173`.

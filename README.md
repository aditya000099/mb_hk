# Reddit Clone

A full-stack, pixel-faithful clone of Reddit, built with **React (Vite)** and **FastAPI**.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS v4, Zustand, React Router v6, TanStack Query.
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL, Redis.

---

## 🚀 Getting Started

Follow these instructions to set up the project locally from scratch.

### Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or via Docker)
- [Redis](https://redis.io/) (Running locally or via Docker)
- Git

---

### 1. Clone the Repository

First, clone the project from Git and navigate into the root directory:

```bash
git clone <your-repository-url>
cd mb_hk
```

---

### 2. Backend Setup (FastAPI)

We've designed the backend to be as easy to set up as possible using standard Python virtual environments.

**Step 2.1: Navigate to the backend directory**
```bash
cd backend
```

**Step 2.2: Create and activate a virtual environment**
```bash
python -m venv .venv

# On macOS / Linux:
source .venv/bin/activate

# On Windows:
.venv\Scripts\activate
```

**Step 2.3: Install the dependencies**
```bash
pip install -r requirements.txt
```

**Step 2.4: Configure Environment Variables**
Copy the example environment file and configure your local settings (specifically the Database URL and Redis URL).
```bash
cp .env.example .env
```
*Note: Make sure your local PostgreSQL and Redis servers are running, and update `.env` with the correct connection strings.*

**Step 2.5: Run Database Migrations**
If you are using Alembic, run the migrations to create the necessary tables in your database:
```bash
alembic upgrade head
```

**Step 2.6: Start the Backend Server**
Start the FastAPI server with hot-reloading enabled:
```bash
fastapi dev app/main.py
# OR
uvicorn app.main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`, and interactive docs at `http://localhost:8000/docs`.*

---

### 3. Frontend Setup (React + Vite)

Open a **new terminal window/tab** (keep the backend running).

**Step 3.1: Navigate to the frontend directory**
```bash
cd frontend
```

**Step 3.2: Install dependencies**
```bash
npm install
```

**Step 3.3: Configure Environment Variables**
If required, set up the frontend environment variables to point to your local backend.
```bash
cp .env.example .env.local
```
*(By default, Vite is configured to proxy `/api` requests to `http://localhost:8000` via `vite.config.js`).*

**Step 3.4: Start the Frontend Development Server**
```bash
npm run dev
```
*The app will automatically open or be available at `http://localhost:5173` (or `5174` depending on availability).*

---

## 🏗️ Project Structure

```text
mb_hk/
├── backend/          # FastAPI Python Backend
│   ├── app/          # Source code (routers, models, schemas, services)
│   ├── tests/        # Pytest suite
│   ├── .venv/        # Virtual environment
│   └── requirements.txt
│
└── frontend/         # React + Vite Frontend
    ├── src/          # Source code (components, pages, store, api)
    ├── package.json  # Node dependencies
    └── vite.config.js
```

## 🤝 Development Workflow

1. Start your database services (Postgres, Redis).
2. Start the Backend: `cd backend && source .venv/bin/activate && fastapi dev app/main.py`
3. Start the Frontend: `cd frontend && npm run dev`
4. Code! The frontend uses Tailwind CSS v4 and hot module replacement (HMR) for an ultra-fast dev experience.
